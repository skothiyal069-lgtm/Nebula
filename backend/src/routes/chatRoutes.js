import express from 'express';
import { 
  getUsers, 
  getChats, 
  getMessages, 
  sendMessage, 
  createGroup, 
  createRoom, 
  scheduleMessage,
  getScheduledMessages,
  deleteScheduledMessage,
  uploadChatFile
} from '../controllers/chatController.js';

import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();


router.get('/users', protect, getUsers);
router.get('/chats', protect, getChats);
router.get('/messages', protect, getMessages);
router.post('/send', protect, sendMessage);
router.post('/upload', protect, upload.single('file'), uploadChatFile);
router.post('/group', protect, createGroup);
router.post('/room', protect, createRoom);
router.post('/schedule', protect, scheduleMessage);
router.get('/scheduled', protect, getScheduledMessages);
router.delete('/scheduled/:id', protect, deleteScheduledMessage);

export default router;
