import { Response } from 'express';
import { PrismaClient, PresenceStatus } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

const determinePresenceStatus = (scanTime: Date): PresenceStatus => {
  const hour = scanTime.getHours();
  const minutes = scanTime.getMinutes();
  const timeInMinutes = hour * 60 + minutes;

  if (timeInMinutes <= 8 * 60 + 15) { // Before 8:15
    return PresenceStatus.PRESENT;
  } else if (timeInMinutes <= 8 * 60 + 30) { // Between 8:15 and 8:30
    return PresenceStatus.LATE;
  } else { // After 8:30
    return PresenceStatus.ABSENT;
  }
};

export const scanPresence = async (req: AuthRequest, res: Response) => {
  try {
    const { matricule } = req.body;

    const student = await prisma.user.findFirst({
      where: { matricule },
    });

    if (!student) {
      return res.status(404).json({ message: 'Matricule invalide' });
    }

    const scanTime = new Date();
    const status = determinePresenceStatus(scanTime);

    const presence = await prisma.presence.create({
      data: {
        userId: matricule,
        status,
        scanTime,
      },
      include: {
        user: true,
      },
    });

    res.status(201).json(presence);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Échec du scan' });
  }
};

export const markAbsentAtFourPM = async () => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    // Récupérer tous les apprenants
    const students = await prisma.user.findMany({
      where: {
        role: 'APPRENANT',
      },
    });

    for (const student of students) {
      // Vérifiez si la matricule existe dans la table users
      const userExists = await prisma.user.findUnique({
        where: { matricule: student.matricule! }, // Utilisez la matricule
      });

      if (!userExists) {
        console.log(`Utilisateur non trouvé : ${student.firstName} ${student.lastName}`);
        continue; // Passez à l'utilisateur suivant
      }

      // Vérifiez la présence pour la journée
      const presence = await prisma.presence.findFirst({
        where: {
          userId: student.matricule!, // Utilisez la matricule pour userId
          scanTime: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      // Si aucune présence n'existe, créez-en une nouvelle
      if (!presence) {
        await prisma.presence.create({
          data: {
            userId: student.matricule!, // Utilisez la matricule pour userId
            status: PresenceStatus.ABSENT,
            scanTime: new Date(),
          },
        });
        console.log(`Étudiant ${student.firstName} ${student.lastName} marqué comme absent.`);
      } else {
        console.log(`Présence déjà enregistrée pour ${student.firstName} ${student.lastName} aujourd'hui.`);
      }
    }

    console.log('Processus de marquage des absences terminé.');
  } catch (error) {
    console.error('Erreur lors de la mise à jour des absences:', error);
  }
};





export const getPresences = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, status, referentiel } = req.query;

    let where: any = {};

    if (startDate && endDate) {

      const startOfDay = new Date((new Date(startDate.toString())).setHours(0, 0, 0, 0)); // Début de la journée
      const endOfDay = new Date((new Date(endDate.toString())).setHours(23, 59, 59, 999)); // Fin de la journée
  
      where.scanTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (status) {
      where.status = status;    
    }

    if (referentiel) {
      where.user = {
        referentiel: referentiel as string,
      };
    }

    const presences = await prisma.presence.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        scanTime: 'desc',
      },
    });

    res.json(presences);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStudentPresences = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const presences = await prisma.presence.findMany({
      where: {
        userId,
      },
      orderBy: {
        scanTime: 'desc',
      },
    });

    const stats = {
      total: presences.length,
      present: presences.filter(p => p.status === PresenceStatus.PRESENT).length,
      late: presences.filter(p => p.status === PresenceStatus.LATE).length,
      absent: presences.filter(p => p.status === PresenceStatus.ABSENT).length,
      presencePercentage: 0,
    };

    stats.presencePercentage = (stats.present / stats.total) * 100;

    res.json({
      presences,
      stats,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPresenceToday = async (req: AuthRequest, res: Response) => {
  try{

    const { userId } = req.params;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Début de la journée
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // Fin de la journée

    const presence = await prisma.presence.findFirst({
      where: {
        userId,
        scanTime: {
          gte: startOfDay, // Inclusif
          lte: endOfDay,   // Inclusif
        },
      },
      orderBy: {
        scanTime: 'desc',
      },
    });


    res.json({
      presence,
    });
  }catch(e){
    res.status(500).json({ message: 'Server error' });
  }
}