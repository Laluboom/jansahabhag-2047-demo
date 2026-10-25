import { Institution } from '../../types/domain';

export const DEMO_COLLEGE_FULL_NAME =
  'Shri Manibhai Virani and Smt. Navalben Virani Science College (Autonomous), Rajkot';
export const DEMO_COLLEGE_SHORT_NAME = 'Virani Science College';

export const seedInstitutions: Institution[] = [
  {
    id: 'inst_vsc_rajkot',
    name: DEMO_COLLEGE_FULL_NAME,
    fullName: DEMO_COLLEGE_FULL_NAME,
    shortName: DEMO_COLLEGE_SHORT_NAME,
    type: 'college',
    code: 'VSC-RJT-001',
    district: 'Rajkot',
    state: 'Gujarat',
    activeParticipantsCount: 15,
    programmesCount: 2,
    contactEmail: 'demo@vsc.edu.internal',
    bannerUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80',
    schemaVersion: 1,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-10-24T00:00:00Z',
  },
];
