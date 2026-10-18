import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Hackathon } from '../models/Hackathon';
import { User } from '../models/User';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamsync';

const realHackathons = [
  {
    title: 'Global AI Hackathon 2026',
    description: 'Join thousands of developers worldwide to build the next generation of AI-powered applications. Tackle global challenges using LLMs, computer vision, and machine learning.',
    organizer: 'AI Builders Foundation',
    theme: 'Artificial Intelligence & Machine Learning',
    difficulty: 'Intermediate',
    prize: 50000,
    registrationDeadline: new Date('2026-09-15T23:59:59Z'),
    eventDate: new Date('2026-10-01T09:00:00Z'),
    venue: 'Global (Virtual)',
    mode: 'Online',
    minTeamSize: 2,
    maxTeamSize: 5,
    requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'React'],
    eligibility: 'Open to all developers and students globally.',
    registrationFee: 0,
    registrationLink: 'https://devpost.com',
    officialWebsite: 'https://devpost.com',
    contactEmail: 'contact@aihackathon.com',
    tags: ['AI', 'Machine Learning', 'GenAI'],
    status: 'Registration Open',
    popularityScore: 98
  },
  {
    title: 'Web3 & DeFi Summit Hackathon',
    description: 'Build decentralized applications, smart contracts, and DeFi protocols. Compete for massive prizes from top blockchain sponsors.',
    organizer: 'Blockchain Alliance',
    theme: 'Blockchain, Web3, DeFi',
    difficulty: 'Advanced',
    prize: 75000,
    registrationDeadline: new Date('2026-08-30T23:59:59Z'),
    eventDate: new Date('2026-09-10T09:00:00Z'),
    venue: 'San Francisco, CA & Virtual',
    mode: 'Hybrid',
    minTeamSize: 1,
    maxTeamSize: 4,
    requiredSkills: ['Solidity', 'Rust', 'TypeScript', 'Web3.js'],
    eligibility: 'Open to Web3 enthusiasts and blockchain developers.',
    registrationFee: 0,
    registrationLink: 'https://ethglobal.com',
    officialWebsite: 'https://ethglobal.com',
    contactEmail: 'hello@web3summit.com',
    tags: ['Web3', 'Blockchain', 'DeFi', 'Crypto'],
    status: 'Registration Open',
    popularityScore: 85
  },
  {
    title: 'ClimateTech Innovators Challenge',
    description: 'Develop software and hardware solutions to combat climate change, optimize renewable energy grids, and promote sustainability.',
    organizer: 'GreenTech Org',
    theme: 'Sustainability & Climate Tech',
    difficulty: 'All Levels',
    prize: 25000,
    registrationDeadline: new Date('2026-11-01T23:59:59Z'),
    eventDate: new Date('2026-11-15T09:00:00Z'),
    venue: 'Virtual',
    mode: 'Online',
    minTeamSize: 2,
    maxTeamSize: 6,
    requiredSkills: ['Data Science', 'IoT', 'Hardware', 'React'],
    eligibility: 'Students and professionals passionate about climate tech.',
    registrationFee: 0,
    registrationLink: 'https://devpost.com',
    officialWebsite: 'https://devpost.com',
    contactEmail: 'green@climatetech.org',
    tags: ['Climate', 'Sustainability', 'GreenTech'],
    status: 'Upcoming',
    popularityScore: 72
  },
  {
    title: 'HackMIT 2026',
    description: 'One of the premier collegiate hackathons in the world. Build incredible software and hardware projects over an intense 24-hour period.',
    organizer: 'Massachusetts Institute of Technology',
    theme: 'Open Innovation',
    difficulty: 'All Levels',
    prize: 15000,
    registrationDeadline: new Date('2026-09-01T23:59:59Z'),
    eventDate: new Date('2026-09-18T09:00:00Z'),
    venue: 'Cambridge, MA',
    mode: 'Offline',
    minTeamSize: 1,
    maxTeamSize: 4,
    requiredSkills: ['Full Stack', 'Mobile App', 'Hardware'],
    eligibility: 'Undergraduate students only.',
    registrationFee: 0,
    registrationLink: 'https://hackmit.org',
    officialWebsite: 'https://hackmit.org',
    contactEmail: 'help@hackmit.org',
    tags: ['Student', 'Collegiate', 'Open Theme'],
    status: 'Registration Open',
    popularityScore: 99
  },
  {
    title: 'GameDev Jam 2026',
    description: 'Create an amazing game from scratch in just 48 hours! Theme will be announced at the start of the event. May the best game win.',
    organizer: 'Indie Game Alliance',
    theme: 'Game Development',
    difficulty: 'Intermediate',
    prize: 10000,
    registrationDeadline: new Date('2026-08-20T23:59:59Z'),
    eventDate: new Date('2026-08-25T09:00:00Z'),
    venue: 'Virtual',
    mode: 'Online',
    minTeamSize: 1,
    maxTeamSize: 5,
    requiredSkills: ['Unity', 'Unreal Engine', 'C#', 'C++', 'Godot'],
    eligibility: 'Open to game developers of all ages.',
    registrationFee: 0,
    registrationLink: 'https://itch.io/jams',
    officialWebsite: 'https://itch.io/jams',
    contactEmail: 'jam@indiegame.org',
    tags: ['GameDev', 'Unity', 'Design'],
    status: 'Registration Open',
    popularityScore: 88
  },
  {
    title: 'CyberSecurity Capture The Flag (CTF)',
    description: 'Test your hacking skills against the best. Reverse engineering, cryptography, web exploitation, and pwn challenges await.',
    organizer: 'CyberSec Ops',
    theme: 'Cybersecurity',
    difficulty: 'Advanced',
    prize: 30000,
    registrationDeadline: new Date('2026-10-15T23:59:59Z'),
    eventDate: new Date('2026-10-25T09:00:00Z'),
    venue: 'Virtual',
    mode: 'Online',
    minTeamSize: 1,
    maxTeamSize: 4,
    requiredSkills: ['Python', 'C', 'Networking', 'Reverse Engineering'],
    eligibility: 'Open to all security enthusiasts.',
    registrationFee: 0,
    registrationLink: 'https://ctftime.org',
    officialWebsite: 'https://ctftime.org',
    contactEmail: 'admin@cybersecops.com',
    tags: ['CTF', 'Security', 'Hacking'],
    status: 'Upcoming',
    popularityScore: 92
  }
];

