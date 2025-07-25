import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse } from '../types';

// Beta subscriber types
export interface BetaSubscriberResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isOptedIn: boolean;
  optedOutAt: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BetaSubscriberCreate {
  email: string;
  firstName?: string;
  lastName?: string;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body: BetaSubscriberCreate = await req.json();
    
    // Validate email
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Valid email is required',
        },
        { status: 400 }
      );
    }
    
    // Create or update subscriber
    const subscriber = await prisma.betaSubscriber.upsert({
      where: { email: body.email },
      update: { 
        firstName: body.firstName || undefined,
        lastName: body.lastName || undefined,
        isOptedIn: true,
        optedOutAt: null,
        updatedAt: new Date()
      },
      create: {
        email: body.email,
        firstName: body.firstName || undefined,
        lastName: body.lastName || undefined,
        source: 'coming-soon'
      }
    });
    
    // Format response
    const response: BetaSubscriberResponse = {
      id: subscriber.id,
      email: subscriber.email,
      firstName: subscriber.firstName,
      lastName: subscriber.lastName,
      isOptedIn: subscriber.isOptedIn,
      optedOutAt: subscriber.optedOutAt?.toISOString() || null,
      source: subscriber.source,
      createdAt: subscriber.createdAt.toISOString(),
      updatedAt: subscriber.updatedAt.toISOString(),
      deletedAt: subscriber.deletedAt?.toISOString() || null,
    };
    
    return NextResponse.json<ApiResponse<BetaSubscriberResponse>>({
      success: true,
      data: response,
    });
    
  } catch (error) {
    console.error('Beta signup error:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Failed to sign up. Please try again.',
      },
      { status: 500 }
    );
  }
}
