import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fallbackFilePath = path.join(__dirname, '../../db_fallback.json');

let isMockDB = false;

// Mock database store for the in-memory fallback
let mockStore = {
  users: [],
  messages: [],
  groups: [],
  scheduledMessages: []
};

// Load initial data from JSON if it exists
try {
  if (fs.existsSync(fallbackFilePath)) {
    const rawData = fs.readFileSync(fallbackFilePath, 'utf8');
    mockStore = JSON.parse(rawData);
    console.log('\x1b[36m%s\x1b[0m', '⚡ [NEBULA DB] Loaded persistent fallback data from db_fallback.json.');
  }
} catch (err) {
  console.error('Failed to load local database fallback file:', err);
}

// Function to save mock database state to JSON file
export const saveMockData = () => {
  try {
    fs.writeFileSync(fallbackFilePath, JSON.stringify(mockStore, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist fallback database to file:', err);
  }
};

export const getDbStatus = () => {
  return isMockDB ? 'MEMORY_FALLBACK' : 'MONGO_DB';
};

export const getMockStore = () => mockStore;

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nebulachat';

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000 // fail fast
    });
    console.log('\x1b[32m%s\x1b[0m', '⚡ [NEBULA DB] Connected to quantum MongoDB cluster.');
    isMockDB = false;
  } catch (error) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ [NEBULA DB] MongoDB offline or unreachable. Redirecting to in-memory fallback.');
    console.log('\x1b[33m%s\x1b[0m', '⚡ [NEBULA DB] Activated HYPER-DRIVE Memory Database Cache (persistent).');
    isMockDB = true;
  }
};

export { isMockDB };