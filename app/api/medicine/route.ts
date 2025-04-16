import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { ApiResponse, MedicineCreate, MedicineResponse, MedicineUpdate } from '../types';
import { withAuthContext, AuthResult } from '../utils/auth';
import { formatForResponse } from '../utils/timezone';

/**
 * Handle POST request to create a new medicine
 */
async function handlePost(req: NextRequest, authContext: AuthResult) {
  try {
    const body: MedicineCreate = await req.json();
    const { contactIds, ...medicineData } = body;

    // Create the medicine
    const medicine = await prisma.medicine.create({
      data: medicineData,
    });

    // Associate with contacts if provided
    if (contactIds && contactIds.length > 0) {
      const contactMedicineData = contactIds.map(contactId => ({
        contactId,
        medicineId: medicine.id,
      }));

      await prisma.contactMedicine.createMany({
        data: contactMedicineData,
      });
    }

    // Get the medicine with contacts
    const medicineWithContacts = await prisma.medicine.findUnique({
      where: { id: medicine.id },
      include: {
        contacts: {
          include: {
            contact: true,
          },
        },
      },
    });

    if (!medicineWithContacts) {
      throw new Error('Failed to retrieve created medicine');
    }

    // Format dates for response
    const response: MedicineResponse = {
      ...medicineWithContacts,
      createdAt: formatForResponse(medicineWithContacts.createdAt) || '',
      updatedAt: formatForResponse(medicineWithContacts.updatedAt) || '',
      deletedAt: formatForResponse(medicineWithContacts.deletedAt),
    };

    return NextResponse.json<ApiResponse<MedicineResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error creating medicine:', error);
    return NextResponse.json<ApiResponse<MedicineResponse>>(
      {
        success: false,
        error: 'Failed to create medicine',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle PUT request to update a medicine
 */
async function handlePut(req: NextRequest, authContext: AuthResult) {
  try {
    const body: MedicineUpdate = await req.json();
    const { id, contactIds, ...updateData } = body;

    // Check if medicine exists
    const existingMedicine = await prisma.medicine.findUnique({
      where: { id },
    });

    if (!existingMedicine) {
      return NextResponse.json<ApiResponse<MedicineResponse>>(
        {
          success: false,
          error: 'Medicine not found',
        },
        { status: 404 }
      );
    }

    // Update the medicine
    const medicine = await prisma.medicine.update({
      where: { id },
      data: updateData,
    });

    // Update contact associations if provided
    if (contactIds) {
      // Delete existing associations
      await prisma.contactMedicine.deleteMany({
        where: { medicineId: id },
      });

      // Create new associations
      if (contactIds.length > 0) {
        const contactMedicineData = contactIds.map(contactId => ({
          contactId,
          medicineId: id,
        }));

        await prisma.contactMedicine.createMany({
          data: contactMedicineData,
        });
      }
    }

    // Get the updated medicine with contacts
    const medicineWithContacts = await prisma.medicine.findUnique({
      where: { id },
      include: {
        contacts: {
          include: {
            contact: true,
          },
        },
      },
    });

    if (!medicineWithContacts) {
      throw new Error('Failed to retrieve updated medicine');
    }

    // Format dates for response
    const response: MedicineResponse = {
      ...medicineWithContacts,
      createdAt: formatForResponse(medicineWithContacts.createdAt) || '',
      updatedAt: formatForResponse(medicineWithContacts.updatedAt) || '',
      deletedAt: formatForResponse(medicineWithContacts.deletedAt),
    };

    return NextResponse.json<ApiResponse<MedicineResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error updating medicine:', error);
    return NextResponse.json<ApiResponse<MedicineResponse>>(
      {
        success: false,
        error: 'Failed to update medicine',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET request to fetch medicines
 */
async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const active = searchParams.get('active');
    const contactId = searchParams.get('contactId');

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    // Add filters
    if (id) {
      where.id = id;
    }

    if (active !== null) {
      where.active = active === 'true';
    }

    // If ID is provided, fetch a single medicine
    if (id) {
      const medicine = await prisma.medicine.findUnique({
        where: { id },
        include: {
          contacts: {
            include: {
              contact: true,
            },
          },
          unit: true,
        },
      });

      if (!medicine) {
        return NextResponse.json<ApiResponse<MedicineResponse>>(
          {
            success: false,
            error: 'Medicine not found',
          },
          { status: 404 }
        );
      }

      // Format dates for response
      const response: MedicineResponse = {
        ...medicine,
        createdAt: formatForResponse(medicine.createdAt) || '',
        updatedAt: formatForResponse(medicine.updatedAt) || '',
        deletedAt: formatForResponse(medicine.deletedAt),
      };

      return NextResponse.json<ApiResponse<MedicineResponse>>({
        success: true,
        data: response,
      });
    }

    // If contactId is provided, fetch medicines associated with that contact
    if (contactId) {
      const medicinesForContact = await prisma.contactMedicine.findMany({
        where: {
          contactId,
          medicine: {
            deletedAt: null,
            ...(active !== null ? { active: active === 'true' } : {}),
          },
        },
        include: {
          medicine: {
            include: {
              unit: true,
            },
          },
        },
      });

      const medicines = medicinesForContact.map(cm => cm.medicine);

      // Format dates for response
      const response = medicines.map(medicine => ({
        ...medicine,
        createdAt: formatForResponse(medicine.createdAt) || '',
        updatedAt: formatForResponse(medicine.updatedAt) || '',
        deletedAt: formatForResponse(medicine.deletedAt),
      }));

      return NextResponse.json<ApiResponse<MedicineResponse[]>>({
        success: true,
        data: response,
      });
    }

    // Otherwise, fetch all medicines
    const medicines = await prisma.medicine.findMany({
      where,
      include: {
        contacts: {
          include: {
            contact: true,
          },
        },
        unit: true,
      },
      orderBy: { name: 'asc' },
    });

    // Format dates for response
    const response = medicines.map(medicine => ({
      ...medicine,
      createdAt: formatForResponse(medicine.createdAt) || '',
      updatedAt: formatForResponse(medicine.updatedAt) || '',
      deletedAt: formatForResponse(medicine.deletedAt),
    }));

    return NextResponse.json<ApiResponse<MedicineResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return NextResponse.json<ApiResponse<MedicineResponse[]>>(
      {
        success: false,
        error: 'Failed to fetch medicines',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle DELETE request to soft delete a medicine
 */
async function handleDelete(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Medicine ID is required',
        },
        { status: 400 }
      );
    }

    // Check if medicine exists
    const existingMedicine = await prisma.medicine.findUnique({
      where: { id },
    });

    if (!existingMedicine) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Medicine not found',
        },
        { status: 404 }
      );
    }

    // Soft delete by setting deletedAt
    await prisma.medicine.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to delete medicine',
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware to all handlers
export const GET = withAuthContext(handleGet as any);
export const POST = withAuthContext(handlePost as any);
export const PUT = withAuthContext(handlePut as any);
export const DELETE = withAuthContext(handleDelete as any);
