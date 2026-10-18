import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './src/models/User';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamsync');
  console.log('Connected to DB');

  const email = 'adithyanravi82@gmail.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('User already exists, updating password and verifying...');
    existing.password = await bcrypt.hash('Rohit45@', 12);
    existing.isVerified = true;
    await existing.save();
    console.log('User updated successfully');
  } else {
    console.log('Creating user...');
    const hashed = await bcrypt.hash('Rohit45@', 12);
    const user = new User({
      name: 'Adithyan',
      email: email,
      password: hashed,
      role: 'student',
      isVerified: true
    });
    await user.save();
    console.log('User created successfully');
  }
  
  await mongoose.disconnect();
}

seed().catch(console.error);
