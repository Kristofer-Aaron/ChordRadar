/*
 * Requirements for the usage of this seeder:
 * - Seeder is added to the "scripts" section of package.json as: "seed-chords": "node prisma/seeders/chordSeeder.js"
 *   (terminal command: npm run seed-chords)
 * - Required files are present in prisma/data folder (e.g.: chords.txt)
 * - Running database with identical data structure
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function main() {
	const filePath = path.join(__dirname, "../data", "chords.txt");
	const lines = fs
		.readFileSync(filePath, "utf-8")
		.split("\n")
		.filter(Boolean)
		.slice(1);

	for (const line of lines) {
		const [gripStr, tuningStr, chordName] = line.split("/");

		// Validate data
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

		if (chordName.length > 16) {
			console.warn(`Chord name too long (max 16): ${chordName}`);
			continue;
		}

		// Find or create tuning
		const tuning = await prisma.Tuning.upsert({
			where: { value: tuningStr },
			update: {},
			create: { value: tuningStr },
		});

		// Find or create grip
		const grip = await prisma.Grip.upsert({
			where: { strings: gripStr },
			update: {},
			create: { strings: gripStr },
		});

		// Find or create notation (based on chordName)
		const notation = await prisma.Notation.upsert({
			where: { value: chordName },
			update: {},
			create: { value: chordName },
		});

		// Check if chord already exists
		const existingChord = await prisma.Chord.findFirst({
			where: {
				notation_id: notation.id,
				tuning_id: tuning.id,
				grip_id: grip.id,
			},
		});

		if (existingChord) {
			console.log(`Chord already exists: ${chordName}`);
			continue;
		}

		// Insert chord with notation_id instead of name
		await prisma.Chord.create({
			data: {
				notation_id: notation.id,
				tuning_id: tuning.id,
				grip_id: grip.id,
			},
		});

		console.log(`Inserted chord with notation: ${chordName}`);
	}

	console.log("Seeding completed!");
}

main()
	.catch((e) => console.error(e))
	.finally(async () => {
		await prisma.$disconnect();
	});
