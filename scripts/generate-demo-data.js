/**
 * Demo family data generation script for Sprout Track
 * Creates a single demo family based on existing family data
 * Run with: node scripts/generate-demo-data.js
 */

const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

// Source family ID to copy data from
const SOURCE_FAMILY_ID = 'cmcqdc0gj0000s6xh8gp1sj0x';
const DEMO_FAMILY_SLUG = 'demo';
const DEMO_CARETAKER_LOGIN_ID = '01';
const DEMO_CARETAKER_PIN = '111111';

// Random name arrays for demo family
const maleFirstNames = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua'
];

const femaleFirstNames = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Nancy', 'Lisa', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

// Note content examples for random generation
const noteTemplates = [
  "Baby was very fussy during feeding time today",
  "Slept through the night for the first time!",
  "Pediatrician appointment scheduled for next week",
  "Started showing interest in solid foods",
  "Had a great day at the park",
  "Trying new sleep routine tonight",
  "Baby seemed extra giggly today",
  "Running low on diapers - need to buy more",
  "Grandmother visited and baby was so happy",
  "First time rolling over from back to tummy!",
  "Teething seems to be starting",
  "Baby loves the new toy we got",
  "Had to change clothes 3 times today - lots of spit up",
  "Daycare said baby played well with other children",
  "Trying to establish better feeding schedule"
];

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random 30-day period between April-June 2025
function generateRandomDateRange() {
  // April 1, 2025 to June 30, 2025
  const startOfPeriod = new Date('2025-04-01T00:00:00Z');
  const endOfPeriod = new Date('2025-06-30T23:59:59Z');
  
  // Calculate total days available (minus 30 to ensure we can fit a full 30-day period)
  const totalDaysAvailable = Math.floor((endOfPeriod - startOfPeriod) / (1000 * 60 * 60 * 24)) - 30;
  
  // Pick a random starting day
  const randomStartDays = randomInt(0, totalDaysAvailable);
  const startDate = new Date(startOfPeriod.getTime() + (randomStartDays * 24 * 60 * 60 * 1000));
  const endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  return { startDate, endDate };
}

// Check if existing demo family exists
async function findExistingDemoFamily() {
  return await prisma.family.findFirst({
    where: { slug: DEMO_FAMILY_SLUG },
    include: {
      babies: true,
      caretakers: true,
      settings: true
    }
  });
}

// Delete existing demo family and all related data
async function deleteExistingDemoFamily(demoFamily) {
  console.log('Deleting existing demo family data...');
  
  const familyId = demoFamily.id;
  
  // Delete demo tracker record first
  try {
    await prisma.demoTracker.deleteMany({
      where: { familyId: familyId }
    });
    console.log('  Cleared demo tracker records');
  } catch (error) {
    console.log(`  Note: Could not clear demo tracker: ${error.message}`);
  }
  
  // Delete in order to respect foreign key constraints
  const models = [
    'familyMember', 'sleepLog', 'feedLog', 'diaperLog', 'moodLog', 'note', 
    'milestone', 'pumpLog', 'playLog', 'bathLog', 'measurement', 'medicineLog',
    'medicine', 'calendarEvent', 'contact', 'baby', 'caretaker', 'settings', 'family'
  ];
  
  for (const model of models) {
    try {
      await prisma[model].deleteMany({
        where: { familyId: familyId }
      });
      console.log(`  Cleared ${model} records for demo family`);
    } catch (error) {
      console.log(`  Note: Could not clear ${model} for demo family: ${error.message}`);
    }
  }
}

