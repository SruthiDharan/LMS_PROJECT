import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as contentController from '../controllers/contentController.js';

const router = express.Router();

// --- PUBLIC/STUDENT ROUTES ---
// Get all courses (catalog view) - accessible to any authenticated user
router.get('/', authMiddleware(), contentController.getAllCourses);
// Get specific course details (structure) - accessible to any authenticated user
router.get('/:courseId', authMiddleware(), contentController.getCourseDetails);


// --- ADMIN MANAGEMENT ROUTES (CRUD) ---
// Secure the remaining routes for ADMIN only
router.use(authMiddleware(['ADMIN']));

// Course CRUD
router.post('/', contentController.createCourse);         // [C]reate
router.put('/:courseId', contentController.updateCourse); // [U]pdate
router.delete('/:courseId', contentController.deleteCourse); // [D]elete

// Note: Module and Lesson CRUD endpoints (e.g., POST /:courseId/modules, PUT /modules/:moduleId) 
// would be added here following the same pattern, but are omitted for brevity.

export default router;