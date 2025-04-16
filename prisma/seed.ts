import prisma from './db';

type UnitData = {
  unitAbbr: string;
  unitName: string;
};

async function main() {
  // Ensure default settings exist with PIN 111222
  const settingsCount = await prisma.settings.count();
  if (settingsCount === 0) {
    console.log('Creating default settings with PIN: 111222');
    await prisma.settings.create({
      data: {
        familyName: "My Family",
        securityPin: "111222",
        defaultBottleUnit: "OZ",
        defaultSolidsUnit: "TBSP",
        defaultHeightUnit: "IN",
        defaultWeightUnit: "LB",
        defaultTempUnit: "F",
        enableDebugTimer: false,
        enableDebugTimezone: false
      }
    });
  }

  // Define all available units
  const unitData: UnitData[] = [
    { unitAbbr: 'OZ', unitName: 'Ounces' },
    { unitAbbr: 'ML', unitName: 'Milliliters' },
    { unitAbbr: 'TBSP', unitName: 'Tablespoon' },
    { unitAbbr: 'LB', unitName: 'Pounds' },
    { unitAbbr: 'IN', unitName: 'Inches' },
    { unitAbbr: 'CM', unitName: 'Centimeters' },
    { unitAbbr: 'G', unitName: 'Grams' },
    { unitAbbr: 'KG', unitName: 'Kilograms' },
    { unitAbbr: 'F', unitName: 'Fahrenheit' },
    { unitAbbr: 'C', unitName: 'Celsius' },
    { unitAbbr: 'MG', unitName: 'Milligrams' },
    { unitAbbr: 'MCG', unitName: 'Micrograms' },
    { unitAbbr: 'L', unitName: 'Liters' },
    { unitAbbr: 'CC', unitName: 'Cubic Centimeters' },
    { unitAbbr: 'MOL', unitName: 'Moles' },
    { unitAbbr: 'MMOL', unitName: 'Millimoles' },
  ];

  // Handle units separately
  await updateUnits(unitData);
}

/**
 * Updates units in the database by checking which units exist and only adding the ones that don't exist yet.
 * @param unitData Array of unit data objects with unitAbbr and unitName
 */
async function updateUnits(unitData: UnitData[]): Promise<void> {
  console.log('Checking for missing units...');
  
  // Get existing units from the database
  const existingUnits = await prisma.unit.findMany({
    select: { unitAbbr: true }
  });
  
  // Create a set of existing unit abbreviations for faster lookups
  const existingUnitAbbrs = new Set(existingUnits.map(unit => unit.unitAbbr));
  
  // Filter out units that already exist
  const missingUnits = unitData.filter(unit => !existingUnitAbbrs.has(unit.unitAbbr));
  
  if (missingUnits.length === 0) {
    console.log('All units already exist in the database.');
    return;
  }
  
  console.log(`Adding ${missingUnits.length} missing units: ${missingUnits.map(u => u.unitAbbr).join(', ')}`);
  
  // Create the missing units
  for (const unit of missingUnits) {
    await prisma.unit.create({
      data: unit
    });
  }
  
  console.log('Units update completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error disconnecting from database:', error);
      process.exit(1);
    }
  });
