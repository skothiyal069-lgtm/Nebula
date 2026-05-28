import mongoose from 'mongoose';
import { isMockDB, getMockStore, saveMockData } from '../config/db.js';

// MongoDB Schema
const scheduledMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipientName: { type: String, default: '' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  content: { type: String, required: true },
  sendAt: { type: Date, required: true },
  isSent: { type: Boolean, default: false }
}, { timestamps: true });

const MongoScheduledMessage = mongoose.model('ScheduledMessage', scheduledMessageSchema);

// --- Mock implementation ---
class MockScheduledMessageInstance {
  constructor(data) {
    Object.assign(this, {
      _id: data._id || `sch_${Math.random().toString(36).substr(2, 9)}`,
      sender: data.sender,
      recipient: data.recipient || null,
      recipientName: data.recipientName || '',
      group: data.group || null,
      content: data.content,
      sendAt: data.sendAt,
      isSent: data.isSent || false,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date()
    });
  }

  async save() {
    const store = getMockStore();
    const index = store.scheduledMessages.findIndex(s => s._id === this._id);
    this.updatedAt = new Date();
    if (index !== -1) {
      store.scheduledMessages[index] = this;
    } else {
      store.scheduledMessages.push(this);
    }
    saveMockData();
    return this;
  }
}

const MockScheduledMessage = {
  create: async (data) => {
    const sch = new MockScheduledMessageInstance(data);
    await sch.save();
    return sch;
  },

  find: async (query = {}) => {
    const store = getMockStore();
    let results = store.scheduledMessages;

    if (Object.keys(query).length > 0) {
      results = results.filter(s => {
        for (let key in query) {
          if (query[key] !== undefined) {
            if (s[key] !== query[key]) return false;
          }
        }
        return true;
      });
    }

    return results.map(s => new MockScheduledMessageInstance(s));
  },

  findById: async (id) => {
    const store = getMockStore();
    const sch = store.scheduledMessages.find(s => s._id === id);
    return sch ? new MockScheduledMessageInstance(sch) : null;
  },

  findByIdAndDelete: async (id) => {
    const store = getMockStore();
    const index = store.scheduledMessages.findIndex(s => s._id === id);
    if (index !== -1) {
      const deleted = store.scheduledMessages.splice(index, 1)[0];
      saveMockData();
      return new MockScheduledMessageInstance(deleted);
    }
    return null;
  },

  findByIdAndUpdate: async (id, update) => {
    const store = getMockStore();
    const index = store.scheduledMessages.findIndex(s => s._id === id);
    if (index !== -1) {
      const sch = store.scheduledMessages[index];
      const setFields = update.$set || update;
      Object.assign(sch, setFields);
      sch.updatedAt = new Date();
      saveMockData();
      return new MockScheduledMessageInstance(sch);
    }
    return null;
  }
};

export default {
  create: (...args) => isMockDB ? MockScheduledMessage.create(...args) : MongoScheduledMessage.create(...args),
  find: (...args) => isMockDB ? MockScheduledMessage.find(...args) : MongoScheduledMessage.find(...args),
  findById: (...args) => isMockDB ? MockScheduledMessage.findById(...args) : MongoScheduledMessage.findById(...args),
  findByIdAndDelete: (...args) => isMockDB ? MockScheduledMessage.findByIdAndDelete(...args) : MongoScheduledMessage.findByIdAndDelete(...args),
  findByIdAndUpdate: (...args) => isMockDB ? MockScheduledMessage.findByIdAndUpdate(...args) : MongoScheduledMessage.findByIdAndUpdate(...args)
};
export { MockScheduledMessageInstance };
