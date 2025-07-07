import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '../../db';
import { withAuthContext, ApiResponse, AuthResult } from '../../utils/auth';

// Helper to ensure database is closed before operations
async function disconnectPrisma() {
  await prisma.$disconnect();
}

async function handler(request: NextRequest, authContext: AuthResult): Promise<NextResponse<ApiResponse<any>>> {
  try {
    console.log('Starting initial setup database restore...');
    
    // Ensure database connection is closed
    await disconnectPrisma();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        { 
          success: false, 
          error: 'No file provided' 
        }, 
        { status: 400 }
      );
    }

    const dbPath = path.resolve('./db/baby-tracker.db');
    
    // Create buffer from file
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Validate file is a SQLite database
    if (!buffer.toString('utf8', 0, 16).includes('SQLite')) {
      return NextResponse.json<ApiResponse<null>>(
        { 
          success: false, 
          error: 'Invalid database file - must be a valid SQLite database' 
        }, 
        { status: 400 }
      );
    }
    
    // Create backup of existing database if it exists
    if (fs.existsSync(dbPath)) {
      const backupPath = `${dbPath}.backup-${new Date().toISOString().split('T')[0]}`;
      await fs.promises.copyFile(dbPath, backupPath);
      console.log('✓ Existing database backed up');
    }
    
    // Write new database file
    await fs.promises.writeFile(dbPath, buffer);
    console.log('✓ Database file restored successfully');
    
    return NextResponse.json<ApiResponse<null>>({ 
      success: true,
      data: null 
    });
  } catch (error) {
    console.error('💥 Initial setup restore failed:', error);
    return NextResponse.json<ApiResponse<null>>(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to restore backup during initial setup'
      }, 
      { status: 500 }
    );
  }
}

// Export the POST handler with auth context (allows system admin and setup auth)
export const POST = withAuthContext(handler); 