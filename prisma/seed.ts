import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SYSTEM_SUBJECTS = [
  // Core subjects (RSMo 167.012)
  { name: 'Reading', isCore: true, sortOrder: 1 },
  { name: 'Language Arts', isCore: true, sortOrder: 2 },
  { name: 'Mathematics', isCore: true, sortOrder: 3 },
  { name: 'Social Studies', isCore: true, sortOrder: 4 },
  { name: 'Science', isCore: true, sortOrder: 5 },
  // Non-core subjects
  { name: 'Art', isCore: false, sortOrder: 6 },
  { name: 'Music', isCore: false, sortOrder: 7 },
  { name: 'Physical Education', isCore: false, sortOrder: 8 },
  { name: 'History', isCore: false, sortOrder: 9 },
  { name: 'Foreign Language', isCore: false, sortOrder: 10 },
  { name: 'Technology', isCore: false, sortOrder: 11 },
  { name: 'Bible/Faith Studies', isCore: false, sortOrder: 12 },
]

async function main() {
  console.log('Seeding system subjects...')

  for (const subject of SYSTEM_SUBJECTS) {
    const existing = await prisma.subject.findFirst({
      where: { name: subject.name, isSystem: true, familyId: null },
    })

    if (!existing) {
      await prisma.subject.create({
        data: {
          ...subject,
          isSystem: true,
          familyId: null,
        },
      })
      console.log(`  ✓ Created: ${subject.name} (${subject.isCore ? 'core' : 'non-core'})`)
    } else {
      console.log(`  — Exists:  ${subject.name}`)
    }
  }

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
