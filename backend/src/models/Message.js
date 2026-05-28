import mongoose from 'mongoose';
import { isMockDB, getMockStore, saveMockData } from '../config/db.js';

// MongoDB Schema
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  content: { type: String, required: true },
  huffmanEncoded: { type: String, default: '' },
  category: { type: String, default: 'social' }, // social, work, urgent, system, media
  edited: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }],
  mediaUrl: { type: String, default: '' },
  mediaType: { type: String, default: '' }, // image, voice, document
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const MongoMessage = mongoose.model('Message', messageSchema);

// --- Mock implementation ---
class MockMessageInstance {
  constructor(data) {
    Object.assign(this, {
      _id: data._id || `msg_${Math.random().toString(36).substr(2, 9)}`,
      sender: data.sender,
      recipient: data.recipient || null,
      group: data.group || null,
      content: data.content,
      huffmanEncoded: data.huffmanEncoded || '',
      category: data.category || 'social',
      edited: data.edited || false,
      deleted: data.deleted || false,
      reactions: data.reactions || [],
      mediaUrl: data.mediaUrl || '',
      mediaType: data.mediaType || '',
      readBy: data.readBy || [],
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date()
    });
  }

  async save() {
    const store = getMockStore();
    const index = store.messages.findIndex(m => m._id === this._id);
    this.updatedAt = new Date();
    if (index !== -1) {
      store.messages[index] = this;
    } else {
      store.messages.push(this);
    }
    saveMockData();
    return this;
  }
}

const MockMessage = {
  create: async (data) => {
    const msg = new MockMessageInstance(data);
    await msg.save();
    return msg;
  },

  find: async (query = {}) => {
    const store = getMockStore();
    let results = store.messages;

    if (Object.keys(query).length > 0) {
      results = results.filter(m => {
        // Simple query matching
        for (let key in query) {
          if (query[key] !== undefined) {
            // Support $or
            if (key === '$or') {
              const matchesOr = query['$or'].some(subQuery => {
                for (let subKey in subQuery) {
                  if (m[subKey] !== subQuery[subKey]) return false;
                }
                return true;
              });
              if (!matchesOr) return false;
              continue;
            }
            if (m[key] !== query[key]) return false;
          }
        }
        return true;
      });
    }

    return results.map(m => new MockMessageInstance(m));
  },

  findById: async (id) => {
    const store = getMockStore();
    const msg = store.messages.find(m => m._id === id);
    return msg ? new MockMessageInstance(msg) : null;
  },

  findByIdAndUpdate: async (id, update) => {
    const store = getMockStore();
    const msgIndex = store.messages.findIndex(m => m._id === id);
    if (msgIndex !== -1) {
      const msg = store.messages[msgIndex];
      const setFields = update.$set || update;
      Object.assign(msg, setFields);
      msg.updatedAt = new Date();
      saveMockData();
      return new MockMessageInstance(msg);
    }
    return null;
  }
};

export default {
  create: (...args) => isMockDB ? MockMessage.create(...args) : MongoMessage.create(...args),
  find: (...args) => isMockDB ? MockMessage.find(...args) : MongoMessage.find(...args),
  findById: (...args) => isMockDB ? MockMessage.findById(...args) : MongoMessage.findById(...args),
  findByIdAndUpdate: (...args) => isMockDB ? MockMessage.findByIdAndUpdate(...args) : MongoMessage.findByIdAndUpdate(...args)
};
export { MockMessageInstance };
