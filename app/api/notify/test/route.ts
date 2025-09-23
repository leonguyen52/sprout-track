import { NextRequest, NextResponse } from 'next/server';
import { withAuthContext } from '@/app/api/utils/auth';

type TestBody = {
  hermesApiKey: string;
  hermesApiEndpoint: string;
  notificationTitle: string;
  notificationFeedSubtitle: string;
  notificationFeedBody: string;
  notificationDiaperSubtitle: string;
  notificationDiaperBody: string;
  type: 'FEED' | 'DIAPER';
};

async function post(req: NextRequest, auth: any) {
  try {
    const { familyId } = auth;
    if (!familyId) {
      return NextResponse.json({ success: false, error: 'No family context' }, { status: 403 });
    }
    
    const body = (await req.json()) as TestBody;
    if (!body?.hermesApiKey || !body?.type) {
      return NextResponse.json({ success: false, error: 'API key and type are required' }, { status: 400 });
    }

    const endpoint = body.hermesApiEndpoint || 'https://hermes.funk-isoft.com/api/sendAlert';
    
    const payload = body.type === 'FEED'
      ? {
          title: body.notificationTitle,
          subtitle: body.notificationFeedSubtitle || undefined,
          body: body.notificationFeedBody,
          name: 'Baby Tracker',
          sound: 'alert'
        }
      : {
          title: body.notificationTitle,
          subtitle: body.notificationDiaperSubtitle || undefined,
          body: body.notificationDiaperBody,
          name: 'Baby Tracker',
          sound: 'alert'
        };

    console.log('Sending test notification to:', endpoint);
    console.log('Payload:', payload);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': body.hermesApiKey, // No "Bearer " prefix according to docs
      },
      body: JSON.stringify(payload),
    });

    console.log('Hermes response status:', response.status);
    
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.log('Hermes error response:', text);
      return NextResponse.json({ 
        success: false, 
        error: text || `Hermes API returned ${response.status}` 
      }, { status: 200 }); // Return 200 so client can see the error message
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ 
      success: false, 
      error: e?.message || 'Failed to send test notification' 
    }, { status: 500 });
  }
}

export const POST = withAuthContext(post);
