import express from 'express';
import 'dotenv/config'; // Make sure environment variables are loaded
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';       
import contentRoutes from './routes/contentRoutes.js'; 

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing 

// Health Check Route
app.get('/', (req, res) => {
    res.send('LMS Backend is Running!');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);         
app.use('/api/courses', contentRoutes);    
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Database URL: ${process.env.DATABASE_URL.substring(0, 30)}...`);
});