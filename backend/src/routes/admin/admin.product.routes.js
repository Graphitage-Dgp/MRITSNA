import express from 'express';
import {
  createProduct,
  updateProduct,
  changeProductStatus,
  getAdminProducts,
  getAdminProductById,
  getImageKitAuth,
  deleteProductImage,
  getInventoryList,
  updateVariantStock
} from '../../controllers/admin/admin.product.controller.js';
import { 
  validateRequest, 
  createProductSchema, 
  updateProductSchema 
} from '../../middleware/admin/product.validation.js';

import { isAdmin } from "../../middleware/common/auth/auth.middleware.js";

const router = express.Router();

router.use(isAdmin); // All routes below require authentication

// --- Inventory Management Routes ---
router.get('/inventory', getInventoryList);
router.patch('/inventory/stock', updateVariantStock);

// --- Product Management Routes ---

// Fetch all products for the dashboard table
router.get('/', getAdminProducts);

// Create a new product
router.post('/', validateRequest(createProductSchema), createProduct);

// Fetch signature for secure frontend direct-upload
router.get('/imagekit-auth', getImageKitAuth);

// Delete a specific image from the cloud
router.delete('/image/:fileId', deleteProductImage);

// Fetch a single product to populate the Edit Form
router.get('/:id', getAdminProductById);

// Update an existing product
router.patch('/:id', validateRequest(updateProductSchema), updateProduct);

// Update only the status (Active, Draft, Archived)
router.patch('/:id/status', changeProductStatus);

export default router;