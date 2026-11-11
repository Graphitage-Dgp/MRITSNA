import Product from '../../models/product.model.js';

export const inventoryCheck = async (req, res, next) => {
  try {
    const { productId, variantId, quantity } = req.body;

    // Basic Validation
    if (!productId || !variantId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, Variant ID, and quantity are required.'
      });
    }

    // Enforce the business logic limit of 5 per order (supports Family Pack of 4)
    if (quantity <= 0 || quantity > 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity. You can only order between 1 and 5 items.'
      });
    }

    // High-Performance DB Query
    const product = await Product.findOne(
      {
        _id: productId,
        status: 'active',
        'variants._id': variantId
      },
      { 'variants.$': 1, title: 1 } 
    ).lean();

    // Existence Check
    if (!product || !product.variants || product.variants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product variant is unavailable or no longer exists.'
      });
    }

    const variant = product.variants[0];
    const stockAvailable = variant.inventory.quantity;
    const allowBackorder = variant.inventory.allowBackorder;

    // The Gatekeeper Stock Verification
    if (quantity > stockAvailable && !allowBackorder) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${stockAvailable} items remaining.`,
        availableStock: stockAvailable 
      });
    }

    // Calculate the LIVE discounted price
    const basePrice = variant.pricing.price;
    const discount = variant.pricing.discountPercentage || 0;
    const liveFinalPrice = discount > 0 
      ? basePrice - (basePrice * (discount / 100)) 
      : basePrice;

    // Pass data forward
    req.verifiedItem = {
      productId,
      variantId,
      quantity,
      price: liveFinalPrice,
      discountPercentage: discount,
      availableStock: stockAvailable
    };

    next();

  } catch (error) {
    console.error('Inventory Check Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying inventory.'
    });
  }
};