import User from '../models/User.js';
import Message from '../models/Message.js';
import Group from '../models/Group.js';
import ScheduledMessage from '../models/ScheduledMessage.js';
import { HuffmanCoding } from '../algorithms/huffman.js';
import { schedulerService } from '../algorithms/schedulerService.js';

// Simple text categorization logic (smart categorizer)
const categorizeMessage = (text) => {
  const lowercase = text.toLowerCase();
  const workKeywords = ['meeting', 'deadline', 'task', 'project', 'client', 'report', 'code', 'bug', 'jira', 'zoom', 'office', 'schedule'];
  const urgentKeywords = ['urgent', 'asap', 'alert', 'critical', 'emergency', 'important', 'immediately'];
  const mediaKeywords = ['http', '.png', '.jpg', '.mp4', '.pdf', 'attach', 'link', 'upload'];
  
  if (urgentKeywords.some(kw => lowercase.includes(kw))) return 'urgent';
  if (workKeywords.some(kw => lowercase.includes(kw))) return 'work';
  if (mediaKeywords.some(kw => lowercase.includes(kw))) return 'media';
  return 'social';
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
};

export const getChats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get public rooms
    const publicRooms = await Group.find({ isRoom: true });

    // Get private groups where user is a member
    const privateGroups = await Group.find({ isRoom: false, members: userId });

    // Find all messages for this user (both sender and recipient)
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    });

    // Extract unique contact IDs
    const contactIds = new Set();
    messages.forEach(msg => {
      if (msg.sender && msg.sender.toString() !== userId.toString()) {
        contactIds.add(msg.sender.toString());
      }
      if (msg.recipient && msg.recipient.toString() !== userId.toString()) {
        contactIds.add(msg.recipient.toString());
      }
    });

    // Batch load all contacts at once instead of N+1 queries
    const contacts = await User.find({ _id: { $in: Array.from(contactIds) } });
    const contactMap = new Map(contacts.map(c => [c._id.toString(), c]));

    // Build direct contacts with last message
    const directContacts = Array.from(contactIds).map(cId => {
      const contact = contactMap.get(cId);
      if (!contact) return null;

      // Find last message with this contact
      const lastMsg = messages
        .filter(m => 
          (m.sender.toString() === userId.toString() && m.recipient?.toString() === cId) ||
          (m.sender.toString() === cId && m.recipient?.toString() === userId.toString())
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      return {
        _id: contact._id,
        username: contact.username,
        avatar: contact.avatar,
        status: contact.status,
        isOnline: contact.isOnline,
        lastSeen: contact.lastSeen,
        energyLevel: contact.energyLevel,
        mood: contact.mood,
        lastMessage: lastMsg ? {
          content: lastMsg.deleted ? 'Message was deleted' : lastMsg.content,
          createdAt: lastMsg.createdAt,
          sender: lastMsg.sender
        } : null
      };
    }).filter(Boolean);

    res.json({
      success: true,
      data: {
        rooms: publicRooms,
        groups: privateGroups,
        direct: directContacts
      }
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load conversations' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { partnerId, groupId } = req.query;

    let query = {};
    if (groupId) {
      query = { group: groupId };
    } else if (partnerId) {
      query = {
        $or: [
          { sender: userId, recipient: partnerId },
          { sender: partnerId, recipient: userId }
        ]
      };
    } else {
      return res.status(400).json({ success: false, message: 'partnerId or groupId required' });
    }

    const messages = await Message.find(query);

    // Collect unique sender IDs
    const senderIds = new Set(messages.map(m => m.sender.toString()));
    const sendersArray = Array.from(senderIds);

    // Batch load all senders at once instead of N+1 queries
    const senders = await User.find({ _id: { $in: sendersArray } });
    const senderMap = new Map(senders.map(s => [s._id.toString(), s]));

    // Enrich messages with sender info
    const populated = messages.map(m => {
      const senderInfo = senderMap.get(m.sender.toString());
      return {
        ...m.toObject?.() || m,
        senderName: senderInfo ? senderInfo.username : 'Unknown',
        senderAvatar: senderInfo ? senderInfo.avatar : ''
      };
    });

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const sender = req.user._id;
    const { recipient, group, content, mediaUrl, mediaType } = req.body;

    // Apply Huffman Coding compression to trace it
    const huffman = new HuffmanCoding();
    const huffmanEncoded = huffman.encode(content);

    // Smart categorization
    const category = categorizeMessage(content);

    const messageData = {
      sender,
      content,
      huffmanEncoded,
      category,
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || ''
    };

    if (group) messageData.group = group;
    if (recipient) messageData.recipient = recipient;

    const message = await Message.create(messageData);

    // If it's a room, update activity index
    if (group) {
      const g = await Group.findById(group);
      if (g) {
        const currentActivity = g.activityIndex || 0;
        await Group.findByIdAndUpdate(group, {
          activityIndex: Math.min(100, currentActivity + 5)
        });
      }
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to deliver message' });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const creator = req.user._id;

    const groupMembers = members ? [...members] : [];
    if (!groupMembers.includes(creator.toString())) {
      groupMembers.push(creator.toString());
    }

    const group = await Group.create({
      name,
      description,
      members: groupMembers,
      createdBy: creator,
      isRoom: false
    });

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Failed to create group' });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { name, description } = req.body;
    const creator = req.user._id;

    const room = await Group.create({
      name,
      description,
      createdBy: creator,
      isRoom: true,
      activityIndex: 30 // Seeded starting activity
    });

    res.status(201).json({ success: true, data: room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ success: false, message: 'Failed to establish virtual room' });
  }
};

export const scheduleMessage = async (req, res) => {
  try {
    const sender = req.user._id;
    const { recipient, recipientName, content, sendAt } = req.body;

    if (!content || !sendAt) {
      return res.status(400).json({ success: false, message: 'Content and schedule timestamp required' });
    }

    const scheduled = await ScheduledMessage.create({
      sender,
      recipient,
      recipientName: recipientName || 'User',
      content,
      sendAt: new Date(sendAt)
    });

    // Load into Priority Queue heap scheduler
    schedulerService.schedule(scheduled);

    res.status(201).json({ success: true, data: scheduled });
  } catch (error) {
    console.error('Schedule message error:', error);
    res.status(500).json({ success: false, message: 'Failed to register scheduled transmission' });
  }
};

export const getScheduledMessages = async (req, res) => {
  try {
    const list = await ScheduledMessage.find({ sender: req.user._id, isSent: false });
    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Get scheduled messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to load transmission queues' });
  }
};

export const uploadChatFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Determine media type from extension
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    let mediaType = 'file';
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) mediaType = 'image';
    else if (['mp4', 'webm', 'ogg'].includes(ext)) mediaType = 'video';
    else if (['wav', 'mp3', 'ogg'].includes(ext)) mediaType = 'voice';
    else if (['pdf', 'txt', 'zip'].includes(ext)) mediaType = 'document';

    // multer stores file under /backend/uploads; index.js exposes it via /uploads
    const url = `/uploads/${file.filename}`;

    res.status(201).json({ success: true, data: { url, mediaType } });
  } catch (error) {
    console.error('Upload chat file error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
};

export const deleteScheduledMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ScheduledMessage.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Transmission code not found' });
    }
    
    // Remove from scheduler service internal heap
    schedulerService.unschedule(id);
    
    res.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Delete scheduled message error:', error);
    res.status(500).json({ success: false, message: 'Failed to terminate transmission link' });
  }
};

