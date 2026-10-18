import { Server, Socket } from 'socket.io';
import { Team } from '../models/Team';
import { TeamMessage } from '../models/TeamMessage';

export const registerChatHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.user?.id;

  // Join Team Room
  socket.on('join_team', async (teamId: string, callback?: (response: any) => void) => {
    try {
      if (!teamId) {
        if (callback) callback({ success: false, message: 'Team ID is required' });
        return;
      }

      // Verify membership
      const team = await Team.findOne({
        _id: teamId,
        $or: [{ leader: userId }, { members: userId }],
      });

      if (!team) {
        if (callback) callback({ success: false, message: 'Unauthorized: Not a team member' });
        return;
      }

      const roomName = `team:${teamId}`;
      
      // Prevent multiple joins
      if (socket.rooms.has(roomName)) {
        if (callback) callback({ success: true, message: 'Already in room' });
        return;
      }

      socket.join(roomName);
      console.log(`👤 User ${userId} joined room ${roomName}`);
      
      if (callback) callback({ success: true });
    } catch (err) {
      console.error(`Error joining team room:`, err);
      if (callback) callback({ success: false, message: 'Internal server error' });
    }
  });

  // Leave Team Room
  socket.on('leave_team', (teamId: string) => {
    if (teamId) {
      const roomName = `team:${teamId}`;
      socket.leave(roomName);
      console.log(`👤 User ${userId} left room ${roomName}`);
    }
  });

  // Send Message
  socket.on('send_message', async (data: { teamId: string; message: string; messageType?: string }, callback?: (response: any) => void) => {
    try {
      const { teamId, message, messageType = 'text' } = data;

      if (!teamId || !message || message.trim() === '') {
        if (callback) callback({ success: false, message: 'Invalid message data' });
        return;
      }
      
      if (message.length > 1000) {
        if (callback) callback({ success: false, message: 'Message too long (max 1000 characters)' });
        return;
      }

      // Verify membership
      const team = await Team.findOne({
        _id: teamId,
        $or: [{ leader: userId }, { members: userId }],
      });

      if (!team) {
        if (callback) callback({ success: false, message: 'Unauthorized: Not a team member' });
        return;
      }
      
      // Verify team status
      if (team.status === 'Closed' || team.status === 'Archived') {
        if (callback) callback({ success: false, message: 'Team is closed/archived' });
        return;
      }

      // Save to database
      const newMessage = new TeamMessage({
        team: teamId,
        sender: userId,
        message: message.trim(),
        messageType,
      });
      await newMessage.save();
      
      await newMessage.populate('sender', 'name email profilePicture');

      // Broadcast to room
      const roomName = `team:${teamId}`;
      io.to(roomName).emit('receive_message', newMessage);

      if (callback) callback({ success: true, data: newMessage });
    } catch (err) {
      console.error(`Error sending message:`, err);
      if (callback) callback({ success: false, message: 'Internal server error' });
    }
  });

  // Typing indicator
  socket.on('typing', async (data: { teamId: string; isTyping: boolean }) => {
    const { teamId, isTyping } = data;
    if (!teamId) return;
    
    // Minimal check, no DB lookup for speed. If they aren't in the room, it won't broadcast to anyone.
    const roomName = `team:${teamId}`;
    if (socket.rooms.has(roomName)) {
      socket.to(roomName).emit('user_typing', {
        userId,
        isTyping,
      });
    }
  });
};
