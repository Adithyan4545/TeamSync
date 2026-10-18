import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Hackathon } from './src/models/Hackathon';
import { User } from './src/models/User';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamsync');
  console.log('Connected to DB for seeding hackathons...');

  // Get a user to be the creator
  const user = await User.findOne({ email: 'adithyanravi82@gmail.com' });
  if (!user) {
    console.error('Please run seedUser.ts first to create a user');
    process.exit(1);
  }

  // Clear existing hackathons for a fresh start
  await Hackathon.deleteMany({});

  const hackathons = [
    {
      title: 'Global AI Challenge 2026',
      description: 'Build innovative AI solutions to solve real-world problems. Great for beginners to get started with machine learning and generative AI.',
      organizer: 'AI Innovators Co',
      theme: 'Artificial Intelligence',
      difficulty: 'Beginner',
      prize: 1500,
      registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      mode: 'Online',
      minTeamSize: 1,
      maxTeamSize: 4,
      requiredSkills: ['Python', 'Machine Learning', 'React'],
      status: 'Registration Open',
      tags: ['AI', 'ML', 'Beginner Friendly'],
      createdBy: user._id
    },
    {
      title: 'Web3 Innovate Hack',
      description: 'Decentralized applications are the future. Build a dApp on Ethereum or Solana and win huge prizes.',
      organizer: 'Crypto Foundation',
      theme: 'Web3 & Blockchain',
      difficulty: 'Advanced',
      prize: 5000,
      registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      mode: 'Hybrid',
      minTeamSize: 2,
      maxTeamSize: 5,
      requiredSkills: ['Solidity', 'Rust', 'Next.js'],
      status: 'Registration Open',
      tags: ['Blockchain', 'Web3', 'Crypto'],
      createdBy: user._id
    },
    {
      title: 'EcoTech Green Hackathon',
      description: 'Create software that helps reduce carbon footprints and promotes sustainability.',
      organizer: 'Green Earth NGO',
      theme: 'Environment & Sustainability',
      difficulty: 'Intermediate',
      prize: 200,
      registrationDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // past
      eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      mode: 'Online',
      minTeamSize: 1,
      maxTeamSize: 3,
      requiredSkills: ['JavaScript', 'IoT', 'Data Analysis'],
      status: 'Ongoing',
      tags: ['Eco', 'Sustainability', 'IoT'],
      createdBy: user._id
    },
    {
      title: 'Beginner CodeFest',
      description: 'A perfect hackathon for first-timers! Build a simple web app or mobile app and learn from mentors.',
      organizer: 'Tech Newbies',
      theme: 'Open Innovation',
      difficulty: 'Beginner',
      prize: 100,
      registrationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      eventDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      mode: 'Online',
      minTeamSize: 1,
      maxTeamSize: 4,
      requiredSkills: ['HTML', 'CSS', 'JavaScript'],
      status: 'Registration Open',
      tags: ['Beginner', 'Web Development'],
      createdBy: user._id
    }
  ];

  await Hackathon.insertMany(hackathons);
  console.log(`Successfully seeded ${hackathons.length} hackathons`);

  await mongoose.disconnect();
}

seed().catch(console.error);
