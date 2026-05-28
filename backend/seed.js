import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import Mongoose Models (if online)
import MongoUser from './src/models/User.js';
import MongoMessage from './src/models/Message.js';
import MongoGroup from './src/models/Group.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fallbackFilePath = path.join(__dirname, 'db_fallback.json');

const USERS_SEED = [
  {
    username: 'neo_matrix',
    email: 'neo@matrix.net',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nebula1&colors[]=ff5500',
    status: 'Decoupled from matrix node',
    mood: 'cyber',
    energyLevel: 95,
    isOnline: true
  },
  {
    username: 'cyber_ghost',
    email: 'ghost@cyber.net',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Core&colors[]=ffb300',
    status: 'Infiltrating sector 4 firewall',
    mood: 'neon',
    energyLevel: 75,
    isOnline: false
  },
  {
    username: 'amber_daemon',
    email: 'daemon@amber.net',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Matrix&colors[]=10b981',
    status: 'Compiling core kernel loops',
    mood: 'amber',
    energyLevel: 60,
    isOnline: true
  },
  {
    username: 'trinity_core',
    email: 'trinity@core.net',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ghost&colors[]=3b82f6',
    status: 'Operational in Sector 7',
    mood: 'deep',
    energyLevel: 85,
    isOnline: false
  },
  {
    username: 'hacker_ghost',
    email: 'hacker@ghost.net',
    password: 'password123',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cyborg&colors[]=ec4899',
    status: 'Quietly inspecting routing tables',
    mood: 'minimal',
    energyLevel: 45,
    isOnline: true
  }
];

const ROOMS_SEED = [
  { name: 'quantum-lounge', description: 'Public sector networking lobby', isRoom: true, activityIndex: 65 },
  { name: 'cyber-net', description: 'Grid diagnostic broadcasts', isRoom: true, activityIndex: 45 },
  { name: 'ai-dev-hub', description: 'Artificial Intelligence matrix node', isRoom: true, activityIndex: 85 }
];

