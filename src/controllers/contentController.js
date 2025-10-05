import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// --- ADMIN Content Management (CRUD) ---

// [C]reate Course
export const createCourse = async (req, res) => {
    const { title, description } = req.body;
    // Get the Admin's ID from the JWT payload
    const createdById = req.user.userId; 

    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required.' });
    }

    try {
        const newCourse = await prisma.course.create({
            data: {
                title,
                description,
                createdById, // Link to the Admin user
                // tutorId can be added here if provided in req.body
            },
        });
        return res.status(201).json({ status: 'success', course: newCourse, message: 'Course created.' });
    } catch (error) {
        if (error.code === 'P2002') {
             return res.status(409).json({ message: 'A course with this title already exists.' });
        }
        console.error('Create Course Error:', error);
        return res.status(500).json({ message: 'Server error creating course.' });
    }
};

// [U]pdate Course
export const updateCourse = async (req, res) => {
    const { courseId } = req.params;
    const { title, description, tutorId } = req.body;

    try {
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: { title, description, tutorId },
        });
        return res.json({ status: 'success', course: updatedCourse, message: 'Course updated.' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Course not found.' });
        }
        console.error('Update Course Error:', error);
        return res.status(500).json({ message: 'Server error updating course.' });
    }
};

// [D]elete Course
export const deleteCourse = async (req, res) => {
    const { courseId } = req.params;

    try {
        // Prisma automatically handles cascading deletes if configured in schema,
        // otherwise, you need to manually delete modules/lessons first.
        await prisma.course.delete({ where: { id: courseId } });
        return res.json({ status: 'success', message: 'Course deleted successfully.' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Course not found.' });
        }
        console.error('Delete Course Error:', error);
        return res.status(500).json({ message: 'Server error deleting course.' });
    }
};

// --- Module CRUD (C, U, D) are similar to Course CRUD and omitted for brevity ---
// --- You would add them here: createModule, updateModule, deleteModule ---


// --- STUDENT/Public Content Read (Read All/Read Single) ---

// [R]ead All Courses (For Catalog)
export const getAllCourses = async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            // Select only necessary fields for the catalog view
            select: {
                id: true,
                title: true,
                description: true,
                tutor: { select: { name: true } }, // Include tutor name
            },
            orderBy: { createdAt: 'asc' },
        });
        return res.json({ status: 'success', courses });
    } catch (error) {
        console.error('Get All Courses Error:', error);
        return res.status(500).json({ message: 'Server error fetching courses.' });
    }
};

// [R]ead Single Course (Deep Dive)
export const getCourseDetails = async (req, res) => {
    const { courseId } = req.params;
    
    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    orderBy: { order: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { order: 'asc' },
                            select: {
                                id: true,
                                title: true,
                                order: true,
                                // Content will be fetched only when the student views the lesson
                            }
                        },
                    },
                },
                tutor: { select: { name: true, email: true } },
            },
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        
        return res.json({ status: 'success', course });
    } catch (error) {
        console.error('Get Course Details Error:', error);
        return res.status(500).json({ message: 'Server error fetching course details.' });
    }
};