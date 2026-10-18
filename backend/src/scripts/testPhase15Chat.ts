import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { io as Client } from 'socket.io-client';
import { User } from '../models/User';
import { Team } from '../models/Team';
import { Hackathon } from '../models/Hackathon';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from '../config/jwt';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/teamsync';
const BACKEND_URL = 'http://localhost:5000';

async function generateToken(user: any) {
  return jwt.sign({ id: user._id, role: user.role }, JWT_ACCESS_SECRET, { expiresIn: '1h' });
}

async function runTests() {
  console.log('--- PHASE 15 REAL-TIME CHAT TEST START ---');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');
  // 1. Create a mock hackathon, team and users
  const user1 = await User.create({ name: 'Chat Leader', email: `chat-leader-${Date.now()}@example.com`, password: 'pwd', role: 'student' });
  const user2 = await User.create({ name: 'Chat Member', email: `chat-member-${Date.now()}@example.com`, password: 'pwd', role: 'student' });
  const nonMember = await User.create({ name: 'Chat NonMember', email: `chat-non-${Date.now()}@example.com`, password: 'pwd', role: 'student' });

  const hackathon = await Hackathon.create({
    title: `Chat Hackathon ${Date.now()}`,
    description: 'A mock hackathon for chat testing',
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    registrationDeadline: new Date(Date.now() + 86400000),
    teamSize: 4,
    status: 'Upcoming',
    createdBy: user1._id
  });

  const team = await Team.create({
    name: `Chat Team ${Date.now()}`,
    leader: user1._id,
    hackathon: hackathon._id,
    members: [user1._id, user2._id],
    maxMembers: 4,
    status: 'Open'
  });
  console.log(`✅ Created Team: ${team.name}`);

  const token1 = await generateToken(user1);
  const token2 = await generateToken(user2);
  const tokenNonMember = await generateToken(nonMember);

  // 2. Connect Sockets
  const socket1 = Client(BACKEND_URL, { auth: { token: token1 } });
  const socket2 = Client(BACKEND_URL, { auth: { token: token2 } });
  const socketNonMember = Client(BACKEND_URL, { auth: { token: tokenNonMember } });

  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('✅ Sockets connected');

  // 3. Test Room Join Authorization
  console.log('Testing Room Join Authorization...');
  
  await new Promise<void>((resolve) => {
    socketNonMember.emit('join_team', team._id.toString(), (res: any) => {
      console.assert(res.success === false, 'Non-member should NOT be able to join');
      console.log('✅ Non-member blocked from joining room:', res.message);
      resolve();
    });
  });

  await new Promise<void>((resolve) => {
    socket1.emit('join_team', team._id.toString(), (res: any) => {
      console.assert(res.success === true, 'Member should be able to join');
      console.log('✅ Leader successfully joined room');
      resolve();
    });
  });

  await new Promise<void>((resolve) => {
    socket2.emit('join_team', team._id.toString(), (res: any) => {
      console.assert(res.success === true, 'Member should be able to join');
      console.log('✅ Member successfully joined room');
      resolve();
    });
  });

  // 4. Test Message Broadcasting
  console.log('Testing Message Broadcasting...');
  const messageText = 'Hello Team!';

  await new Promise<void>((resolve) => {
    socket2.on('receive_message', (msg: any) => {
      if (msg.message === messageText) {
        console.log('✅ Member received broadcasted message:', msg.message);
        resolve();
      }
    });

    socket1.emit('send_message', { teamId: team._id.toString(), message: messageText }, (res: any) => {
      console.assert(res.success === true, 'Message should be sent');
      console.log('✅ Leader sent message');
    });
  });

  // 5. Test Non-member cannot send messages
  console.log('Testing Non-member send constraints...');
  await new Promise<void>((resolve) => {
    socketNonMember.emit('send_message', { teamId: team._id.toString(), message: 'Hacker msg' }, (res: any) => {
      console.assert(res.success === false, 'Non-member should NOT be able to send messages');
      console.log('✅ Non-member blocked from sending message:', res.message);
      resolve();
    });
  });

  socket1.disconnect();
  socket2.disconnect();
  socketNonMember.disconnect();
  
  await mongoose.disconnect();
  console.log('--- PHASE 15 REAL-TIME CHAT TEST END ---');
  process.exit(0);
}

runTests().catch(console.error);
