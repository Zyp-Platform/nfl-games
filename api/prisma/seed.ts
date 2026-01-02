/**
 * NFL Games Database Seed Script
 * Seeds realistic NFL game and team data for testing
 * Uses faker for deterministic data generation
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Seed faker for deterministic data
faker.seed(12348);

// ============================================================================
// NFL Data - Real Team and Venue Information
// ============================================================================

const NFL_TEAMS = [
  { id: 'kc', abbreviation: 'KC', displayName: 'Kansas City Chiefs', location: 'Kansas City', nickname: 'Chiefs', color: '#E31837', venueId: 'arrowhead' },
  { id: 'buf', abbreviation: 'BUF', displayName: 'Buffalo Bills', location: 'Buffalo', nickname: 'Bills', color: '#00338D', venueId: 'highmark' },
  { id: 'sf', abbreviation: 'SF', displayName: 'San Francisco 49ers', location: 'San Francisco', nickname: '49ers', color: '#AA0000', venueId: 'levis' },
  { id: 'dal', abbreviation: 'DAL', displayName: 'Dallas Cowboys', location: 'Dallas', nickname: 'Cowboys', color: '#041E42', venueId: 'att' },
  { id: 'phi', abbreviation: 'PHI', displayName: 'Philadelphia Eagles', location: 'Philadelphia', nickname: 'Eagles', color: '#004C54', venueId: 'lincoln' },
  { id: 'mia', abbreviation: 'MIA', displayName: 'Miami Dolphins', location: 'Miami', nickname: 'Dolphins', color: '#008E97', venueId: 'hard-rock' },
  { id: 'bal', abbreviation: 'BAL', displayName: 'Baltimore Ravens', location: 'Baltimore', nickname: 'Ravens', color: '#241773', venueId: 'mt-bank' },
  { id: 'cin', abbreviation: 'CIN', displayName: 'Cincinnati Bengals', location: 'Cincinnati', nickname: 'Bengals', color: '#FB4F14', venueId: 'paycor' },
  { id: 'det', abbreviation: 'DET', displayName: 'Detroit Lions', location: 'Detroit', nickname: 'Lions', color: '#0076B6', venueId: 'ford-field' },
  { id: 'gb', abbreviation: 'GB', displayName: 'Green Bay Packers', location: 'Green Bay', nickname: 'Packers', color: '#203731', venueId: 'lambeau' },
  { id: 'lar', abbreviation: 'LAR', displayName: 'Los Angeles Rams', location: 'Los Angeles', nickname: 'Rams', color: '#003594', venueId: 'sofi' },
  { id: 'sea', abbreviation: 'SEA', displayName: 'Seattle Seahawks', location: 'Seattle', nickname: 'Seahawks', color: '#002244', venueId: 'lumen' },
] as const;

const NFL_VENUES = [
  { id: 'arrowhead', name: 'Arrowhead Stadium', city: 'Kansas City', state: 'MO', capacity: 76416, surface: 'Grass', indoor: false },
  { id: 'highmark', name: 'Highmark Stadium', city: 'Orchard Park', state: 'NY', capacity: 71608, surface: 'A-Turf', indoor: false },
  { id: 'levis', name: "Levi's Stadium", city: 'Santa Clara', state: 'CA', capacity: 68500, surface: 'Bermuda Grass', indoor: false },
  { id: 'att', name: 'AT&T Stadium', city: 'Arlington', state: 'TX', capacity: 80000, surface: 'Matrix Turf', indoor: true },
  { id: 'lincoln', name: 'Lincoln Financial Field', city: 'Philadelphia', state: 'PA', capacity: 69176, surface: 'Desso GrassMaster', indoor: false },
  { id: 'hard-rock', name: 'Hard Rock Stadium', city: 'Miami Gardens', state: 'FL', capacity: 64767, surface: 'Bermuda Grass', indoor: false },
  { id: 'mt-bank', name: 'M&T Bank Stadium', city: 'Baltimore', state: 'MD', capacity: 70745, surface: 'Grass', indoor: false },
  { id: 'paycor', name: 'Paycor Stadium', city: 'Cincinnati', state: 'OH', capacity: 65515, surface: 'Turf', indoor: false },
  { id: 'ford-field', name: 'Ford Field', city: 'Detroit', state: 'MI', capacity: 65000, surface: 'FieldTurf', indoor: true },
  { id: 'lambeau', name: 'Lambeau Field', city: 'Green Bay', state: 'WI', capacity: 81441, surface: 'Desso GrassMaster', indoor: false },
  { id: 'sofi', name: 'SoFi Stadium', city: 'Inglewood', state: 'CA', capacity: 70240, surface: 'Matrix Turf', indoor: true },
  { id: 'lumen', name: 'Lumen Field', city: 'Seattle', state: 'WA', capacity: 68740, surface: 'FieldTurf', indoor: false },
] as const;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a game between two teams
 */