// Generate 150 realistic hackathons
const prefixes = ['Global', 'National', 'Winter', 'Spring', 'Summer', 'Autumn', 'Web3', 'AI', 'Cloud', 'Student', 'Collegiate', 'Enterprise', 'Open Source', 'NextGen', 'Future'];
const topics = ['AI & ML', 'Blockchain', 'Web Development', 'GameDev', 'Cybersecurity', 'IoT', 'AR/VR', 'HealthTech', 'FinTech', 'EdTech', 'CleanTech', 'SpaceTech', 'DevOps', 'Mobile Apps', 'Robotics'];
const suffixes = ['Hackathon 2026', 'Summit', 'Innovators Challenge', 'Jam', 'CTF', 'Buildathon', 'Codefest', 'Sprint', 'Showcase', 'Derby'];
const organizers = ['Tech Alliance', 'Major League Hacking', 'Google Developer Groups', 'Microsoft Learn', 'AWS Community', 'Stanford University', 'MIT', 'Berkeley', 'Ethereum Foundation', 'OpenAI', 'Meta', 'Stripe', 'Indie Hackers', 'Devpost', 'HackerEarth'];
const modes = ['Online', 'Offline', 'Hybrid'];
const locations = ['Virtual', 'San Francisco, CA', 'New York, NY', 'London, UK', 'Berlin, Germany', 'Bangalore, India', 'Toronto, Canada', 'Singapore', 'Tokyo, Japan', 'Sydney, Australia'];

const generateMockHackathons = (count: number) => {
  const result = [...realHackathons]; // keep the original 6 as base
  const usedTitles = new Set(realHackathons.map(h => h.title));
  
  while (result.length - realHackathons.length < count) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    const title = `${prefix} ${topic} ${suffix}`;
    
    if (usedTitles.has(title)) {
      continue;
    }
    
    usedTitles.add(title);
    
    const organizer = organizers[Math.floor(Math.random() * organizers.length)];
    
    const now = new Date();
    // Randomize dates (some active, some upcoming, some past)
    const offsetDays = Math.floor(Math.random() * 90) - 20; // -20 to +70 days from now
    const regDate = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    const eventDate = new Date(regDate.getTime() + (Math.floor(Math.random() * 14) + 2) * 24 * 60 * 60 * 1000);
    
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const venue = mode === 'Online' ? 'Virtual' : locations[Math.floor(Math.random() * locations.length)];
    
    result.push({
      title,
      description: `Join thousands of developers in this incredible ${topic} event. Build cutting-edge solutions, network with industry professionals from ${organizer}, and compete for amazing prizes!`,
      organizer: organizer,
      theme: topic,
      difficulty: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'][Math.floor(Math.random() * 4)],
      prize: Math.floor(Math.random() * 90000) + 1000,
      registrationDeadline: regDate,
      eventDate: eventDate,
      venue: venue,
      mode: mode,
      minTeamSize: 1,
      maxTeamSize: Math.floor(Math.random() * 4) + 3, // 3 to 6
      requiredSkills: [topic.split(' ')[0], 'JavaScript', 'Python', 'React', 'Node.js'].slice(0, Math.floor(Math.random() * 3) + 2),
      eligibility: 'Open to everyone globally.',
      registrationFee: 0,
      registrationLink: 'https://devpost.com',
      officialWebsite: 'https://devpost.com',
      contactEmail: `contact@${organizer.toLowerCase().replace(/\s/g, '')}.com`,
      tags: [topic.split(' ')[0], mode, 'Innovation'],
      status: regDate > now ? 'Registration Open' : 'Closed',
      popularityScore: Math.floor(Math.random() * 100)
    });
  }
  return result;
};

const allHackathonsToSeed = generateMockHackathons(300); // 6 real + 300 mock = 306 total

async function seedHackathons() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find any user to set as the "creator" of these hackathons (admin user)
    const adminUser = await User.findOne();
    if (!adminUser) {
      console.log('No user found in the database. Please register a user first.');
      process.exit(1);
    }

    // Map creator to the hackathons
    const hackathonsWithCreator = allHackathonsToSeed.map(h => ({
      ...h,
      createdBy: adminUser._id
    }));

    // Clear existing hackathons if needed (optional)
    await Hackathon.deleteMany({});
    console.log('Cleared existing hackathons');

    // Insert new hackathons
    await Hackathon.insertMany(hackathonsWithCreator);
    console.log(`Successfully seeded ${allHackathonsToSeed.length} realistic hackathons!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding hackathons:', error);
    process.exit(1);
  }
}

seedHackathons();
