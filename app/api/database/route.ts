import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '../db';
import { withSysAdminAuth, ApiResponse } from '../utils/auth';

// Helper to ensure database is closed before operations
async function disconnectPrisma() {
  await prisma.$disconnect();
}

// Original GET handler
async function getHandler(req: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    // Ensure database connection is closed
    await disconnectPrisma();

    const dbPath = path.resolve('./db/baby-tracker.db');
    
    // Read the database file
    const dbContent = await fs.promises.readFile(dbPath);
    
    // Create response with the file content
    const response = new NextResponse(dbContent);
    
    // Set headers for file download
    response.headers.set('Content-Type', 'application/octet-stream');
    response.headers.set('Content-Disposition', `attachment; filename="baby-tracker-backup-${new Date().toISOString().split('T')[0]}.db"`);
    
    return response as unknown as NextResponse<ApiResponse<any>>;
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { 
        success: false, 
        error: 'Failed to create backup' 
      }, 
      { status: 500 }
    );
  }
}

// Original POST handler
async function postHandler(req: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    // Ensure database connection is closed
    await disconnectPrisma();

    const formData = await req.formData();
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
          error: 'Invalid database file' 
        }, 
        { status: 400 }
      );
    }
    
    // Create backup of existing database
    const backupPath = `${dbPath}.backup-${new Date().toISOString().split('T')[0]}`;
    await fs.promises.copyFile(dbPath, backupPath);
    
    // Write new database file
    await fs.promises.writeFile(dbPath, buffer);
    
    return NextResponse.json<ApiResponse<null>>({ success: true });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { 
        success: false, 
        error: 'Failed to restore backup' 
      }, 
      { status: 500 }
    );
  }
}

// Export the wrapped handlers with authentication
// Database operations should only be accessible to system administrators
export const GET = withSysAdminAuth(getHandler);
export const POST = withSysAdminAuth(postHandler);
