import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Config & Services
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { schedulerService } from './algorithms/schedulerService.js';
import { isCxxEnabled } from './services/cppEngine.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import dsaRoutes from './routes/dsaRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize DB Connection (tries Mongo, falls back to memory db)
await connectDB();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload folder exists and serve it statically
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dsa', dsaRoutes);

// Base Status Route
app.get('/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: 'Nebula Chat Quantum Communication Protocol',
    engine: isCxxEnabled() ? 'Native C++ Engine' : 'JavaScript Engine Fallback',
    timestamp: new Date()
  });
});

// Init socket.io server
const io = initSocket(server);

// Init scheduler service (loads delayed messages into heap priority queue)
schedulerService.init(io);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log('\x1b[35m%s\x1b[0m', '==================================================');
  console.log('\x1b[36m%s\x1b[0m', `🚀 [NEBULA SERVER] Online at sectoral port ${PORT}`);
  console.log('\x1b[32m%s\x1b[0m', `⚙️  [DSA CORE] C++ Acceleration: ${isCxxEnabled() ? 'ENABLED' : 'DISABLED (JS Fallback active)'}`);
  console.log('\x1b[35m%s\x1b[0m', '==================================================');
});
