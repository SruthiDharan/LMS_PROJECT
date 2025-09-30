import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'A_VERY_SECURE_FALLBACK_KEY'; 


const generateToken = (userId, userRole, isFirstLogin) => {
    return jwt.sign(
        { 
            id: userId, 
            role: userRole, 
            firstLogin: isFirstLogin 
        },
        JWT_SECRET,
        { expiresIn: '24h' } 
    );
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        
        const user = await prisma.user.findUnique({
            where: { email },
            
            select: { id: true, email: true, password: true, role: true, firstLogin: true }
        });

        if (!user) {
            
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        
        
        let redirectTo = '';

        if (user.firstLogin) {
            
            redirectTo = '/auth/reset-password';
        } else {
           
            switch (user.role) {
                case 'ADMIN':
                    redirectTo = '/admin/dashboard';
                    break;
                case 'TUTOR':
                    redirectTo = '/tutor/dashboard';
                    break;
                case 'STUDENT':
                default:
                    redirectTo = '/student/dashboard';
                    break;
            }
        }

        
        const token = generateToken(user.id, user.role, user.firstLogin);
        
        
        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: user.id, email: user.email, role: user.role, firstLogin: user.firstLogin },
            redirectTo, 
        });

    } catch (error) {
        console.error('Login processing error:', error);
        return res.status(500).json({ error: 'An internal server error occurred during login.' });
    }
};