/**
 * Test data generation script for Sprout Track
 * Generates realistic families, caretakers, babies, and log entries
 * Run with: node scripts/generate-test-data.js
 */

const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

// Get parameters from environment variables set by bash script
const familyCount = parseInt(process.env.FAMILY_COUNT) || 1;
const daysCount = parseInt(process.env.DAYS_COUNT) || 7;
const clearData = process.env.CLEAR_DATA === 'true';

// Random name arrays
const maleFirstNames = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua',
  'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Jason', 'Edward', 'Jeffrey', 'Ryan',
  'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon',
  'Benjamin', 'Samuel', 'Gregory', 'Alexander', 'Patrick', 'Frank', 'Raymond', 'Jack', 'Dennis', 'Jerry',
  'Tyler', 'Aaron', 'Jose', 'Henry', 'Adam', 'Douglas', 'Nathan', 'Peter', 'Zachary', 'Kyle',
  'Noah', 'Alan', 'Ethan', 'Jeremy', 'Lionel', 'Angel', 'Jordan', 'Wayne', 'Arthur', 'Sean',
  'Felix', 'Carl', 'Harold', 'Jose', 'Ralph', 'Mason', 'Roy', 'Eugene', 'Louis', 'Philip'
];

const femaleFirstNames = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Nancy', 'Lisa', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle',
  'Laura', 'Sarah', 'Kimberly', 'Deborah', 'Dorothy', 'Amy', 'Angela', 'Ashley', 'Brenda', 'Emma',
  'Olivia', 'Cynthia', 'Marie', 'Janet', 'Catherine', 'Frances', 'Christine', 'Samantha', 'Debra', 'Rachel',
  'Carolyn', 'Janet', 'Maria', 'Heather', 'Diane', 'Julie', 'Joyce', 'Virginia', 'Victoria', 'Kelly',
  'Christina', 'Joan', 'Evelyn', 'Lauren', 'Judith', 'Megan', 'Cheryl', 'Andrea', 'Hannah', 'Jacqueline',
  'Martha', 'Gloria', 'Teresa', 'Sara', 'Janice', 'Marie', 'Julia', 'Heather', 'Diane', 'Carolyn',
  'Ruth', 'Sharon', 'Michelle', 'Laura', 'Sarah', 'Kimberly', 'Deborah', 'Dorothy', 'Lisa', 'Nancy'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson'
];

const caretakerTypes = [
  'Parent', 'Mother', 'Father', 'Grandmother', 'Grandfather', 'Nanny', 'Babysitter', 
  'Daycare Provider', 'Aunt', 'Uncle', 'Family Friend', 'Caregiver'
];

// Adjectives and animals for slug generation (copied from family-migration.js)
const adjectives = [
  'adorable', 'fluffy', 'cuddly', 'tiny', 'fuzzy', 'sweet', 'playful', 'gentle', 'happy',
  'bouncy', 'sleepy', 'snuggly', 'cheerful', 'bubbly', 'cozy', 'merry', 'giggly', 'jolly',
  'silly', 'wiggly', 'charming', 'dainty', 'darling', 'precious', 'lovable', 'huggable',
  'perky', 'sprightly', 'twinkly', 'whimsical', 'delightful', 'friendly', 'joyful', 'peppy'
];

const animals = [
  'kitten', 'puppy', 'bunny', 'duckling', 'chick', 'calf', 'lamb', 'piglet', 'fawn',
  'cub', 'foal', 'joey', 'owlet', 'panda', 'koala', 'hamster', 'hedgehog', 'otter',
  'chinchilla', 'squirrel', 'chipmunk', 'mouse', 'gerbil', 'ferret', 'meerkat', 'sloth',
  'penguin', 'seal', 'walrus', 'alpaca', 'llama', 'capybara', 'quokka', 'wombat'
];

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// Generate unique slug
async function generateUniqueSlug() {
  let attempts = 0;
  while (attempts < 20) {
    const adjective = randomChoice(adjectives);
    const animal = randomChoice(animals);
    const slug = `${adjective}-${animal}`;
    
    const existing = await prisma.family.findFirst({ where: { slug } });
    if (!existing) {
      return slug;
    }
    attempts++;
  }
  
  // Fallback with random number
  const adjective = randomChoice(adjectives);
  const animal = randomChoice(animals);
  const randomNum = randomInt(1000, 9999);
  return `${adjective}-${animal}-${randomNum}`;
}

