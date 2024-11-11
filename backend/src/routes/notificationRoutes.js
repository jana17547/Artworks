import express from 'express';
import {
  createNotification,
  updateNotification,
  deleteNotification,
  getUnreadNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

router.post('/', createNotification);
router.patch('/:id', updateNotification);
router.delete('/:id', deleteNotification);
router.get('/unread/:userId', getUnreadNotifications);
export default router;
