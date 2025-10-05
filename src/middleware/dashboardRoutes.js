import express from 'express';
import { getAdminDashboardSummary } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/v1/admin/dashboard/summary
router.get(
    '/summary', 
    authMiddleware('ADMIN'), 
    getAdminDashboardSummary
);

export default router;