import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // --- Tunings ---
  const standardTuning = await prisma.tuning.upsert({
    where: { value: 'EADGBE' },
    update: {},
    create: { value: 'EADGBE' },
  })

  const dropDTuning = await prisma.tuning.upsert({
    where: { value: 'DADGBE' },
    update: {},
    create: { value: 'DADGBE' },
  })

  // --- Grips ---
  const gripC = await prisma.grip.upsert({
    where: { strings: 'x32010' },
    update: {},
    create: { strings: 'x32010' },
  })

  const gripG = await prisma.grip.upsert({
    where: { strings: '320003' },
    update: {},
    create: { strings: '320003' },
  })

  // --- Chords ---
  await prisma.chord.upsert({
    where: { name: 'C Major' },
    update: {},
    create: {
      name: 'C Major',
      tuning_id: standardTuning.id,
      grip_id: gripC.id,
    },
  })

  await prisma.chord.upsert({
    where: { name: 'G Major' },
    update: {},
    create: {
      name: 'G Major',
      tuning_id: standardTuning.id,
      grip_id: gripG.id,
    },
  })

  await prisma.chord.upsert({
    where: { name: 'D Major (Drop D)' },
    update: {},
    create: {
      name: 'D Major (Drop D)',
      tuning_id: dropDTuning.id,
      grip_id: gripG.id,
    },
  })

  console.log('🌱 Database successfully seeded (idempotent).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })