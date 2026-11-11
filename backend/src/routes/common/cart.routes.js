import express from 'express';
import { 
  checkStock, 
  getCart, 
  addToCart, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearCart, 
  syncCart,
  hydrateGuestCart
} from '../../controllers/common/cart.controller.js';

import { inventoryCheck } from '../../middleware/common/inventoryCheck.js';
import { isValidUser, optionalAuth } from '../../middleware/common/auth/auth.middleware.js'; 
import { regionMiddleware } from '../../middleware/common/regionMiddleware.js';
import { trackVisit } from '../../middleware/user/trackVisit.middleware.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.post('/check-stock', checkStock);

// <-- The Guest Hydration & Real-Time DB Sync Route -->
// Uses optionalAuth + trackVisit + regionMiddleware so every guest localStorage state is persisted by device_id
router.post('/hydrate', optionalAuth, trackVisit, regionMiddleware, hydrateGuestCart);

// ==========================================
// PROTECTED ROUTES
// ==========================================
router.get('/', trackVisit, isValidUser, regionMiddleware, getCart);

router.post('/sync', isValidUser, regionMiddleware, syncCart);
router.post('/add', isValidUser, inventoryCheck, addToCart);
router.put('/update', isValidUser, inventoryCheck, updateCartItemQuantity);
router.delete('/remove/:variantId', isValidUser, removeFromCart);
router.delete('/clear', isValidUser, clearCart);

export default router;
