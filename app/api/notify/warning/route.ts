import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../db';
import { withAuthContext } from '@/app/api/utils/auth';
import { sendHermesNotification } from '@/src/lib/notifications/hermes';

type Body = {
  babyId: string;
  type: 'FEED' | 'DIAPER';
};

async function post(req: NextRequest, auth: any) {
  try {
    const { familyId } = auth;
    if (!familyId) {
      return NextResponse.json({ success: false, error: 'No family context' }, { status: 403 });
    }
    const body = (await req.json()) as Body;
    if (!body?.babyId || !body?.type) {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 });
    }

    const baby = await prisma.baby.findFirst({ where: { id: body.babyId, familyId } });
    if (!baby) {
      return NextResponse.json({ success: false, error: 'Baby not found' }, { status: 404 });
    }

    const settings = await prisma.settings.findFirst({ where: { familyId } });
    if (!settings || !(settings as any).notificationEnabled) {
      return NextResponse.json({ success: false, error: 'Notifications are disabled' }, { status: 400 });
    }

    // Deduplicate: do not send same type within last 60 minutes
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await (prisma as any).notificationLog.findFirst({
      where: { babyId: body.babyId, type: body.type, sentAt: { gt: oneHourAgo } },
      orderBy: { sentAt: 'desc' },
    });
    if (recent) {
      return NextResponse.json({ success: true, data: { skipped: true } });
    }

    const s: any = settings as any;
    const payload = body.type === 'FEED'
      ? {
          title: s.notificationTitle,
          subtitle: s.notificationFeedSubtitle || undefined,
          body: s.notificationFeedBody,
          name: 'Baby Tracker',
          sound: 'alert'
        }
      : {
          title: s.notificationTitle,
          subtitle: s.notificationDiaperSubtitle || undefined,
          body: s.notificationDiaperBody,
          name: 'Baby Tracker',
          sound: 'alert'
        };

    const result = await sendHermesNotification(familyId, payload);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }

    await (prisma as any).notificationLog.create({ data: { babyId: body.babyId, type: body.type, familyId } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to send' }, { status: 500 });
  }
}

export const POST = withAuthContext(post);


