import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadStudents } from '../controllers/csvController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure Multer for file uploads
const upload = multer({
    dest: 'uploads/', // Temporary storage location
    fileFilter: (req, file, cb) => {
        // Only allow CSV files
        if (path.extname(file.originalname).toLowerCase() !== '.csv') {
            return cb(new Error('Only CSV files are allowed'), false);
        }
        cb(null, true);
    }
});

// POST /api/v1/admin/upload-students
router.post(
    '/upload-students', 
    authMiddleware('ADMIN'), 
    upload.single('csvFile'), 
    uploadStudents
);

export default router;