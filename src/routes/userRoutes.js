import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js'; // Assuming this path is correct
import * as userController from '../controllers/userController.js';

const router = express.Router();

// All routes below require Admin access
router.use(authMiddleware(['ADMIN']));

// [C]reate User (Manual registration)
router.post('/', userController.createUser);

// [R]ead All Users (For Admin dashboard list)
router.get('/', userController.getAllUsers);

// [U]pdate User
router.put('/:id', userController.updateUser);

// [D]elete User
router.delete('/:id', userController.deleteUser);

export default router;