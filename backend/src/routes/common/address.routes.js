import express from "express";
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from "../../controllers/common/address.controller.js";

import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema
} from "../../middleware/user/address.validation.js"; 

// Reusing your existing global validation middleware
import { validateRequest } from "../../middleware/common/checkout/validate.request.js"; 
import { isValidUser } from "../../middleware/common/auth/auth.middleware.js";
import { trackVisit } from "../../middleware/user/trackVisit.middleware.js";

const router = express.Router();

// --- SECURE ALL ROUTES ---
router.use(isValidUser);

// --- ROUTES ---

router.route("/")
  .get(trackVisit, getUserAddresses)
  .post(validateRequest(createAddressSchema), createAddress);

router.route("/:addressId")
  .patch(validateRequest(updateAddressSchema), updateAddress)
  .delete(validateRequest(addressIdParamSchema), deleteAddress);

router.patch(
  "/:addressId/default", 
  validateRequest(addressIdParamSchema), 
  setDefaultAddress
);

export default router;