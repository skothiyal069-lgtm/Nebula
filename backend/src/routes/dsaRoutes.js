import express from 'express';
import { 
  getTrieVisual, 
  getHuffmanVisual, 
  getEditDistanceVisual, 
  getSmartReplies, 
  getNetworkVisual, 
  getSchedulerVisual 
} from '../controllers/dsaController.js';

const router = express.Router();

router.get('/trie', getTrieVisual);
router.post('/huffman', getHuffmanVisual);
router.post('/edit-distance', getEditDistanceVisual);
router.post('/smart-replies', getSmartReplies);
router.get('/network', getNetworkVisual);
router.get('/scheduler', getSchedulerVisual);

export default router;