function makeGame(homeTeam: typeof NFL_TEAMS[number], awayTeam: typeof NFL_TEAMS[number], week: number, season: number = 2024) {
  const status = faker.helpers.arrayElement(['scheduled', 'live', 'completed', 'completed', 'completed']); // Bias toward completed

  // Generate scores based on status
  const homeScore = status === 'scheduled' ? 0 : faker.number.int({ min: 3, max: 45 });
  const awayScore = status === 'scheduled' ? 0 : faker.number.int({ min: 3, max: 45 });

  const scheduledDate = faker.date.between({
    from: new Date(`${season}-09-05`),
    to: new Date(`${season}-12-31`)
  });

  return {
    id: randomUUID(),
    espnId: faker.helpers.maybe(() => faker.number.int({ min: 100000, max: 999999 }).toString(), { probability: 0.8 }),
    sportsRadarId: faker.helpers.maybe(() => randomUUID(), { probability: 0.8 }),
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    status,
    homeScore,
    awayScore,
    scheduledAt: scheduledDate,
    startedAt: status !== 'scheduled' ? scheduledDate : null,
    completedAt: status === 'completed' ? new Date(scheduledDate.getTime() + (3.5 * 60 * 60 * 1000)) : null, // 3.5 hours later
    season,
    seasonType: 'regular',
    week,
    period: status === 'live' ? faker.helpers.arrayElement(['1', '2', '3', '4']) : status === 'completed' ? null : null,
    clock: status === 'live' ? `${faker.number.int({ min: 0, max: 15 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}` : null,
    venueId: homeTeam.venueId,
    attendance: faker.helpers.maybe(() => faker.number.int({ min: 50000, max: 85000 }), { probability: 0.7 }),
    weather: faker.helpers.maybe(() => JSON.stringify({
      temp: faker.number.int({ min: 32, max: 85 }),
      condition: faker.helpers.arrayElement(['Clear', 'Cloudy', 'Rain', 'Snow']),
      wind: faker.number.int({ min: 0, max: 25 }),
    }), { probability: 0.6 }),
    broadcasts: JSON.stringify([
      faker.helpers.arrayElement(['CBS', 'FOX', 'NBC', 'ESPN', 'NFL Network', 'Amazon Prime']),
    ]),
    periodScores: status === 'completed' ? JSON.stringify([
      faker.number.int({ min: 0, max: 14 }),
      faker.number.int({ min: 0, max: 17 }),
      faker.number.int({ min: 0, max: 14 }),
      faker.number.int({ min: 0, max: 10 }),
    ]) : null,
  };
}

// ============================================================================
// Main Seed Function
// ============================================================================

async function main() {
  console.log('🌱 Starting NFL Games database seed...\n');

  // ============================================================================
  // Step 1: Clear existing data
  // ============================================================================
  console.log('🗑️  Clearing existing data...');
  await prisma.game.deleteMany({});
  await prisma.venue.deleteMany({});
  await prisma.team.deleteMany({});
  console.log('✅ Existing data cleared\n');

  // ============================================================================
  // Step 2: Seed Venues
  // ============================================================================
  console.log('🏟️  Seeding venues...');
  for (const venue of NFL_VENUES) {
    await prisma.venue.create({ data: venue });
  }
  console.log(`✅ Created ${NFL_VENUES.length} venues\n`);

  // ============================================================================
  // Step 3: Seed Teams
  // ============================================================================
  console.log('🏈 Seeding teams...');
  for (const team of NFL_TEAMS) {
    await prisma.team.create({
      data: {
        id: team.id,
        abbreviation: team.abbreviation,
        displayName: team.displayName,
        location: team.location,
        nickname: team.nickname,
        color: team.color,
        logo: faker.image.url(),
      },
    });
  }
  console.log(`✅ Created ${NFL_TEAMS.length} teams\n`);

  // ============================================================================
  // Step 4: Seed Games (Week 9-12 of 2024 season)
  // ============================================================================
  console.log('📅 Seeding games for weeks 9-12...');
  let totalGames = 0;

  // Generate games for weeks 9-12
  for (let week = 9; week <= 12; week++) {
    // Randomly pair teams for this week (simplified matchups)
    const availableTeams = [...NFL_TEAMS];
    const weekGames = [];

    while (availableTeams.length >= 2) {
      const homeIdx = faker.number.int({ min: 0, max: availableTeams.length - 1 });
      const homeTeam = availableTeams.splice(homeIdx, 1)[0];

      const awayIdx = faker.number.int({ min: 0, max: availableTeams.length - 1 });
      const awayTeam = availableTeams.splice(awayIdx, 1)[0];

      weekGames.push(makeGame(homeTeam, awayTeam, week));
    }

    for (const game of weekGames) {
      await prisma.game.create({ data: game });
      totalGames++;
    }

    console.log(`  ✅ Week ${week}: ${weekGames.length} games`);
  }

  console.log(`✅ Created ${totalGames} total games\n`);

  // ============================================================================
  // Step 5: Display summary
  // ============================================================================
  const statusCounts = await prisma.game.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('📈 Seed Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Teams:      ${await prisma.team.count()}`);
  console.log(`  Venues:     ${await prisma.venue.count()}`);
  console.log(`  Games:      ${await prisma.game.count()}`);
  console.log('\n  Games by Status:');
  for (const { status, _count } of statusCounts) {
    console.log(`    ${status.padEnd(12)}: ${_count}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n💡 Run "cd apps/nfl-games/api && pnpm prisma studio" to view the data\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
