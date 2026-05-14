import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

type TeamSeed = {
  teamId: string;
  teamName: string;
  country: string;
  countryLogo?: string;
};

const teams: TeamSeed[] = [
  // AFC (9)
  { teamId: 'AUS', teamName: 'Australia', country: 'Australia', countryLogo: 'https://flagcdn.com/w80/au.png' },
  { teamId: 'IRN', teamName: 'Iran', country: 'Iran', countryLogo: 'https://flagcdn.com/w80/ir.png' },
  { teamId: 'IRQ', teamName: 'Iraq', country: 'Iraq', countryLogo: 'https://flagcdn.com/w80/iq.png' },
  { teamId: 'JPN', teamName: 'Japan', country: 'Japan', countryLogo: 'https://flagcdn.com/w80/jp.png' },
  { teamId: 'JOR', teamName: 'Jordan', country: 'Jordan', countryLogo: 'https://flagcdn.com/w80/jo.png' },
  { teamId: 'QAT', teamName: 'Qatar', country: 'Qatar', countryLogo: 'https://flagcdn.com/w80/qa.png' },
  { teamId: 'KSA', teamName: 'Saudi Arabia', country: 'Saudi Arabia', countryLogo: 'https://flagcdn.com/w80/sa.png' },
  { teamId: 'KOR', teamName: 'South Korea', country: 'South Korea', countryLogo: 'https://flagcdn.com/w80/kr.png' },
  { teamId: 'UZB', teamName: 'Uzbekistan', country: 'Uzbekistan', countryLogo: 'https://flagcdn.com/w80/uz.png' },

  // CAF (10)
  { teamId: 'ALG', teamName: 'Algeria', country: 'Algeria', countryLogo: 'https://flagcdn.com/w80/dz.png' },
  { teamId: 'CPV', teamName: 'Cape Verde', country: 'Cape Verde', countryLogo: 'https://flagcdn.com/w80/cv.png' },
  { teamId: 'COD', teamName: 'DR Congo', country: 'DR Congo', countryLogo: 'https://flagcdn.com/w80/cd.png' },
  { teamId: 'EGY', teamName: 'Egypt', country: 'Egypt', countryLogo: 'https://flagcdn.com/w80/eg.png' },
  { teamId: 'GHA', teamName: 'Ghana', country: 'Ghana', countryLogo: 'https://flagcdn.com/w80/gh.png' },
  { teamId: 'CIV', teamName: 'Ivory Coast', country: 'Ivory Coast', countryLogo: 'https://flagcdn.com/w80/ci.png' },
  { teamId: 'MAR', teamName: 'Morocco', country: 'Morocco', countryLogo: 'https://flagcdn.com/w80/ma.png' },
  { teamId: 'SEN', teamName: 'Senegal', country: 'Senegal', countryLogo: 'https://flagcdn.com/w80/sn.png' },
  { teamId: 'RSA', teamName: 'South Africa', country: 'South Africa', countryLogo: 'https://flagcdn.com/w80/za.png' },
  { teamId: 'TUN', teamName: 'Tunisia', country: 'Tunisia', countryLogo: 'https://flagcdn.com/w80/tn.png' },

  // CONCACAF (6)
  { teamId: 'CAN', teamName: 'Canada', country: 'Canada', countryLogo: 'https://flagcdn.com/w80/ca.png' },
  { teamId: 'CUW', teamName: 'Curacao', country: 'Curacao', countryLogo: 'https://flagcdn.com/w80/cw.png' },
  { teamId: 'HAI', teamName: 'Haiti', country: 'Haiti', countryLogo: 'https://flagcdn.com/w80/ht.png' },
  { teamId: 'MEX', teamName: 'Mexico', country: 'Mexico', countryLogo: 'https://flagcdn.com/w80/mx.png' },
  { teamId: 'PAN', teamName: 'Panama', country: 'Panama', countryLogo: 'https://flagcdn.com/w80/pa.png' },
  { teamId: 'USA', teamName: 'United States', country: 'United States', countryLogo: 'https://flagcdn.com/w80/us.png' },

  // CONMEBOL (6)
  { teamId: 'ARG', teamName: 'Argentina', country: 'Argentina', countryLogo: 'https://flagcdn.com/w80/ar.png' },
  { teamId: 'BRA', teamName: 'Brazil', country: 'Brazil', countryLogo: 'https://flagcdn.com/w80/br.png' },
  { teamId: 'COL', teamName: 'Colombia', country: 'Colombia', countryLogo: 'https://flagcdn.com/w80/co.png' },
  { teamId: 'ECU', teamName: 'Ecuador', country: 'Ecuador', countryLogo: 'https://flagcdn.com/w80/ec.png' },
  { teamId: 'PAR', teamName: 'Paraguay', country: 'Paraguay', countryLogo: 'https://flagcdn.com/w80/py.png' },
  { teamId: 'URU', teamName: 'Uruguay', country: 'Uruguay', countryLogo: 'https://flagcdn.com/w80/uy.png' },

  // OFC (1)
  { teamId: 'NZL', teamName: 'New Zealand', country: 'New Zealand', countryLogo: 'https://flagcdn.com/w80/nz.png' },

  // UEFA (16)
  { teamId: 'AUT', teamName: 'Austria', country: 'Austria', countryLogo: 'https://flagcdn.com/w80/at.png' },
  { teamId: 'BEL', teamName: 'Belgium', country: 'Belgium', countryLogo: 'https://flagcdn.com/w80/be.png' },
  { teamId: 'BIH', teamName: 'Bosnia and Herzegovina', country: 'Bosnia and Herzegovina', countryLogo: 'https://flagcdn.com/w80/ba.png' },
  { teamId: 'CRO', teamName: 'Croatia', country: 'Croatia', countryLogo: 'https://flagcdn.com/w80/hr.png' },
  { teamId: 'CZE', teamName: 'Czech Republic', country: 'Czech Republic', countryLogo: 'https://flagcdn.com/w80/cz.png' },
  { teamId: 'ENG', teamName: 'England', country: 'England', countryLogo: 'https://flagcdn.com/w80/gb-eng.png' },
  { teamId: 'FRA', teamName: 'France', country: 'France', countryLogo: 'https://flagcdn.com/w80/fr.png' },
  { teamId: 'GER', teamName: 'Germany', country: 'Germany', countryLogo: 'https://flagcdn.com/w80/de.png' },
  { teamId: 'NED', teamName: 'Netherlands', country: 'Netherlands', countryLogo: 'https://flagcdn.com/w80/nl.png' },
  { teamId: 'NOR', teamName: 'Norway', country: 'Norway', countryLogo: 'https://flagcdn.com/w80/no.png' },
  { teamId: 'POR', teamName: 'Portugal', country: 'Portugal', countryLogo: 'https://flagcdn.com/w80/pt.png' },
  { teamId: 'SCO', teamName: 'Scotland', country: 'Scotland', countryLogo: 'https://flagcdn.com/w80/gb-sct.png' },
  { teamId: 'ESP', teamName: 'Spain', country: 'Spain', countryLogo: 'https://flagcdn.com/w80/es.png' },
  { teamId: 'SWE', teamName: 'Sweden', country: 'Sweden', countryLogo: 'https://flagcdn.com/w80/se.png' },
  { teamId: 'SUI', teamName: 'Switzerland', country: 'Switzerland', countryLogo: 'https://flagcdn.com/w80/ch.png' },
  { teamId: 'TUR', teamName: 'Turkey', country: 'Turkey', countryLogo: 'https://flagcdn.com/w80/tr.png' },
];

async function main() {
  console.log('Seeding teams...');

  await prisma.team.deleteMany();
  await prisma.team.createMany({ data: teams });

  const count = await prisma.team.count();
  console.log(`Teams seeded: ${count}`);
}

main()
  .catch((error) => {
    console.error('Failed to seed teams:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
