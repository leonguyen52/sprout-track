import { NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse } from '../types';
import { Unit } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityType = searchParams.get('activityType');
    
    console.log(`Received request for units with activityType: ${activityType}`);
    
    // Fetch all units with explicit selection of all fields
    const allUnits = await prisma.unit.findMany({
      select: {
        id: true,
        unitAbbr: true,
        unitName: true,
        activityTypes: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        unitName: 'asc',
      },
    });

    console.log(`Found ${allUnits.length} total units`);
    
    // Debug: Log all units and their activityTypes
    allUnits.forEach(unit => {
      console.log(`Unit: ${unit.unitAbbr}, ActivityTypes: ${unit.activityTypes || 'null'}`);
    });

    // If activityType is specified, filter units on the server side
    let filteredUnits = allUnits;
    if (activityType) {
      console.log(`Filtering units for activityType: ${activityType}`);
      
      // Simpler approach: just check if the activityType string is contained within the activityTypes field
      filteredUnits = allUnits.filter(unit => {
        if (!unit.activityTypes) {
          return false;
        }
        
        const activityTypeLower = activityType.toLowerCase();
        const unitTypesLower = unit.activityTypes.toLowerCase();
        
        // Check if the activityType is contained in the activityTypes string
        const included = unitTypesLower.includes(activityTypeLower);
        
        console.log(`Unit ${unit.unitAbbr} has types "${unit.activityTypes}", includes "${activityType}": ${included}`);
        
        return included;
      });
      
      console.log(`Filtered to ${filteredUnits.length} units for activityType: ${activityType}`);
      
      // If no units match the filter, return all units as a fallback
      if (filteredUnits.length === 0) {
        console.log(`No units found for "${activityType}", returning all units as fallback`);
        filteredUnits = allUnits;
      }
    }

    return NextResponse.json<ApiResponse<Unit[]>>({
      success: true,
      data: filteredUnits,
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json<ApiResponse<Unit[]>>(
      {
        success: false,
        error: 'Failed to fetch units',
      },
      { status: 500 }
    );
  }
}
