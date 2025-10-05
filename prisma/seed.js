// This file is located at prisma/seed.js

import { PrismaClient } from '@prisma/client';
// Ensure you are using the correct bcrypt library installed (bcrypt, not bcryptjs)
import bcrypt from 'bcrypt'; 
// Import dotenv to ensure SALT_ROUNDS is available, as used in your controller logic
import 'dotenv/config'; 

const prisma = new PrismaClient();
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;

// --- CONFIGURATION CONSTANTS ---
const ADMIN_EMAIL = 'admin@lms.com';
const STUDENT_EMAIL = 'student@lms.com';
const TEST_PASSWORD = 'Password1!'; // Single known password for all test users

// Test data structure for courses, modules, and lessons
const contentData = [
    {
        title: "Introduction to Full-Stack Development",
        description: "A comprehensive course covering MERN stack basics.",
        modules: [
            {
                title: "Setup and Fundamentals",
                order: 1,
                lessons: [
                    { title: "Node.js Environment Setup", content: "Setup guide link..." },
                    { title: "Express Server Basics", content: "Routing and middleware tutorial..." }
                ]
            },
            {
                title: "Database Integration (Prisma)",
                order: 2,
                lessons: [
                    { title: "Schema Design", content: "How to define models..." },
                    { title: "CRUD Operations", content: "Creating API handlers..." }
                ]
            }
        ]
    },
    {
        title: "Advanced JavaScript ES6+",
        description: "Deep dive into modern JavaScript features.",
        modules: [
            {
                title: "Asynchronous Programming",
                order: 1,
                lessons: [
                    { title: "Promises and Async/Await", content: "Detailed explanation of concurrency..." },
                    { title: "Error Handling", content: "Try/catch blocks in async functions..." }
                ]
            }
        ]
    }
];

async function main() {
    console.log('--- Starting Seeding Process ---');

    // Hash the common test password once
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);

    // 1. Create ADMIN User (Essential for dashboard and CSV testing)
    const adminUser = await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: {},
        create: {
            email: ADMIN_EMAIL,
            password: hashedPassword,
            name: 'System Admin',
            role: 'ADMIN',
            firstLogin: true, // Force password change for security, even for test admin
        },
    });
    console.log(`✅ Created/Updated Admin user: ${adminUser.email}`);
    
    // 2. Create STUDENT User (Essential for testing student login flow)
    const studentUser = await prisma.user.upsert({
        where: { email: STUDENT_EMAIL },
        update: {},
        create: {
            email: STUDENT_EMAIL,
            password: hashedPassword,
            name: 'Test Student Account',
            role: 'STUDENT',
            firstLogin: true, // Force password change
        },
    });
    console.log(`✅ Created/Updated Student user: ${studentUser.email}`);


    // 3. Seed Course Content
    for (const courseData of contentData) {
        // Create the Course
        const course = await prisma.course.upsert({
            where: { title: courseData.title },
            update: { description: courseData.description },
            create: {
                title: courseData.title,
                description: courseData.description,
                // Assign course creation to the Admin user for schema validity
                createdById: adminUser.id, 
            },
        });
        console.log(`\n- Seeded Course: ${course.title}`);

        // Create Modules for the Course
        for (const moduleData of courseData.modules) {
            const module = await prisma.module.upsert({
                where: { courseId_title: { courseId: course.id, title: moduleData.title } },
                update: { order: moduleData.order },
                create: {
                    title: moduleData.title,
                    order: moduleData.order,
                    courseId: course.id,
                },
            });
            console.log(`  > Seeded Module: ${module.title}`);

            // Create Lessons for the Module
            for (const lessonData of moduleData.lessons) {
                await prisma.lesson.upsert({
                    where: { moduleId_title: { moduleId: module.id, title: lessonData.title } },
                    update: { content: lessonData.content },
                    create: {
                        title: lessonData.title,
                        content: lessonData.content,
                        order: lessonData.order || 0,
                        moduleId: module.id,
                    },
                });
            }
            console.log(`    (Added ${moduleData.lessons.length} lessons)`);
        }
    }

    console.log('\n--- Seeding Complete ---');
    console.log(`\n🔑 Test Credentials: `);
    console.log(`   - ADMIN Email: ${ADMIN_EMAIL}`);
    console.log(`   - STUDENT Email: ${STUDENT_EMAIL}`);
    console.log(`   - Password for BOTH: ${TEST_PASSWORD}`);
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });