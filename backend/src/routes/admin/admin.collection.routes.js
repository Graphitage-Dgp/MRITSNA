import express from 'express';
import {
  createCollection,
  updateCollection,
  changeCollectionStatus,
  getAdminCollections,
  getAdminCollectionById,
  deleteCollection,
  deleteCollectionImage
} from '../../controllers/admin/admin.collection.controller.js';
import {
  validateRequest,
  createCollectionSchema,
  updateCollectionSchema
} from '../../middleware/admin/collection.validation.js';

// Import the admin authorization middleware
import { isAdmin } from "../../middleware/common/auth/auth.middleware.js";

const router = express.Router();

// Apply authorization to ALL routes in this file
router.use(isAdmin); 

// ==========================================
// Standalone Media Routes
// (MUST be placed before /:id routes to prevent parameter hijacking)
// ==========================================

// DELETE /api/admin/collections/image/:fileId
// Purpose: Instantly delete an orphaned image from ImageKit
router.delete('/image/:fileId', deleteCollectionImage);

// ==========================================
// Core Collection Routes
// ==========================================

// GET /api/admin/collections
// Purpose: Fetch all collections (optimized for the admin dashboard data table)
router.get('/', getAdminCollections);

// POST /api/admin/collections
// Purpose: Create a new collection (Guarded by strict Zod schema)
router.post(
  '/', 
  validateRequest(createCollectionSchema), 
  createCollection
);

// GET /api/admin/collections/:id
// Purpose: Fetch a single collection with deeply populated product references for the edit form
router.get('/:id', getAdminCollectionById);

// PATCH /api/admin/collections/:id
// Purpose: Update an existing collection (Guarded by partial Zod schema, auto-cleans orphaned images)
router.patch(
  '/:id', 
  validateRequest(updateCollectionSchema), 
  updateCollection
);

// PATCH /api/admin/collections/:id/status
// Purpose: Quick toggle to change visibility status (active, draft, archived) without a full payload
router.patch('/:id/status', changeCollectionStatus);

// DELETE /api/admin/collections/:id
// Purpose: Permanently delete a collection AND automatically purge its associated images from ImageKit
router.delete('/:id', deleteCollection);

export default router;