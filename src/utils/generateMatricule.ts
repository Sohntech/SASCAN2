import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateMatricule = async (referentiel: string): Promise<string> => {
  // Get current year
  const year = new Date().getFullYear().toString().slice(-2);
  
  // Get referentiel prefix
  const prefixMap: { [key: string]: string } = {
    'RefDigital': 'RD',
    'DevWeb': 'DW',
    'DevData': 'DD',
    'AWS': 'AW',
    'Hackeuse': 'HK'
  };
  
  const prefix = prefixMap[referentiel] || 'XX';
  
  // Get count of students in this referentiel for this year
  const count = await prisma.user.count({
    where: {
      referentiel,
      matricule: {
        startsWith: `${prefix}${year}`
      }
    }
  });
  
  // Generate sequence number (padded with zeros)
  const sequence = (count + 1).toString().padStart(3, '0');
  
  // Combine all parts
  return `${prefix}${year}${sequence}`;
};