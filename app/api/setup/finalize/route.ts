import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/db';
import { withAuthContext, AuthResult } from '@/app/api/utils/auth';

type FinalizeRequest = {
  name: string;
  slug: string;
  token?: string;
  useSystemPin: boolean;
  systemPin?: string;
  caretakers?: Array<{
    loginId: string;
    name: string;
    type: string;
    role: 'ADMIN' | 'USER';
    securityPin: string;
  }>;
  baby: {
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: 'MALE' | 'FEMALE';
    feedWarningTime: string;
    diaperWarningTime: string;
  };
};

export const POST = withAuthContext(async (req: NextRequest, auth: AuthResult) => {
  try {
    const body = (await req.json()) as FinalizeRequest;

    if (!body.name || !body.slug) {
      return NextResponse.json({ success: false, error: 'Family name and slug are required' }, { status: 400 });
    }

    if (!body.useSystemPin) {
      if (!body.caretakers || body.caretakers.length === 0) {
        return NextResponse.json({ success: false, error: 'At least one caretaker is required' }, { status: 400 });
      }
    } else {
      if (!body.systemPin || body.systemPin.length < 6) {
        return NextResponse.json({ success: false, error: 'Valid system PIN is required' }, { status: 400 });
      }
    }

    // Validate baby
    if (!body.baby || !body.baby.firstName || !body.baby.lastName || !body.baby.birthDate || !body.baby.gender) {
      return NextResponse.json({ success: false, error: 'Baby information is required' }, { status: 400 });
    }

    // Reject if slug is taken
    const slugExists = await prisma.family.findUnique({ where: { slug: body.slug } });
    if (slugExists) {
      return NextResponse.json({ success: false, error: 'That URL is already taken' }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create family, link to account if account auth
      const family = await tx.family.create({
        data: {
          name: body.name,
          slug: body.slug,
          isActive: true,
          ...(auth.isAccountAuth && auth.accountId ? { accountId: auth.accountId } : {}),
        },
      });

      // Create settings
      await tx.settings.create({
        data: {
          familyId: family.id,
          familyName: body.name,
          securityPin: body.useSystemPin && body.systemPin ? body.systemPin : '111222',
          defaultBottleUnit: 'ML',
          defaultSolidsUnit: 'TBSP',
          defaultHeightUnit: 'CM',
          defaultWeightUnit: 'KG',
          defaultTempUnit: 'C',
        },
      });

      // Ensure a system caretaker exists
      const systemCaretaker = await tx.caretaker.create({
        data: {
          loginId: '00',
          name: 'system',
          type: 'System Administrator',
          role: 'ADMIN',
          securityPin: body.useSystemPin && body.systemPin ? body.systemPin : '111222',
          familyId: family.id,
          inactive: false,
        },
      });

      let linkedCaretakerId: string | null = null;

      if (body.useSystemPin) {
        linkedCaretakerId = systemCaretaker.id;
      } else if (body.caretakers && body.caretakers.length > 0) {
        // Create provided caretakers
        for (let i = 0; i < body.caretakers.length; i++) {
          const c = body.caretakers[i];
          const created = await tx.caretaker.create({
            data: {
              loginId: c.loginId,
              name: c.name,
              type: c.type,
              role: c.role,
              securityPin: c.securityPin,
              familyId: family.id,
              inactive: false,
            },
          });
          if (i === 0) {
            linkedCaretakerId = created.id;
          }
        }
      }

      // Create baby
      await tx.baby.create({
        data: {
          firstName: body.baby.firstName,
          lastName: body.baby.lastName,
          birthDate: new Date(body.baby.birthDate),
          gender: body.baby.gender as any,
          feedWarningTime: body.baby.feedWarningTime,
          diaperWarningTime: body.baby.diaperWarningTime,
          familyId: family.id,
        },
      });

      // If account auth, optionally link caretaker to account
      if (auth.isAccountAuth && auth.accountId && linkedCaretakerId) {
        await tx.account.update({
          where: { id: auth.accountId },
          data: { caretakerId: linkedCaretakerId },
        });
      }

      return family;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error finalizing setup:', error);
    return NextResponse.json({ success: false, error: 'Failed to finalize setup' }, { status: 500 });
  }
});


