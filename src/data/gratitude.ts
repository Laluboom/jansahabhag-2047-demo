export interface GratitudeEntry {
  name: string;
  role?: string;
}

export const GRATITUDE_MESSAGE = {
  paragraphs: [
    'When I look at how JanSahabhag 2047 came to be, I see the time, guidance and trust that each of you gave me. I feel grateful and humble, because I could not have reached this point alone. Your support met my need for learning, encouragement and a shared purpose.',
    'In the spirit of Jeevan Vidya, this is kritagyata: recognising, with a full heart, what I have received from you. I would like to return it by making this platform truly useful to young citizens, so that what you gave keeps growing in them.',
    'I am also grateful to those who helped me and whom I forgot to name here. Please know that I have not forgotten what you gave, only to write your name, and my gratitude to you is the same.',
  ],
  attribution: 'Nazim M. Sandh, Founder and Initiator',
};

export const GRATITUDE_ENTRIES: GratitudeEntry[] = [
  {
    name: 'Shri Dadubhai Sandhar',
    role: 'स्वर्गीय। मार्गदर्शक एवं प्रेरणास्रोत: my guide and source of inspiration, whose path I follow.',
  },
  {
    name: 'Shri Ankit Kalaria',
    role: 'CVMS Cell, Atmiya University',
  },
  {
    name: 'Ganesh Bagadia ji',
  },
  {
    name: 'Dr. Hitarth Bhatt',
    role: "Nazim's former professor",
  },
  {
    name: 'Shri Dr. K. D. Ladwa',
    role: 'Principal, Shri Manibhai Virani and Smt. Navalben Virani Science College, Rajkot',
  },
  {
    name: 'Rasida ben Sandh',
  },
  {
    name: 'Dr. Shyam Kumar',
    role: 'IIT Kanpur',
  },
  {
    name: 'Shri Vijay Danwani',
    role: 'CVMS Cell, Atmiya University',
  },
  {
    name: 'Visesh Akbari',
    role: 'Developer of this site. Currently pursuing studies at the University of London.',
  },
];

export const GRATITUDE_CLOSING_LINES: string[] = [
  'and the entire CVMS Cell, Atmiya University',
  'and everyone else who helped and whom I may have forgotten to name',
];

export const GRATITUDE_DISCLOSURE = 'Demo institution, not an official partnership';
