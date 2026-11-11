import express from 'express';
import { detectUserRegion } from '../../controllers/common/region.controller.js';
import { regionMiddleware } from '../../middleware/common/regionMiddleware.js';
import { trackVisit } from '../../middleware/user/trackVisit.middleware.js';

const router = express.Router();
router.use(trackVisit);

router.get('/detect', regionMiddleware, detectUserRegion);

export default router;