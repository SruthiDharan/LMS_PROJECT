import { PrismaClient } from '@prisma/client';
import csv from 'csv-parser';
import fs from 'fs';
import bcrypt from 'bcrypt';
import path from 'path';
const prisma = new PrismaClient();

// Ensure the 'uploads' folder exists
const UPLOAD_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

const generateTempPassword = (length = 8) => {
    // Generates a simple, random temporary password
    return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
};

export const uploadStudents = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded.' });
    }

    const filePath = req.file.path;
    const students = [];
    const tempPasswords = [];
    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;

    try {
        // 1. Parse CSV File
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.email && row.name) {
                        students.push(row);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (students.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'CSV file is empty or missing required fields (email, name).' });
        }

        // 2. Prepare data for database insertion
        const dataToInsert = await Promise.all(students.map(async (student) => {
            const tempPassword = generateTempPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

            tempPasswords.push({ email: student.email, password: tempPassword });

            return {
                email: student.email.toLowerCase(),
                name: student.name,
                password: hashedPassword,
                role: 'STUDENT',
                firstLogin: true,
            };
        }));

        // 3. Insert into database (using upsert to avoid crashing on duplicate emails)
        const insertionPromises = dataToInsert.map(data => 
            prisma.user.upsert({
                where: { email: data.email },
                update: {}, // Skip update if user exists
                create: data,
            })
        );
        
        const insertions = await prisma.$transaction(insertionPromises);

        fs.unlinkSync(filePath); // Delete file after successful processing

        return res.json({
            status: 'success',
            message: `${insertions.length} student records processed.`,
            tempPasswords: tempPasswords 
        });

    } catch (error) {
        console.error('CSV Processing Error:', error);
        // Clean up file on error
        if (fs.existsSync(filePath)) {
             fs.unlinkSync(filePath); 
        }
        return res.status(500).json({ message: 'Failed to process CSV file.', error: error.message });
    }
};