import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAdminDashboardSummary = async (req, res) => {
    try {
        // 1. Get Total Students
        const totalStudents = await prisma.user.count({
            where: { role: 'STUDENT' },
        });

        // 2. Get Total Courses
        const totalCourses = await prisma.course.count();

        // 3. Get Recent Activity
        const recentActivity = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, name: true, email: true, createdAt: true },
        });
        
        return res.json({
            status: 'success',
            data: {
                totalStudents,
                totalCourses,
                recentActivity,
            },
        });
    } catch (error) {
        console.error('Dashboard Fetch Error:', error);
        return res.status(500).json({ message: 'Failed to fetch dashboard data.', error: error.message });
    }
};