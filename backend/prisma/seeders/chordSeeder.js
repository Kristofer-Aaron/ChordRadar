/*
 * Requirements for the usage of this seeder:
 * - Seeder is added to the "scripts" section of package.json as the following: "seed-chords": "node prisma/seeders/chordSeeder.js"
 *   (terminal command: npm run seed-chords)
 * - Required files are present in prisma/data folder (e. g.: chords.txt)
 * - Running database with identical data structure
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '../data', 'chords.txt');
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean).slice(2);


  for (const line of lines) {
    const [gripStr, tuningStr, chordName] = line.split('/');

    //Validate data: check if type is string and the length doesn't exceed the maximum character limit
    if (!gripStr || !tuningStr || !chordName) {
      console.warn(`Skipping invalid line: ${line}`);
      continue;
    }

    if (gripStr.length > 8) {
      console.warn(`Grip too long (max 8): ${gripStr}`);
      continue;
    }

    if (tuningStr.length > 8) {
      console.warn(`Tuning too long (max 8): ${tuningStr}`);
      continue;
    }

    if (chordName.length > 32) {
      console.warn(`Chord name too long (max 32): ${chordName}`);
      continue;
    }

    //Find or create the record of a tuning
    const tuning = await prisma.tunings.upsert({
      where: { value: tuningStr },
      update: {},
      create: { value: tuningStr },
    });

    //Find or create the record of a grip
    const grip = await prisma.grips.upsert({
      where: { strings: gripStr },
      update: {},
      create: { strings: gripStr },
    });

    //Check if a chord with the given parameters already exists
    const existingChord = await prisma.chords.findFirst({
      where: {
        name: chordName,
        tuning_id: tuning.id,
        grip_id: grip.id,
      },
    });

    if (existingChord) {
      console.log(`Chord already exists: ${chordName}`);
      continue;
    }

    //Add the chord if it's unique
    await prisma.chords.create({
      data: {
        name: chordName,
        tuning_id: tuning.id,
        grip_id: grip.id,
      },
    });

    console.log(`Inserted chord: ${chordName}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });