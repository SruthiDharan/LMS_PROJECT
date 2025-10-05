import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();

// Helper to ensure password meets minimum complexity
const validatePassword = (password) => {
    // Requires: Minimum 8 characters, at least one uppercase, one lowercase, one number, one special character.
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        
        // JWT Token Generation: Session Timeout implemented here (1 hour)
        const token = jwt.sign(
            { userId: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        const dashboard = user.role === 'ADMIN' ? 'admin' : 'student';

        return res.json({
            status: 'success',
            token: token,
            userId: user.id,
            role: user.role,
            dashboard: dashboard,
            needsPasswordReset: user.firstLogin,
            message: `Login successful. Welcome, ${user.role}.`
        });

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ message: 'Server error during login.' });
    }
};

export const resetPassword = async (req, res) => {
    // The user ID is retrieved from the JWT token validated by the middleware
    const userId = req.user.userId; 
    const { oldPassword, newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ message: 'New password is required.' });
    }

    if (!validatePassword(newPassword)) {
        return res.status(400).json({ 
            message: 'Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.' 
        });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 1. Check if the user is forced to reset (firstLogin)
        if (user.firstLogin) {
            // For first login reset, we do not require the old password, but check if the temporary password matches
            if (!(await bcrypt.compare(oldPassword, user.password))) {
                 return res.status(401).json({ message: 'Incorrect temporary password provided.' });
            }
        } else {
            // 2. For standard password change, the old password must be provided and must match
            if (!oldPassword || !(await bcrypt.compare(oldPassword, user.password))) {
                return res.status(401).json({ message: 'Incorrect old password.' });
            }
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password and set firstLogin to false
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                firstLogin: false,
            },
        });

        return res.json({ 
            status: 'success', 
            message: 'Password updated successfully. First login flag removed.' 
        });

    } catch (error) {
        console.error('Password Reset Error:', error);
        return res.status(500).json({ message: 'Server error during password reset.' });
    }
};