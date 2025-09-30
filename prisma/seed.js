import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  
  const tempPassword = 'P@ssword123'; 
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
  console.log('Starting user seeding...');

  // Create ADMIN User 
  const admin = await prisma.user.upsert({
    where: { email: 'admin@institution.edu' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@institution.edu',
      password: hashedPassword,
      role: 'ADMIN', 
      firstLogin: false, 
    },
  });

  // create STUDENT User 
  const student = await prisma.user.upsert({
    where: { email: 'student@institution.edu' },
    update: {},
    create: {
      name: 'Test Student',
      email: 'student@institution.edu',
      password: hashedPassword,
      role: 'STUDENT', 
      firstLogin: true, 
    },
  });

  console.log('✅ Seeding complete.');
  console.log(`Test Credentials: admin/student@institution.edu | P@ssword123`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });