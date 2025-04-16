import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, ActivitySettings } from '../types';
import { withAuth } from '../utils/auth';

/**
 * GET /api/activity-settings
 * 
 * Retrieves activity settings for the current user
 * If caretakerId is provided, retrieves settings for that caretaker
 * Otherwise, retrieves global settings
 */
async function getActivitySettings(req: NextRequest): Promise<NextResponse<ApiResponse<ActivitySettings>>> {
  try {
    // Get caretakerId from query params if provided
    const url = new URL(req.url);
    const caretakerId = url.searchParams.get('caretakerId');
    
    console.log(`GET /api/activity-settings - caretakerId: ${caretakerId || 'null'}`);
    
    // Default settings to use if none are found
    const defaultSettings: ActivitySettings = {
      order: ['sleep', 'feed', 'diaper', 'note', 'bath', 'pump', 'measurement', 'milestone', 'medicine'],
      visible: ['sleep', 'feed', 'diaper', 'note', 'bath', 'pump', 'measurement', 'milestone', 'medicine'],
      caretakerId: caretakerId || null,
    };
    
    // Get settings from database
    const settings = await prisma.settings.findFirst({
      where: { id: { not: '' } }, // Get any settings record
      orderBy: { updatedAt: 'desc' },
    });

    // If no settings record exists, return default settings
    if (!settings) {
      console.log('No settings record found, returning default settings');
      return NextResponse.json({ success: true, data: defaultSettings });
    }

    // Use type assertion to access activitySettings
    const settingsWithActivity = settings as unknown as (typeof settings & { activitySettings?: string });
    
    // If activitySettings field is empty, return default settings
    if (!settingsWithActivity.activitySettings) {
      console.log('No activitySettings found, returning default settings');
      return NextResponse.json({ success: true, data: defaultSettings });
    }

    // Parse stored settings
    let allSettings: Record<string, { order: string[], visible: string[] }>;
    try {
      allSettings = JSON.parse(settingsWithActivity.activitySettings);
    } catch (parseError) {
      console.error('Error parsing activitySettings JSON:', parseError);
      return NextResponse.json({ success: true, data: defaultSettings });
    }
    
    // If caretakerId is provided, try to get caretaker-specific settings
    if (caretakerId) {
      // If caretaker-specific settings exist, return them
      if (allSettings[caretakerId]) {
        console.log(`Found settings for caretakerId: ${caretakerId}`);
        return NextResponse.json({ 
          success: true, 
          data: {
            ...allSettings[caretakerId],
            caretakerId
          }
        });
      }
      
      // If no caretaker-specific settings exist but global settings do, return global settings
      // This ensures caretakers get default settings until they customize them
      if (allSettings.global) {
        console.log(`No settings for caretakerId: ${caretakerId}, using global settings`);
        return NextResponse.json({ 
          success: true, 
          data: {
            ...allSettings.global,
            caretakerId // Still include the caretakerId so it's saved with their settings
          }
        });
      }
      
      console.log(`No settings for caretakerId: ${caretakerId} and no global settings, using defaults`);
    }
    
    // Return global settings or default if no settings exist
    return NextResponse.json({ 
      success: true, 
      data: {
        ...(allSettings.global || defaultSettings),
        caretakerId: null
      }
    });
  } catch (error) {
    console.error('Error retrieving activity settings:', error);
    // Return default settings even in case of error
    const url = new URL(req.url);
    const errorCaretakerId = url.searchParams.get('caretakerId');
    
    return NextResponse.json({ 
      success: true, 
      data: {
        order: ['sleep', 'feed', 'diaper', 'note', 'bath', 'pump', 'measurement', 'milestone'],
        visible: ['sleep', 'feed', 'diaper', 'note', 'bath', 'pump', 'measurement', 'milestone'],
        caretakerId: errorCaretakerId || null,
      }
    });
  }
}

/**
 * POST /api/activity-settings
 * 
 * Saves activity settings for the current user
 * If caretakerId is provided in the body, saves settings for that caretaker
 * Otherwise, saves global settings
 */
async function saveActivitySettings(req: NextRequest): Promise<NextResponse<ApiResponse<ActivitySettings>>> {
  try {
    const body = await req.json();
    const { order, visible, caretakerId } = body as ActivitySettings;

    console.log(`POST /api/activity-settings - caretakerId: ${caretakerId || 'null'}`);

    // Validate input
    if (!order || !Array.isArray(order) || !visible || !Array.isArray(visible)) {
      console.error('Invalid activity settings format:', { order, visible });
      return NextResponse.json(
        { success: false, error: 'Invalid activity settings format' },
        { status: 400 }
      );
    }

    // Get current settings
    let currentSettings = await prisma.settings.findFirst({
      where: { id: { not: '' } },
      orderBy: { updatedAt: 'desc' },
    });

    // If no settings record exists, create one
    if (!currentSettings) {
      console.log('No settings record found, creating a new one');
      currentSettings = await prisma.settings.create({
        data: {
          familyName: 'My Family',
          securityPin: '111222',
          defaultBottleUnit: 'OZ',
          defaultSolidsUnit: 'TBSP',
          defaultHeightUnit: 'IN',
          defaultWeightUnit: 'LB',
          defaultTempUnit: 'F',
          activitySettings: JSON.stringify({
            global: {
              order: ['sleep', 'feed', 'diaper', 'note', 'bath', 'pump', 'measurement', 'milestone'],
              visible: ['sleep', 'feed', 'diaper', 'note', 'bath', 'pump', 'measurement', 'milestone']
            }
          })
        }
      });
    }

    // Use type assertion to access activitySettings
    const currentSettingsWithActivity = currentSettings as unknown as (typeof currentSettings & { activitySettings?: string });
    
    // Parse existing activity settings or create new object
    let allSettings: Record<string, { order: string[], visible: string[] }> = {};
    if (currentSettingsWithActivity?.activitySettings) {
      try {
        allSettings = JSON.parse(currentSettingsWithActivity.activitySettings);
      } catch (e) {
        console.error('Error parsing existing activity settings:', e);
        // If parsing fails, start with a fresh object
        allSettings = {};
      }
    }

    // Update settings for the specific caretaker or global settings
    const settingsKey = caretakerId || 'global';
    
    // Create a new settings object that preserves all existing settings
    const newSettings = {
      ...allSettings,
      [settingsKey]: {
        order,
        visible
      }
    };
    
    // Ensure we're not accidentally removing other caretakers' settings
    allSettings = newSettings;

    console.log(`Saving settings for ${settingsKey}:`, newSettings[settingsKey]);

    // Save to database using type assertion for the data object
    const updatedSettings = await prisma.settings.update({
      where: { id: currentSettings.id },
      data: {
        // Use type assertion to allow activitySettings property
        ...(({ activitySettings: JSON.stringify(allSettings) }) as any)
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        order,
        visible,
        caretakerId: caretakerId || null
      }
    });
  } catch (error) {
    console.error('Error saving activity settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save activity settings' },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withAuth(getActivitySettings);
export const POST = withAuth(saveActivitySettings);
