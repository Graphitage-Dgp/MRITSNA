import express from 'express';
import { 
  getNewArrivals, 
  getHomepagePicks,
  getPaginatedProducts,
  getSingleProduct,
  getFilterOptions,
  searchProducts
} from '../../controllers/common/product.controller.js';

import { regionMiddleware } from '../../middleware/common/regionMiddleware.js';
import { trackVisit } from '../../middleware/user/trackVisit.middleware.js';

const router = express.Router();

router.use(trackVisit);

router.get('/new-arrivals', regionMiddleware, getNewArrivals);

router.get('/homepage-picks', regionMiddleware, getHomepagePicks);

router.get('/search', regionMiddleware, searchProducts);

router.get('/filter-options', getFilterOptions);

router.get('/', regionMiddleware, getPaginatedProducts);

router.get('/:slug', regionMiddleware, getSingleProduct);

export default router;