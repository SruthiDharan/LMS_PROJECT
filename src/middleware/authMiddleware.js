import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const authMiddleware = (requiredRole) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Authorization token missing or malformed' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET); 
            
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, role: true, firstLogin: true }
            });

            if (!user) {
                return res.status(401).json({ message: 'Invalid token or user not found' });
            }
            
            // Check Role Authorization
            if (user.role !== requiredRole) {
                return res.status(403).json({ message: `Access denied. Requires ${requiredRole} role.` });
            }

            req.user = user;
            next();

        } catch (error) {
            console.error('Auth Error:', error);
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }
    };
};