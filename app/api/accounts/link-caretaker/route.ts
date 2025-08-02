import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, ApiResponse } from '../../utils/auth';
import prisma from '../../db';

interface LinkCaretakerRequest {
  caretakerId: string;
}

interface LinkCaretakerResponse {
  success: boolean;
  message: string;
}

async function handler(req: NextRequest): Promise<NextResponse<ApiResponse<LinkCaretakerResponse>>> {
  try {
    const authResult = await getAuthenticatedUser(req);
    
    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }
    
    if (!authResult.isAccountAuth || !authResult.accountId) {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: 'This endpoint is only available for account users'
        },
        { status: 403 }
      );
    }
    
    const body: LinkCaretakerRequest = await req.json();
    const { caretakerId } = body;
    
    if (!caretakerId || typeof caretakerId !== 'string') {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: 'Caretaker ID is required'
        },
        { status: 400 }
      );
    }
    
    // Verify the caretaker exists and belongs to the account's family
    const account = await prisma.account.findUnique({
      where: { id: authResult.accountId },
      include: { family: true }
    });
    
    if (!account) {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: 'Account not found'
        },
        { status: 404 }
      );
    }
    
    if (!account.familyId) {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: 'Account is not associated with a family'
        },
        { status: 400 }
      );
    }
    
    // Verify the caretaker exists and belongs to the same family
    const caretaker = await prisma.caretaker.findUnique({
      where: { id: caretakerId }
    });
    
    if (!caretaker) {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: 'Caretaker not found'
        },
        { status: 404 }
      );
    }
    
    if (caretaker.familyId !== account.familyId) {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: 'Caretaker does not belong to your family'
        },
        { status: 403 }
      );
    }
    
    // Update both sides of the relationship in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the account to link to this caretaker
      await tx.account.update({
        where: { id: authResult.accountId },
        data: { caretakerId }
      });
      
      // Update the caretaker to link to this account
      await tx.caretaker.update({
        where: { id: caretakerId },
        data: { accountId: authResult.accountId }
      });
    });
    
    console.log(`Linked account ${authResult.accountId} to caretaker ${caretakerId} (bidirectional)`);
    
    return NextResponse.json<ApiResponse<LinkCaretakerResponse>>({
      success: true,
      data: {
        success: true,
        message: 'Account successfully linked to caretaker'
      }
    });
    
  } catch (error) {
    console.error('Link caretaker error:', error);
    return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
      {
        success: false,
        error: 'Failed to link caretaker to account. Please try again.'
      },
      { status: 500 }
    );
  }
}

export const POST = handler;