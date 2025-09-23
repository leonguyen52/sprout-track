import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { sendHermesNotification } from '@/src/lib/notifications/hermes';

// Global monitoring state
let monitoringActive = false;
let monitoringInterval: NodeJS.Timeout | null = null;

// Monitoring configuration
const MONITORING_INTERVAL = 1 * 60 * 1000; // 1 minute
const DEDUPLICATION_WINDOW = 60 * 60 * 1000; // 60 minutes

interface BabyWithWarnings {
  id: string;
  firstName: string;
  lastName: string;
  familyId: string;
  feedWarningTime: string;
  diaperWarningTime: string;
  lastFeedTime: Date | null;
  lastDiaperTime: Date | null;
}

function getWarningMinutes(warningTime: string): number {
  const [hours, minutes] = warningTime.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateDurationMinutes(startTime: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - startTime.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

async function checkBabyWarnings(baby: BabyWithWarnings, settings: any): Promise<Array<{
  type: 'FEED' | 'DIAPER';
  babyId: string;
  babyName: string;
  duration: number;
  threshold: number;
}>> {
  const warnings: Array<{
    type: 'FEED' | 'DIAPER';
    babyId: string;
    babyName: string;
    duration: number;
    threshold: number;
  }> = [];
  
  // Check feed warning
  if (baby.lastFeedTime) {
    const feedDuration = calculateDurationMinutes(baby.lastFeedTime);
    const feedWarningThreshold = getWarningMinutes(baby.feedWarningTime);
    const feedAdvance = Math.max(0, Number((settings as any)?.notificationFeedAdvanceMinutes ?? 0));
    const feedEffective = Math.max(0, feedWarningThreshold - feedAdvance);
    
    if (feedDuration >= feedEffective) {
      warnings.push({
        type: 'FEED' as const,
        babyId: baby.id,
        babyName: `${baby.firstName} ${baby.lastName}`,
        duration: feedDuration,
        threshold: feedEffective
      });
    }
  }
  
  // Check diaper warning
  if (baby.lastDiaperTime) {
    const diaperDuration = calculateDurationMinutes(baby.lastDiaperTime);
    const diaperWarningThreshold = getWarningMinutes(baby.diaperWarningTime);
    const diaperAdvance = Math.max(0, Number((settings as any)?.notificationDiaperAdvanceMinutes ?? 0));
    const diaperEffective = Math.max(0, diaperWarningThreshold - diaperAdvance);
    
    if (diaperDuration >= diaperEffective) {
      warnings.push({
        type: 'DIAPER' as const,
        babyId: baby.id,
        babyName: `${baby.firstName} ${baby.lastName}`,
        duration: diaperDuration,
        threshold: diaperEffective
      });
    }
  }
  
  return warnings;
}

async function processWarnings() {
  try {
    console.log(`[${new Date().toISOString()}] Starting warning monitoring check...`);
    
    // Get all active babies with their last activity times
    const babies = await prisma.baby.findMany({
      where: { inactive: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        familyId: true,
        feedWarningTime: true,
        diaperWarningTime: true,
        feedLogs: {
          select: { time: true },
          orderBy: { time: 'desc' },
          take: 1
        },
        diaperLogs: {
          select: { time: true },
          orderBy: { time: 'desc' },
          take: 1
        }
      }
    });

    // Transform data for easier processing
    const babiesWithWarnings: BabyWithWarnings[] = babies.map(baby => ({
      id: baby.id,
      firstName: baby.firstName,
      lastName: baby.lastName,
      familyId: baby.familyId!,
      feedWarningTime: baby.feedWarningTime,
      diaperWarningTime: baby.diaperWarningTime,
      lastFeedTime: baby.feedLogs[0]?.time || null,
      lastDiaperTime: baby.diaperLogs[0]?.time || null
    }));

    // Group babies by family for efficient settings lookup
    const familiesMap = new Map<string, any>();
    
    for (const baby of babiesWithWarnings) {
      if (!familiesMap.has(baby.familyId)) {
        const settings = await prisma.settings.findFirst({
          where: { familyId: baby.familyId }
        });
        familiesMap.set(baby.familyId, settings);
      }
    }

    let totalWarnings = 0;
    let notificationsSent = 0;

    // Process each baby
    for (const baby of babiesWithWarnings) {
      const settings = familiesMap.get(baby.familyId);
      
      // Skip if notifications are disabled for this family
      if (!settings || !(settings as any).notificationEnabled) {
        continue;
      }

      const warnings = await checkBabyWarnings(baby, settings);
      totalWarnings += warnings.length;

      // Process each warning
      for (const warning of warnings) {
        // Check deduplication
        const oneHourAgo = new Date(Date.now() - DEDUPLICATION_WINDOW);
        const recent = await (prisma as any).notificationLog.findFirst({
          where: { 
            babyId: warning.babyId, 
            type: warning.type, 
            sentAt: { gt: oneHourAgo } 
          },
          orderBy: { sentAt: 'desc' }
        });

        if (recent) {
          console.log(`[${new Date().toISOString()}] Skipping ${warning.type} warning for ${warning.babyName} - already sent recently`);
          continue;
        }

        // Send notification
        const payload = warning.type === 'FEED'
          ? {
              title: (settings as any).notificationTitle,
              subtitle: (settings as any).notificationFeedSubtitle || undefined,
              body: (settings as any).notificationFeedBody,
              name: 'Baby Tracker',
              sound: 'alert'
            }
          : {
              title: (settings as any).notificationTitle,
              subtitle: (settings as any).notificationDiaperSubtitle || undefined,
              body: (settings as any).notificationDiaperBody,
              name: 'Baby Tracker',
              sound: 'alert'
            };

        const result = await sendHermesNotification(baby.familyId, payload);
        
        if (result.success) {
          // Log the notification
          await (prisma as any).notificationLog.create({
            data: {
              babyId: warning.babyId,
              type: warning.type,
              familyId: baby.familyId
            }
          });
          
          notificationsSent++;
          console.log(`[${new Date().toISOString()}] Sent ${warning.type} warning for ${warning.babyName} (${warning.duration}min >= ${warning.threshold}min)`);
        } else {
          console.error(`[${new Date().toISOString()}] Failed to send ${warning.type} warning for ${warning.babyName}: ${result.error}`);
        }
      }
    }

    console.log(`[${new Date().toISOString()}] Monitoring check complete: ${totalWarnings} warnings found, ${notificationsSent} notifications sent`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in warning monitoring:`, error);
  }
}

function startMonitoring() {
  if (monitoringActive) {
    console.log('Monitoring is already active');
    return;
  }

  console.log(`Starting warning monitoring (interval: ${MONITORING_INTERVAL / 1000}s)`);
  monitoringActive = true;
  
  // Run immediately
  processWarnings();
  
  // Then run on interval
  monitoringInterval = setInterval(processWarnings, MONITORING_INTERVAL);
}

function stopMonitoring() {
  if (!monitoringActive) {
    console.log('Monitoring is not active');
    return;
  }

  console.log('Stopping warning monitoring');
  monitoringActive = false;
  
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

// API Routes
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  switch (action) {
    case 'start':
      startMonitoring();
      return NextResponse.json({ 
        success: true, 
        message: 'Warning monitoring started',
        active: monitoringActive 
      });

    case 'stop':
      stopMonitoring();
      return NextResponse.json({ 
        success: true, 
        message: 'Warning monitoring stopped',
        active: monitoringActive 
      });

    case 'status':
      return NextResponse.json({ 
        success: true, 
        active: monitoringActive,
        interval: MONITORING_INTERVAL / 1000 
      });

    case 'check':
      await processWarnings();
      return NextResponse.json({ 
        success: true, 
        message: 'Manual warning check completed' 
      });

    default:
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid action. Use: start, stop, status, or check' 
      }, { status: 400 });
  }
}

// Auto-start monitoring when the module loads (in production)
if (process.env.NODE_ENV === 'production') {
  startMonitoring();
}
