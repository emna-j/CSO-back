import express from 'express';
import {
  createSubgroup,
  getSubgroups,
  getSubgroupById,
  updateSubgroup,
  deleteSubgroup,
  addMembers,
  removeMember,
  sendSubgroupAnnouncement
} from '../../controllers/admin/subgroupController.js';
import { loggedMiddleware } from '../../middlewares/authMiddlewares.js';
import { isManagerOrAdmin } from '../../middlewares/roleMiddlewares.js';

const router = express.Router();

// All routes are protected and require manager or admin role
router.use(loggedMiddleware, isManagerOrAdmin);

router.post('/', createSubgroup);
router.get('/', getSubgroups);
router.get('/:id', getSubgroupById);
router.put('/:id', updateSubgroup);
router.delete('/:id', deleteSubgroup);

router.post('/:id/members', addMembers);
router.post('/:id/members/remove', removeMember);
router.post('/:id/announce', sendSubgroupAnnouncement);

export default router;
