import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/generateToken';
import { generateQRCode } from '../utils/generateQR';
import { generateMatricule } from '../utils/generateMatricule';
import { loginSchema, registerSchema } from '../validations/authValidation';
import cloudinary from '../config/cloudinary';
import { FileRequest } from '../types';

const prisma = new PrismaClient(); 

export const register = async (req: FileRequest, res: Response) => {
  try {
    
    const validatedData = registerSchema.parse(req.body);
    
    const userExists = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    let photoUrl = undefined;
    if (req.file) {
      console.log('Fichier reçu:', req.file);
      const result = await cloudinary.uploader.upload(req.file.path);
      photoUrl = result.secure_url;
      console.log('Photo uploadée sur Cloudinary:', photoUrl);
    } else {
      console.log('Aucun fichier reçu');
    }
    

    let matricule = undefined;
    let qrCode = undefined;

    if (validatedData.role === 'APPRENANT') {
      if (!validatedData.referentiel) {
        return res.status(400).json({ message: 'Referentiel is required for students' });
      }
      
      // Generate matricule
      matricule = await generateMatricule(validatedData.referentiel);
      
      // Generate QR Code with matricule
      qrCode = await generateQRCode(matricule);
    }

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        referentiel: validatedData.referentiel,
        matricule,
        qrCode,
        photoUrl,
      },
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      matricule: user.matricule,
      referentiel: user.referentiel,
      photoUrl: user.photoUrl,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid input' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (user && (await bcrypt.compare(validatedData.password, user.password))) {
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        matricule: user.matricule,
        referentiel: user.referentiel,
        photoUrl: user.photoUrl,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid input' });
  }
};
