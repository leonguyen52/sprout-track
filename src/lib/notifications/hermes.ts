import prisma from '../../../prisma/db';

type HermesPayload = {
  title: string;
  subtitle?: string;
  body: string;
};

export async function sendHermesNotification(
  familyId: string,
  payload: HermesPayload
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const settings = await prisma.settings.findFirst({ where: { familyId } });
    if (!settings || !(settings as any).notificationEnabled) {
      return { success: false, error: 'Notifications disabled' };
    }

    const endpoint = 'https://hermes.funk-isoft.com/api/sendAlert';
    const apiKey = (settings as any).hermesApiKey as string | undefined;
    if (!apiKey) {
      return { success: false, error: 'Hermes API key missing' };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey, // No "Bearer " prefix according to docs
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { success: false, error: text || `Hermes error ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown Hermes error' };
  }
}


