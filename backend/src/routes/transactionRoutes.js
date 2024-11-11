import express from 'express';
import { getAllTransactions } from '../controllers/transactionController.js';

const router = express.Router();

// Ruta za dohvatanje svih transakcija
router.get('/', getAllTransactions);

export default router;
