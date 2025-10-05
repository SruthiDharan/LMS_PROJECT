import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

// Utility for hashing (assuming SALT_ROUNDS is 10)
const SALT_ROUNDS = 10;

// --- ADMIN User Management Functions ---

// ADMIN: Creates a new user (Student or Tutor) manually
export const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Email, password, and role are required.' });
    }

    // Ensure role is a valid type
    if (!['STUDENT', 'TUTOR'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified.' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                firstLogin: true, // Force password change for new users
            },
        });

        return res.status(201).json({ 
            status: 'success', 
            user: { id: newUser.id, email: newUser.email, role: newUser.role },
            message: `${role} created successfully. They must reset their password on first login.`
        });
    } catch (error) {
        if (error.code === 'P2002') { // Prisma error code for unique constraint failure
            return res.status(409).json({ message: 'User with this email already exists.' });
        }
        console.error('Create User Error:', error);
        return res.status(500).json({ message: 'Server error during user creation.' });
    }
};

// ADMIN: Retrieves all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                firstLogin: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ status: 'success', users });
    } catch (error) {
        console.error('Get All Users Error:', error);
        return res.status(500).json({ message: 'Server error while fetching users.' });
    }
};

// ADMIN: Updates a user's role or status
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, role, firstLogin } = req.body;
    
    // Simple validation for updateable fields
    if (role && !['STUDENT', 'TUTOR', 'ADMIN'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified for update.' });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, role, firstLogin },
            select: { id: true, name: true, email: true, role: true, firstLogin: true },
        });

        return res.json({ status: 'success', user: updatedUser, message: 'User updated successfully.' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'User not found.' });
        }
        console.error('Update User Error:', error);
        return res.status(500).json({ message: 'Server error during user update.' });
    }
};

// ADMIN: Deletes a user
export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.user.delete({ where: { id } });
        return res.json({ status: 'success', message: 'User deleted successfully.' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'User not found.' });
        }
        console.error('Delete User Error:', error);
        return res.status(500).json({ message: 'Server error during user deletion.' });
    }
};