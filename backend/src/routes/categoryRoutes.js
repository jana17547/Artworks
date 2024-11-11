import express from 'express';
import { createCategory, getCategories  } from '../controllers/categoryController.js'; 
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Ruta za kreiranje nove kategorije
router.post('/',verifyToken, createCategory);

router.get('/', getCategories);

export default router;