// Get source family data within the date range
async function getSourceFamilyData(startDate, endDate) {
  console.log(`Fetching source data from ${SOURCE_FAMILY_ID} between ${startDate.toISOString()} and ${endDate.toISOString()}...`);
  
  const [family, babies, sleepLogs, feedLogs, diaperLogs] = await Promise.all([
    prisma.family.findUnique({
      where: { id: SOURCE_FAMILY_ID },
      include: { settings: true }
    }),
    prisma.baby.findMany({
      where: { familyId: SOURCE_FAMILY_ID }
    }),
    prisma.sleepLog.findMany({
      where: {
        familyId: SOURCE_FAMILY_ID,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { baby: true }
    }),
    prisma.feedLog.findMany({
      where: {
        familyId: SOURCE_FAMILY_ID,
        time: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { baby: true }
    }),
    prisma.diaperLog.findMany({
      where: {
        familyId: SOURCE_FAMILY_ID,
        time: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { baby: true }
    })
  ]);
  
  if (!family) {
    throw new Error(`Source family ${SOURCE_FAMILY_ID} not found`);
  }
  
  console.log(`Found source data: ${babies.length} babies, ${sleepLogs.length} sleep logs, ${feedLogs.length} feed logs, ${diaperLogs.length} diaper logs`);
  
  return { family, babies, sleepLogs, feedLogs, diaperLogs };
}

// Create demo family
async function createDemoFamily() {
  const demoLastName = randomChoice(lastNames);
  
  const family = await prisma.family.create({
    data: {
      id: randomUUID(),
      slug: DEMO_FAMILY_SLUG,
      name: `${demoLastName} Family (Demo)`,
      isActive: true
    }
  });
  
  // Create family settings
  await prisma.settings.create({
    data: {
      id: randomUUID(),
      familyId: family.id,
      familyName: family.name,
      securityPin: DEMO_CARETAKER_PIN,
      defaultBottleUnit: 'OZ',
      defaultSolidsUnit: 'TBSP',
      defaultHeightUnit: 'IN',
      defaultWeightUnit: 'LB',
      defaultTempUnit: 'F'
    }
  });
  
  console.log(`Created demo family: ${family.name} (${family.slug})`);
  return family;
}

// Create demo caretaker
async function createDemoCaretaker(family) {
  const firstName = randomChoice(femaleFirstNames); // Parent name
  
  const caretaker = await prisma.caretaker.create({
    data: {
      id: randomUUID(),
      loginId: DEMO_CARETAKER_LOGIN_ID,
      name: firstName,
      type: 'Parent',
      role: 'ADMIN',
      inactive: false,
      securityPin: DEMO_CARETAKER_PIN,
      familyId: family.id
    }
  });
  
  // Create family member relationship
  await prisma.familyMember.create({
    data: {
      familyId: family.id,
      caretakerId: caretaker.id,
      role: 'admin'
    }
  });
  
  console.log(`Created demo caretaker: ${firstName} (${DEMO_CARETAKER_LOGIN_ID})`);
  return caretaker;
}

// Create demo babies based on source babies
async function createDemoBabies(family, sourceBabies) {
  const demoBabies = [];
  const demoLastName = family.name.replace(' Family (Demo)', '');
  
  for (const sourceBaby of sourceBabies) {
    const gender = sourceBaby.gender || 'FEMALE';
    const firstName = gender === 'MALE' ? randomChoice(maleFirstNames) : randomChoice(femaleFirstNames);
    
    const demoBaby = await prisma.baby.create({
      data: {
        id: randomUUID(),
        firstName: firstName,
        lastName: demoLastName,
        birthDate: sourceBaby.birthDate,
        gender: gender,
        inactive: false,
        familyId: family.id,
        feedWarningTime: sourceBaby.feedWarningTime,
        diaperWarningTime: sourceBaby.diaperWarningTime
      }
    });
    
    demoBabies.push({ demo: demoBaby, source: sourceBaby });
  }
  
  console.log(`Created ${demoBabies.length} demo babies`);
  return demoBabies;
}

// Transform and create sleep logs
async function createDemoSleepLogs(family, caretaker, babyMappings, sourceSleepLogs, dateOffset) {
  const demoLogs = [];
  
  for (const sourceLog of sourceSleepLogs) {
    const babyMapping = babyMappings.find(m => m.source.id === sourceLog.babyId);
    if (!babyMapping) continue;
    
    const startTime = new Date(sourceLog.startTime.getTime() + dateOffset);
    const endTime = sourceLog.endTime ? new Date(sourceLog.endTime.getTime() + dateOffset) : null;
    
    demoLogs.push({
      id: randomUUID(),
      startTime: startTime,
      endTime: endTime,
      duration: sourceLog.duration,
      type: sourceLog.type,
      location: sourceLog.location,
      quality: sourceLog.quality,
      babyId: babyMapping.demo.id,
      caretakerId: caretaker.id,
      familyId: family.id
    });
  }
  
  if (demoLogs.length > 0) {
    await prisma.sleepLog.createMany({ data: demoLogs });
  }
  
  console.log(`Created ${demoLogs.length} demo sleep logs`);
  return demoLogs.length;
}

// Transform and create feed logs
async function createDemoFeedLogs(family, caretaker, babyMappings, sourceFeedLogs, dateOffset) {
  const demoLogs = [];
  
  for (const sourceLog of sourceFeedLogs) {
    const babyMapping = babyMappings.find(m => m.source.id === sourceLog.babyId);
    if (!babyMapping) continue;
    
    const time = new Date(sourceLog.time.getTime() + dateOffset);
    const startTime = sourceLog.startTime ? new Date(sourceLog.startTime.getTime() + dateOffset) : null;
    const endTime = sourceLog.endTime ? new Date(sourceLog.endTime.getTime() + dateOffset) : null;
    
    demoLogs.push({
      id: randomUUID(),
      time: time,
      startTime: startTime,
      endTime: endTime,
      feedDuration: sourceLog.feedDuration,
      type: sourceLog.type,
      amount: sourceLog.amount,
      unitAbbr: sourceLog.unitAbbr,
      side: sourceLog.side,
      food: sourceLog.food,
      babyId: babyMapping.demo.id,
      caretakerId: caretaker.id,
      familyId: family.id
    });
  }
  
  if (demoLogs.length > 0) {
    await prisma.feedLog.createMany({ data: demoLogs });
  }
  
  console.log(`Created ${demoLogs.length} demo feed logs`);
  return demoLogs.length;
}

// Transform and create diaper logs
async function createDemoDiaperLogs(family, caretaker, babyMappings, sourceDiaperLogs, dateOffset) {
  const demoLogs = [];
  
  for (const sourceLog of sourceDiaperLogs) {
    const babyMapping = babyMappings.find(m => m.source.id === sourceLog.babyId);
    if (!babyMapping) continue;
    
    const time = new Date(sourceLog.time.getTime() + dateOffset);
    
    demoLogs.push({
      id: randomUUID(),
      time: time,
      type: sourceLog.type,
      condition: sourceLog.condition,
      color: sourceLog.color,
      babyId: babyMapping.demo.id,
      caretakerId: caretaker.id,
      familyId: family.id
    });
  }
  
  if (demoLogs.length > 0) {
    await prisma.diaperLog.createMany({ data: demoLogs });
  }
  
  console.log(`Created ${demoLogs.length} demo diaper logs`);
  return demoLogs.length;
}

// Generate random bath logs (like the original script)
async function generateDemoBathLogs(family, caretaker, babyMappings, startDate, endDate) {
  const logs = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    for (const babyMapping of babyMappings) {
      // 80% chance of bath per day, usually in the evening
      if (Math.random() > 0.2) {
        const bathTime = new Date(currentDate);
        bathTime.setHours(19, randomInt(-60, 60), randomInt(0, 59)); // 7 PM +/- 1 hour
        
        const soapUsed = Math.random() > 0.1; // 90% chance
        const shampooUsed = Math.random() > 0.3; // 70% chance
        
        logs.push({
          id: randomUUID(),
          time: bathTime,
          soapUsed: soapUsed,
          shampooUsed: shampooUsed,
          notes: Math.random() > 0.7 ? randomChoice([
            'Baby loved splashing in the water',
            'Calm and relaxed during bath',
            'Fussy at first but settled down',
            'Enjoyed playing with bath toys',
            'Very sleepy after bath'
          ]) : null,
          babyId: babyMapping.demo.id,
          caretakerId: caretaker.id,
          familyId: family.id
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  if (logs.length > 0) {
    await prisma.bathLog.createMany({ data: logs });
  }
  
  console.log(`Generated ${logs.length} demo bath logs`);
  return logs.length;
}

// Generate random notes (like the original script)
async function generateDemoNotes(family, caretaker, babyMappings, startDate, endDate) {
  const logs = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    for (const babyMapping of babyMappings) {
      // 60% chance of note per day (roughly 1 every day or two)
      if (Math.random() > 0.4) {
        const noteTime = new Date(currentDate);
        noteTime.setHours(randomInt(8, 20), randomInt(0, 30), randomInt(0, 59));
        
        logs.push({
          id: randomUUID(),
          time: noteTime,
          content: randomChoice(noteTemplates),
          category: randomChoice(['General', 'Feeding', 'Sleep', 'Development', 'Health']),
          babyId: babyMapping.demo.id,
          caretakerId: caretaker.id,
          familyId: family.id
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  if (logs.length > 0) {
    await prisma.note.createMany({ data: logs });
  }
  
  console.log(`Generated ${logs.length} demo notes`);
  return logs.length;
}

// Create demo tracker record
async function createDemoTracker(family, startDate, endDate) {
  const tracker = await prisma.demoTracker.create({
    data: {
      familyId: family.id,
      sourceFamilyId: SOURCE_FAMILY_ID,
      dateRangeStart: startDate,
      dateRangeEnd: endDate,
      notes: `Demo generated from family ${SOURCE_FAMILY_ID} using ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
    }
  });
  
  console.log(`Created demo tracker record: ${tracker.id}`);
  return tracker;
}

// Main demo generation function
async function generateDemoData() {
  try {
    console.log('Starting demo family data generation...');
    
    // Check if demo family already exists and delete it
    const existingDemo = await findExistingDemoFamily();
    if (existingDemo) {
      await deleteExistingDemoFamily(existingDemo);
    }
    
    // Generate random 30-day period between April-June 2025
    const { startDate, endDate } = generateRandomDateRange();
    console.log(`Using date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    
    // Get source family data
    const sourceData = await getSourceFamilyData(startDate, endDate);
    
    // Calculate date offset to shift source data to present time
    const now = new Date();
    const sourceStartTime = startDate;
    const dateOffset = now.getTime() - sourceStartTime.getTime();
    
    // Create demo family structure
    const demoFamily = await createDemoFamily();
    const demoCaretaker = await createDemoCaretaker(demoFamily);
    const demoBabyMappings = await createDemoBabies(demoFamily, sourceData.babies);
    
    // Transform and create log data with time offset to present
    const presentStartDate = new Date(startDate.getTime() + dateOffset);
    const presentEndDate = new Date(endDate.getTime() + dateOffset);
    
    const sleepCount = await createDemoSleepLogs(demoFamily, demoCaretaker, demoBabyMappings, sourceData.sleepLogs, dateOffset);
    const feedCount = await createDemoFeedLogs(demoFamily, demoCaretaker, demoBabyMappings, sourceData.feedLogs, dateOffset);
    const diaperCount = await createDemoDiaperLogs(demoFamily, demoCaretaker, demoBabyMappings, sourceData.diaperLogs, dateOffset);
    
    // Generate random bath logs and notes for the present time period
    const bathCount = await generateDemoBathLogs(demoFamily, demoCaretaker, demoBabyMappings, presentStartDate, presentEndDate);
    const noteCount = await generateDemoNotes(demoFamily, demoCaretaker, demoBabyMappings, presentStartDate, presentEndDate);
    
    // Create demo tracker record
    await createDemoTracker(demoFamily, startDate, endDate);
    
    console.log('\n========================================');
    console.log('   Demo family generation completed!');
    console.log('========================================');
    console.log(`Family: ${demoFamily.name}`);
    console.log(`Slug: ${demoFamily.slug}`);
    console.log(`Caretaker: Login ID "${DEMO_CARETAKER_LOGIN_ID}", PIN "${DEMO_CARETAKER_PIN}"`);
    console.log(`Babies: ${demoBabyMappings.length}`);
    console.log(`Data period: ${presentStartDate.toLocaleDateString()} to ${presentEndDate.toLocaleDateString()}`);
    console.log('\nGenerated logs:');
    console.log(`- Sleep logs: ${sleepCount}`);
    console.log(`- Feed logs: ${feedCount}`);
    console.log(`- Diaper logs: ${diaperCount}`);
    console.log(`- Bath logs: ${bathCount}`);
    console.log(`- Notes: ${noteCount}`);
    console.log(`Total log entries: ${sleepCount + feedCount + diaperCount + bathCount + noteCount}`);
    console.log('\nAccess URL: /demo');
    
  } catch (error) {
    console.error('Error generating demo family data:', error);
    throw error;
  }
}

// Run the demo generation
generateDemoData()
  .catch(e => {
    console.error('Demo family generation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });