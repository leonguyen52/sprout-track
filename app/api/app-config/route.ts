import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse } from '../types';
import { AppConfig } from '@prisma/client';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

/**
 * GET handler for AppConfig
 * Returns the current app configuration with decrypted adminPass
 */
export async function GET(req: NextRequest) {
  try {
    let appConfig = await prisma.appConfig.findFirst();
    
    if (!appConfig) {
      // Create default app config if none exists
      appConfig = await prisma.appConfig.create({
        data: {
          adminPass: encrypt('admin'), // Default encrypted password
          rootDomain: 'localhost',
          enableHttps: false,
        },
      });
    }

    // Decrypt the adminPass for the response
    const decryptedConfig = {
      ...appConfig,
      adminPass: isEncrypted(appConfig.adminPass) ? decrypt(appConfig.adminPass) : appConfig.adminPass,
    };

    return NextResponse.json<ApiResponse<typeof decryptedConfig>>({
      success: true,
      data: decryptedConfig,
    });
  } catch (error) {
    console.error('Error fetching app config:', error);
    return NextResponse.json<ApiResponse<AppConfig>>(
      {
        success: false,
        error: 'Failed to fetch app configuration',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for AppConfig
 * Updates the app configuration with encrypted adminPass
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    let existingConfig = await prisma.appConfig.findFirst();
    
    if (!existingConfig) {
      return NextResponse.json<ApiResponse<AppConfig>>(
        {
          success: false,
          error: 'App configuration not found. Please create one first.',
        },
        { status: 404 }
      );
    }

    const data: Partial<AppConfig> = {};
    const allowedFields: (keyof AppConfig)[] = [
      'adminPass', 'rootDomain', 'enableHttps'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'adminPass') {
          // Encrypt the adminPass before storing
          (data as any)[field] = encrypt(body[field]);
        } else {
          (data as any)[field] = body[field];
        }
      }
    }
    
    const updatedConfig = await prisma.appConfig.update({
      where: { id: existingConfig.id },
      data,
    });

    // Decrypt the adminPass for the response
    const responseConfig = {
      ...updatedConfig,
      adminPass: isEncrypted(updatedConfig.adminPass) ? decrypt(updatedConfig.adminPass) : updatedConfig.adminPass,
    };

    return NextResponse.json<ApiResponse<typeof responseConfig>>({
      success: true,
      data: responseConfig,
    });
  } catch (error) {
    console.error('Error updating app config:', error);
    return NextResponse.json<ApiResponse<AppConfig>>(
      {
        success: false,
        error: 'Failed to update app configuration',
      },
      { status: 500 }
    );
  }
} 