// Generate realistic birth date (0-24 months ago)
function generateBabyBirthDate() {
  const now = new Date();
  const maxAgeMonths = 24;
  const ageMonths = randomFloat(0, maxAgeMonths);
  const birthDate = new Date(now.getTime() - (ageMonths * 30 * 24 * 60 * 60 * 1000));
  return birthDate;
}

// Generate realistic timestamp within a day
function generateTimeInDay(baseDate, hour, minuteVariation = 30) {
  const date = new Date(baseDate);
  date.setHours(hour);
  date.setMinutes(randomInt(-minuteVariation, minuteVariation));
  date.setSeconds(randomInt(0, 59));
  return date;
}

// Clear existing data
async function clearExistingData() {
  console.log('Clearing existing data...');
  
  // Delete in order to respect foreign key constraints
  const models = [
    'familyMember', 'sleepLog', 'feedLog', 'diaperLog', 'moodLog', 'note', 
    'milestone', 'pumpLog', 'playLog', 'bathLog', 'measurement', 'medicineLog',
    'medicine', 'calendarEvent', 'contact', 'baby', 'caretaker', 'settings', 'family'
  ];
  
  for (const model of models) {
    try {
      await prisma[model].deleteMany({});
      console.log(`Cleared ${model} records`);
    } catch (error) {
      console.log(`Note: Could not clear ${model} (may not exist): ${error.message}`);
    }
  }
}

// Generate a family
async function generateFamily() {
  const lastName = randomChoice(lastNames);
  const slug = await generateUniqueSlug();
  
  const family = await prisma.family.create({
    data: {
      id: randomUUID(),
      slug: slug,
      name: `${lastName} Family`,
      isActive: true
    }
  });
  
  // Create family settings
  await prisma.settings.create({
    data: {
      id: randomUUID(),
      familyId: family.id,
      familyName: family.name,
      securityPin: '111222',
      defaultBottleUnit: 'OZ',
      defaultSolidsUnit: 'TBSP',
      defaultHeightUnit: 'IN',
      defaultWeightUnit: 'LB',
      defaultTempUnit: 'F'
    }
  });
  
  return family;
}

// Generate caretakers for a family
async function generateCaretakers(family) {
  const caretakerCount = randomInt(2, 4);
  const caretakers = [];
  
  for (let i = 0; i < caretakerCount; i++) {
    const isFirstCaretaker = i === 0;
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const firstName = gender === 'male' ? randomChoice(maleFirstNames) : randomChoice(femaleFirstNames);
    
    const caretaker = await prisma.caretaker.create({
      data: {
        id: randomUUID(),
        loginId: (i + 1).toString().padStart(2, '0'),
        name: firstName,
        type: isFirstCaretaker ? 'Parent' : randomChoice(caretakerTypes),
        role: isFirstCaretaker ? 'ADMIN' : 'USER',
        inactive: false,
        securityPin: '111222',
        familyId: family.id
      }
    });
    
    // Create family member relationship
    await prisma.familyMember.create({
      data: {
        familyId: family.id,
        caretakerId: caretaker.id,
        role: isFirstCaretaker ? 'admin' : 'member'
      }
    });
    
    caretakers.push(caretaker);
  }
  
  return caretakers;
}