const runSeed = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nebulachat';
  let isMongoOnline = false;

  console.log('⚡ [NEBULA SEED] Checking database connectivity...');
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 1500 });
    isMongoOnline = true;
    console.log('⚡ [NEBULA SEED] Connected to MongoDB. Seeding MongoDB database...');
  } catch (err) {
    console.log('⚠️ [NEBULA SEED] MongoDB offline. Writing fallback local seed database: db_fallback.json');
  }

  // Hash seed passwords
  const hashedUsers = await Promise.all(
    USERS_SEED.map(async (u) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.password, salt);
      return {
        ...u,
        password: hashedPassword,
        _id: `usr_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    })
  );

  if (isMongoOnline) {
    try {
      // Clear existing records
      await mongoose.connection.db.dropDatabase();
      console.log('⚡ [NEBULA SEED] Wiped existing collections.');

      // Insert Users
      // Convert to mongoose structures
      const dbUsers = [];
      for (let hu of hashedUsers) {
        // delete fake generated id
        const cleanUser = { ...hu };
        delete cleanUser._id;
        const saved = await MongoUser.create(cleanUser);
        dbUsers.push(saved);
      }
      console.log(`⚡ [NEBULA SEED] Created ${dbUsers.length} Users.`);

      // Insert Rooms
      const dbRooms = [];
      for (let r of ROOMS_SEED) {
        const cleanRoom = {
          ...r,
          createdBy: dbUsers[0]._id,
          members: dbUsers.map(u => u._id)
        };
        const saved = await MongoGroup.create(cleanRoom);
        dbRooms.push(saved);
      }
      console.log(`⚡ [NEBULA SEED] Created ${dbRooms.length} Public Rooms.`);

      // Seed mock history messages (to form Dijkstra edges)
      const u0 = dbUsers[0]._id; // neo
      const u1 = dbUsers[1]._id; // ghost
      const u2 = dbUsers[2]._id; // daemon
      const u3 = dbUsers[3]._id; // trinity

      const messagesSeed = [
        { sender: u0, recipient: u1, content: 'Establish line. Are you secure?' },
        { sender: u1, recipient: u0, content: 'Encryption key handshake complete. What is the status?' },
        { sender: u0, recipient: u1, content: 'C++ core algorithms online. Ready to deploy.' },
        
        { sender: u1, recipient: u3, content: 'Firewall breach detected at sector 4.' },
        { sender: u3, recipient: u1, content: 'Rerouting packets through matrix nodes.' },

        { sender: u2, recipient: u0, content: 'Trie search logs prefix trace complete.' },
        { sender: u0, recipient: u2, content: 'Awesome, optimization looks solid.' }
      ];

      for (let m of messagesSeed) {
        await MongoMessage.create(m);
      }
      console.log('⚡ [NEBULA SEED] Historical Direct Message logs written.');

      console.log('\x1b[32m%s\x1b[0m', '⚡ [NEBULA SEED] MongoDB seeding operation completed successfully!');
      process.exit(0);
    } catch (err) {
      console.error('MongoDB seed failure:', err);
      process.exit(1);
    }
  } else {
    // Generate db_fallback.json
    try {
      const u0 = hashedUsers[0];
      const u1 = hashedUsers[1];
      const u2 = hashedUsers[2];
      const u3 = hashedUsers[3];
      const u4 = hashedUsers[4];

      // Groups mock
      const groupsSeed = ROOMS_SEED.map((r, idx) => ({
        _id: `grp_${Math.random().toString(36).substr(2, 9)}`,
        name: r.name,
        description: r.description,
        avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${r.name}&colors[]=ff5500`,
        members: [u0._id, u1._id, u2._id, u3._id, u4._id],
        createdBy: u0._id,
        isRoom: true,
        activityIndex: r.activityIndex,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Messages mock
      const messagesSeed = [
        {
          _id: `msg_${Math.random().toString(36).substr(2, 9)}`,
          sender: u0._id,
          recipient: u1._id,
          content: 'Establish line. Are you secure?',
          huffmanEncoded: '01010101',
          category: 'urgent',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          _id: `msg_${Math.random().toString(36).substr(2, 9)}`,
          sender: u1._id,
          recipient: u0._id,
          content: 'Encryption key handshake complete. What is the status?',
          huffmanEncoded: '11110000',
          category: 'social',
          createdAt: new Date(Date.now() - 3400000).toISOString(),
          updatedAt: new Date(Date.now() - 3400000).toISOString()
        },
        {
          _id: `msg_${Math.random().toString(36).substr(2, 9)}`,
          sender: u0._id,
          recipient: u1._id,
          content: 'C++ core algorithms online. Ready to deploy.',
          huffmanEncoded: '0101010101',
          category: 'work',
          createdAt: new Date(Date.now() - 3200000).toISOString(),
          updatedAt: new Date(Date.now() - 3200000).toISOString()
        },
        {
          _id: `msg_${Math.random().toString(36).substr(2, 9)}`,
          sender: u1._id,
          recipient: u3._id,
          content: 'Firewall breach detected at sector 4.',
          huffmanEncoded: '110011',
          category: 'urgent',
          createdAt: new Date(Date.now() - 2600000).toISOString(),
          updatedAt: new Date(Date.now() - 2600000).toISOString()
        },
        {
          _id: `msg_${Math.random().toString(36).substr(2, 9)}`,
          sender: u3._id,
          recipient: u1._id,
          content: 'Rerouting packets through matrix nodes.',
          huffmanEncoded: '101011',
          category: 'social',
          createdAt: new Date(Date.now() - 2400000).toISOString(),
          updatedAt: new Date(Date.now() - 2400000).toISOString()
        },
        {
          _id: `msg_${Math.random().toString(36).substr(2, 9)}`,
          sender: u2._id,
          recipient: u0._id,
          content: 'Trie search logs prefix trace complete.',
          huffmanEncoded: '000111',
          category: 'work',
          createdAt: new Date(Date.now() - 1600000).toISOString(),
          updatedAt: new Date(Date.now() - 1600000).toISOString()
        },
        {
          _id: `msg_${Math.random().toString(36).substr(2, 9)}`,
          sender: u0._id,
          recipient: u2._id,
          content: 'Awesome, optimization looks solid.',
          huffmanEncoded: '111111',
          category: 'social',
          createdAt: new Date(Date.now() - 1400000).toISOString(),
          updatedAt: new Date(Date.now() - 1400000).toISOString()
        }
      ];

      const seedData = {
        users: hashedUsers,
        messages: messagesSeed,
        groups: groupsSeed,
        scheduledMessages: []
      };

      fs.writeFileSync(fallbackFilePath, JSON.stringify(seedData, null, 2), 'utf8');
      console.log('\x1b[32m%s\x1b[0m', '⚡ [NEBULA SEED] Fallback db_fallback.json created and seeded successfully!');
      process.exit(0);
    } catch (err) {
      console.error('Fallback seed file generation failure:', err);
      process.exit(1);
    }
  }
};

runSeed();
