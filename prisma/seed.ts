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

  // Create units
  const units: UnitData[] = [
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

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { unitAbbr: unit.unitAbbr },
      update: unit,
      create: unit,
    });
  }
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
