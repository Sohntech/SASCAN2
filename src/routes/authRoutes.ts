import express from 'express';
import { login, register } from '../controllers/authController';
import upload from '../config/multer';

const router = express.Router();

router.post('/register', upload.single('photo'), register);
router.post('/login', login);

export default router;