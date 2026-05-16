import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Upsert users - safe to run multiple times
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {},
    create: {
      name: 'Member User',
      email: 'member@example.com',
      password: hashedPassword,
      role: 'MEMBER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'member2@example.com' },
    update: {},
    create: {
      name: 'Member User 2',
      email: 'member2@example.com',
      password: hashedPassword,
      role: 'MEMBER',
    },
  });

  // Create sample project only if it doesn't exist
  let project = await prisma.project.findFirst({
    where: { name: 'Alpha Project' },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Alpha Project',
        description: 'First sample project for Team Task Manager',
        createdById: adminUser.id,
      },
    });

    // Add project members
    await prisma.projectMember.createMany({
      data: [
        { userId: adminUser.id, projectId: project.id, role: 'ADMIN' },
        { userId: memberUser.id, projectId: project.id, role: 'MEMBER' },
      ],
      skipDuplicates: true,
    });

    // Create sample tasks
    await prisma.task.createMany({
      data: [
        {
          title: 'Design database schema',
          description: 'Create the initial Prisma schema for the project',
          priority: 'HIGH',
          status: 'DONE',
          projectId: project.id,
          createdById: adminUser.id,
          assignedToId: adminUser.id,
        },
        {
          title: 'Setup Express server',
          description: 'Initialize Node.js and Express with basic middleware',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          projectId: project.id,
          createdById: adminUser.id,
          assignedToId: memberUser.id,
        },
        {
          title: 'Implement Authentication',
          description: 'Add JWT login and register routes',
          priority: 'MEDIUM',
          status: 'TODO',
          projectId: project.id,
          createdById: adminUser.id,
          assignedToId: null,
        },
      ],
    });
  }

  console.log('Seed complete.');
  console.log('  admin@example.com    (ADMIN)  - password123');
  console.log('  member@example.com   (MEMBER) - password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