// Generate babies for a family
async function generateBabies(family, caretakers) {
  const babyCount = randomInt(1, 2);
  const babies = [];
  
  for (let i = 0; i < babyCount; i++) {
    const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
    const firstName = gender === 'MALE' ? randomChoice(maleFirstNames) : randomChoice(femaleFirstNames);
    const birthDate = generateBabyBirthDate();
    
    const baby = await prisma.baby.create({
      data: {
        id: randomUUID(),
        firstName: firstName,
        lastName: family.name.replace(' Family', ''),
        birthDate: birthDate,
        gender: gender,
        inactive: false,
        familyId: family.id,
        feedWarningTime: '03:00',
        diaperWarningTime: '02:00'
      }
    });
    
    babies.push(baby);
  }
  
  return babies;
}

// Generate sleep logs for a baby
async function generateSleepLogs(baby, caretakers, family, startDate, endDate) {
  const logs = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const caretaker = randomChoice(caretakers);
    
    // Night sleep (9 PM - 7 AM)
    const nightStart = generateTimeInDay(currentDate, 21); // 9 PM
    const nightEnd = generateTimeInDay(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000), 7); // 7 AM next day
    const nightDuration = Math.floor((nightEnd - nightStart) / (1000 * 60)); // minutes
    
    logs.push({
      id: randomUUID(),
      startTime: nightStart,
      endTime: nightEnd,
      duration: nightDuration,
      type: 'NIGHT_SLEEP',
      location: 'Crib',
      quality: randomChoice(['GOOD', 'EXCELLENT', 'FAIR']),
      babyId: baby.id,
      caretakerId: caretaker.id,
      familyId: family.id
    });
    
    // Morning nap (10 AM - 12 PM)
    if (Math.random() > 0.3) { // 70% chance
      const napStart = generateTimeInDay(currentDate, 10);
      const napDuration = randomInt(60, 120); // 1-2 hours
      const napEnd = new Date(napStart.getTime() + napDuration * 60 * 1000);
      
      logs.push({
        id: randomUUID(),
        startTime: napStart,
        endTime: napEnd,
        duration: napDuration,
        type: 'NAP',
        location: 'Crib',
        quality: randomChoice(['GOOD', 'FAIR', 'EXCELLENT']),
        babyId: baby.id,
        caretakerId: caretaker.id,
        familyId: family.id
      });
    }
    
    // Afternoon nap (2 PM - 4 PM)
    if (Math.random() > 0.2) { // 80% chance
      const napStart = generateTimeInDay(currentDate, 14);
      const napDuration = randomInt(90, 180); // 1.5-3 hours
      const napEnd = new Date(napStart.getTime() + napDuration * 60 * 1000);
      
      logs.push({
        id: randomUUID(),
        startTime: napStart,
        endTime: napEnd,
        duration: napDuration,
        type: 'NAP',
        location: 'Crib',
        quality: randomChoice(['GOOD', 'FAIR', 'EXCELLENT']),
        babyId: baby.id,
        caretakerId: caretaker.id,
        familyId: family.id
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return logs;
}

// Generate feed logs for a baby
async function generateFeedLogs(baby, caretakers, family, startDate, endDate) {
  const logs = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const caretaker = randomChoice(caretakers);
    
    // 6-8 bottle feeds per day, every 2-4 hours
    const feedTimes = [2, 6, 10, 14, 18, 22]; // Base times: 2 AM, 6 AM, 10 AM, 2 PM, 6 PM, 10 PM
    
    for (const baseHour of feedTimes) {
      if (Math.random() > 0.15) { // 85% chance for each feed
        const feedTime = generateTimeInDay(currentDate, baseHour, 45);
        const amount = randomFloat(2, 8); // 2-8 ounces
        
        logs.push({
          id: randomUUID(),
          time: feedTime,
          type: 'BOTTLE',
          amount: Math.round(amount * 10) / 10, // Round to 1 decimal
          unitAbbr: 'OZ',
          babyId: baby.id,
          caretakerId: caretaker.id,
          familyId: family.id
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return logs;
}

// Generate diaper logs for a baby
async function generateDiaperLogs(baby, caretakers, family, startDate, endDate) {
  const logs = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const caretaker = randomChoice(caretakers);
    
    // 6-10 diaper changes per day
    const diaperCount = randomInt(6, 10);
    
    for (let i = 0; i < diaperCount; i++) {
      const hour = randomInt(0, 23);
      const changeTime = generateTimeInDay(currentDate, hour, 30);
      
      // Determine diaper type (more wet than dirty)
      let type;
      const rand = Math.random();
      if (rand < 0.6) {
        type = 'WET';
      } else if (rand < 0.85) {
        type = 'DIRTY';
      } else {
        type = 'BOTH';
      }
      
      logs.push({
        id: randomUUID(),
        time: changeTime,
        type: type,
        condition: type === 'DIRTY' || type === 'BOTH' ? randomChoice(['Normal', 'Soft', 'Hard']) : null,
        color: type === 'DIRTY' || type === 'BOTH' ? randomChoice(['Yellow', 'Brown', 'Green']) : null,
        babyId: baby.id,
        caretakerId: caretaker.id,
        familyId: family.id
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return logs;
}

// Main data generation function
async function generateTestData() {
  try {
    console.log(`Starting test data generation...`);
    console.log(`Families: ${familyCount}, Days: ${daysCount}, Clear data: ${clearData}`);
    
    if (clearData) {
      await clearExistingData();
    }
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (daysCount * 24 * 60 * 60 * 1000));
    
    let totalBabies = 0;
    let totalCaretakers = 0;
    let totalSleepLogs = 0;
    let totalFeedLogs = 0;
    let totalDiaperLogs = 0;
    
    for (let i = 0; i < familyCount; i++) {
      console.log(`Generating family ${i + 1}/${familyCount}...`);
      
      // Generate family
      const family = await generateFamily();
      console.log(`  Created family: ${family.name} (${family.slug})`);
      
      // Generate caretakers
      const caretakers = await generateCaretakers(family);
      totalCaretakers += caretakers.length;
      console.log(`  Created ${caretakers.length} caretakers`);
      
      // Generate babies
      const babies = await generateBabies(family, caretakers);
      totalBabies += babies.length;
      console.log(`  Created ${babies.length} babies`);
      
      // Generate logs for each baby
      for (const baby of babies) {
        console.log(`    Generating logs for ${baby.firstName}...`);
        
        // Generate sleep logs
        const sleepLogs = await generateSleepLogs(baby, caretakers, family, startDate, endDate);
        if (sleepLogs.length > 0) {
          await prisma.sleepLog.createMany({ data: sleepLogs });
          totalSleepLogs += sleepLogs.length;
        }
        
        // Generate feed logs
        const feedLogs = await generateFeedLogs(baby, caretakers, family, startDate, endDate);
        if (feedLogs.length > 0) {
          await prisma.feedLog.createMany({ data: feedLogs });
          totalFeedLogs += feedLogs.length;
        }
        
        // Generate diaper logs
        const diaperLogs = await generateDiaperLogs(baby, caretakers, family, startDate, endDate);
        if (diaperLogs.length > 0) {
          await prisma.diaperLog.createMany({ data: diaperLogs });
          totalDiaperLogs += diaperLogs.length;
        }
        
        console.log(`      Sleep: ${sleepLogs.length}, Feed: ${feedLogs.length}, Diaper: ${diaperLogs.length}`);
      }
    }
    
    console.log(`\nTest data generation completed successfully!`);
    console.log(`Generated:`);
    console.log(`- ${familyCount} families`);
    console.log(`- ${totalCaretakers} caretakers`);
    console.log(`- ${totalBabies} babies`);
    console.log(`- ${totalSleepLogs} sleep logs`);
    console.log(`- ${totalFeedLogs} feed logs`);
    console.log(`- ${totalDiaperLogs} diaper logs`);
    console.log(`Total log entries: ${totalSleepLogs + totalFeedLogs + totalDiaperLogs}`);
    
  } catch (error) {
    console.error('Error generating test data:', error);
    throw error;
  }
}

// Run the data generation
generateTestData()
  .catch(e => {
    console.error('Test data generation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 