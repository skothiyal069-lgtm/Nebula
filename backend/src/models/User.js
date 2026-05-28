import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { isMockDB, getMockStore, saveMockData } from '../config/db.js';

// MongoDB Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  status: { type: String, default: 'Online in the Net' },
  mood: { type: String, default: 'cyber' }, // cyber, neon, amber, deep, minimal
  energyLevel: { type: Number, default: 80 }, // 0 to 100
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before saving to MongoDB
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const MongoUser = mongoose.model('User', userSchema);

// --- In-Memory Mock Database Fallback Implementation ---
class MockUserInstance {
  constructor(data) {
    Object.assign(this, {
      _id: data._id || `usr_${Math.random().toString(36).substr(2, 9)}`,
      username: data.username,
      email: data.email,
      password: data.password,
      avatar: data.avatar || '',
      status: data.status || 'Online in the Net',
      mood: data.mood || 'cyber',
      energyLevel: data.energyLevel || 80,
      isOnline: data.isOnline || false,
      lastSeen: data.lastSeen || new Date(),
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date()
    });
  }

  async save() {
    const store = getMockStore();
    const index = store.users.findIndex(u => u._id === this._id);
    this.updatedAt = new Date();
    
    // Hash password if it isn't hashed (doesn't look like bcrypt hash which is 60 chars)
    if (this.password && this.password.length < 30) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    if (index !== -1) {
      store.users[index] = this;
    } else {
      store.users.push(this);
    }
    saveMockData();
    return this;
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
}

const MockUser = {
  create: async (data) => {
    const user = new MockUserInstance(data);
    await user.save();
    return user;
  },

  findOne: async (query) => {
    const store = getMockStore();
    let user;
    
    // Handle $or operator
    if (query.$or && Array.isArray(query.$or)) {
      user = store.users.find(u => {
        return query.$or.some(condition => {
          for (let key in condition) {
            if (u[key] === condition[key]) return true;
          }
          return false;
        });
      });
    } else {
      // Regular query matching
      user = store.users.find(u => {
        for (let key in query) {
          if (u[key] !== query[key]) return false;
        }
        return true;
      });
    }
    
    return user ? new MockUserInstance(user) : null;
  },

  findById: async (id) => {
    const store = getMockStore();
    const user = store.users.find(u => u._id === id);
    return user ? new MockUserInstance(user) : null;
  },

  find: async (query = {}) => {
    const store = getMockStore();
    let results = store.users;
    
    if (Object.keys(query).length > 0) {
      // Handle $ne (not equal) operator
      if (query._id && query._id.$ne) {
        results = results.filter(u => u._id !== query._id.$ne);
      } else {
        results = results.filter(u => {
          for (let key in query) {
            if (key.startsWith('$')) continue;
            if (query[key] !== undefined && u[key] !== query[key]) return false;
          }
          return true;
        });
      }
    }
    return results.map(u => new MockUserInstance(u));
  },

  updateOne: async (query, update) => {
    const store = getMockStore();
    const user = store.users.find(u => {
      for (let key in query) {
        if (u[key] !== query[key]) return false;
      }
      return true;
    });

    if (user) {
      const setFields = update.$set || update;
      Object.assign(user, setFields);
      user.updatedAt = new Date();
      saveMockData();
      return { nModified: 1 };
    }
    return { nModified: 0 };
  },

  findByIdAndUpdate: async (id, update, options = {}) => {
    const store = getMockStore();
    const userIndex = store.users.findIndex(u => u._id === id);
    if (userIndex !== -1) {
      const user = store.users[userIndex];
      const setFields = update.$set || update;
      Object.assign(user, setFields);
      user.updatedAt = new Date();
      saveMockData();
      return new MockUserInstance(user);
    }
    return null;
  }
};

// Export active implementation based on fallback state
export default {
  create: (...args) => isMockDB ? MockUser.create(...args) : MongoUser.create(...args),
  findOne: (...args) => isMockDB ? MockUser.findOne(...args) : MongoUser.findOne(...args),
  findById: (...args) => isMockDB ? MockUser.findById(...args) : MongoUser.findById(...args),
  find: (...args) => isMockDB ? MockUser.find(...args) : MongoUser.find(...args),
  updateOne: (...args) => isMockDB ? MockUser.updateOne(...args) : MongoUser.updateOne(...args),
  findByIdAndUpdate: (...args) => isMockDB ? MockUser.findByIdAndUpdate(...args) : MongoUser.findByIdAndUpdate(...args),
  _getImplementation: () => isMockDB ? 'MockUser' : 'MongoUser'
};
export { MockUserInstance }; // Export instances helper
