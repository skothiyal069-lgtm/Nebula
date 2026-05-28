import { PriorityQueue } from './priorityQueue.js';
import Message from '../models/Message.js';
import ScheduledMessage from '../models/ScheduledMessage.js';

class SchedulerService {
  constructor() {
    this.queue = new PriorityQueue();
    this.io = null;
    this.timer = null;
  }

  init(io) {
    this.io = io;
    this.loadUnsentMessages();
    this.startTicker();
  }

  setSocketIo(io) {
    this.io = io;
  }

  // Load unsent scheduled messages from storage on startup
  async loadUnsentMessages() {
    try {
      const unsent = await ScheduledMessage.find({ isSent: false });
      unsent.forEach(msg => {
        this.queue.insert(msg);
      });
      console.log(`⚡ [NEBULA SCHEDULER] Loaded ${unsent.length} scheduled message transmissions into Min-Heap.`);
    } catch (err) {
      console.error('Failed to load scheduled messages into heap:', err);
    }
  }

  schedule(msg) {
    this.queue.insert(msg);
    console.log(`⚡ [NEBULA SCHEDULER] Added message to heap. Next execution: ${new Date(msg.sendAt).toLocaleTimeString()}`);
  }

  // If a scheduled message is deleted, we can rebuild the heap
  // or mark the element as ignored when extracted. Let's rebuild the heap.
  async unschedule(id) {
    try {
      const allActive = await ScheduledMessage.find({ isSent: false });
      this.queue = new PriorityQueue();
      allActive.forEach(msg => {
        this.queue.insert(msg);
      });
      console.log(`⚡ [NEBULA SCHEDULER] Rebuilt Min-Heap. Queue size: ${this.queue.size()}`);
    } catch (err) {
      console.error('Failed to unschedule message:', err);
    }
  }

  startTicker() {
    if (this.timer) clearInterval(this.timer);
    
    // Tick every 3 seconds
    this.timer = setInterval(() => {
      this.processHeap();
    }, 3000);
  }

  async processHeap() {
    const now = new Date();
    
    while (!this.queue.isEmpty()) {
      const top = this.queue.peek();
      if (!top) break;

      const triggerTime = new Date(top.sendAt);
      
      // If trigger time is in the future, stop (since it's a min-heap, all others are further in future)
      if (triggerTime > now) {
        break;
      }

      // Extract the top message (earliest trigger time)
      const msg = this.queue.extractMin();
      if (!msg) break;

      try {
        // Double check in database that it wasn't deleted
        const dbMsg = await ScheduledMessage.findById(msg._id);
        if (!dbMsg || dbMsg.isSent) continue;

        // Create the actual live message
        const liveMsg = await Message.create({
          sender: msg.sender,
          recipient: msg.recipient,
          content: msg.content,
          category: 'social'
        });

        // Mark scheduled message as sent
        await ScheduledMessage.findByIdAndUpdate(msg._id, { isSent: true });

        console.log(`⚡ [NEBULA SCHEDULER] Executed transmission code: ${msg._id}`);

        // Broadcast via Socket.IO
        if (this.io) {
          // If sending to user, emit to their private socket or globally
          this.io.emit('receive_message', {
            ...liveMsg._doc,
            sender: liveMsg.sender,
            createdAt: liveMsg.createdAt
          });
        }
      } catch (err) {
        console.error(`Failed to process heap transmission ${msg._id}:`, err);
      }
    }
  }

  getQueueState() {
    return this.queue.getVisualizationData();
  }
}

export const schedulerService = new SchedulerService();
