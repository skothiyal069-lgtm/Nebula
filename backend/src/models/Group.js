import mongoose from 'mongoose';
import { isMockDB, getMockStore, saveMockData } from '../config/db.js';

// MongoDB Schema
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  avatar: { type: String, default: '' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isRoom: { type: Boolean, default: false }, // true for public rooms
  activityIndex: { type: Number, default: 0 } // Live activity metric (0-100)
}, { timestamps: true });

const MongoGroup = mongoose.model('Group', groupSchema);

// --- Mock implementation ---
class MockGroupInstance {
  constructor(data) {
    Object.assign(this, {
      _id: data._id || `grp_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description || '',
      avatar: data.avatar || '',
      members: data.members || [],
      createdBy: data.createdBy,
      isRoom: data.isRoom || false,
      activityIndex: data.activityIndex || 0,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date()
    });
  }

  async save() {
    const store = getMockStore();
    const index = store.groups.findIndex(g => g._id === this._id);
    this.updatedAt = new Date();
    if (index !== -1) {
      store.groups[index] = this;
    } else {
      store.groups.push(this);
    }
    saveMockData();
    return this;
  }
}

const MockGroup = {
  create: async (data) => {
    const grp = new MockGroupInstance(data);
    await grp.save();
    return grp;
  },

  find: async (query = {}) => {
    const store = getMockStore();
    let results = store.groups;

    if (Object.keys(query).length > 0) {
      results = results.filter(g => {
        for (let key in query) {
          if (query[key] !== undefined) {
            // Support searching elements in members array
            if (key === 'members') {
              return g.members.includes(query[key]);
            }
            if (g[key] !== query[key]) return false;
          }
        }
        return true;
      });
    }

    return results.map(g => new MockGroupInstance(g));
  },

  findById: async (id) => {
    const store = getMockStore();
    const grp = store.groups.find(g => g._id === id);
    return grp ? new MockGroupInstance(grp) : null;
  },

  findByIdAndUpdate: async (id, update) => {
    const store = getMockStore();
    const grpIndex = store.groups.findIndex(g => g._id === id);
    if (grpIndex !== -1) {
      const grp = store.groups[grpIndex];
      const setFields = update.$set || update;
      Object.assign(grp, setFields);
      grp.updatedAt = new Date();
      saveMockData();
      return new MockGroupInstance(grp);
    }
    return null;
  }
};

export default {
  create: (...args) => isMockDB ? MockGroup.create(...args) : MongoGroup.create(...args),
  find: (...args) => isMockDB ? MockGroup.find(...args) : MongoGroup.find(...args),
  findById: (...args) => isMockDB ? MockGroup.findById(...args) : MongoGroup.findById(...args),
  findByIdAndUpdate: (...args) => isMockDB ? MockGroup.findByIdAndUpdate(...args) : MongoGroup.findByIdAndUpdate(...args)
};
export { MockGroupInstance };
