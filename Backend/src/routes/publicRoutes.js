import express from 'express';
import carsRouter from './cars.js';
import leadsRouter from './leads.js';
import authRoutes from './authRoutes.js'; // Importera authRoutes

const router = express.Router();

// Public routes that anyone can access
router.use('/cars', carsRouter);
router.use('/leads', leadsRouter);
router.use(authRoutes); // Använd authRoutes här

export default router;

