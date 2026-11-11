import mongoose from 'mongoose';
import Cart from '../../models/cart.model.js';
import Product from '../../models/product.model.js';
import User from '../../models/user.model.js';
import {
  calculateRegionalPricing,
  isDrinkwareCategory,
  calculateDrinkwareBundleTotal,
} from '../../utils/pricingEngine.js';

// ==========================================
// LIGHTWEIGHT INVENTORY PING
// ==========================================
export const checkStock = async (req, res, next) => {
  try {
    const { productId, variantId, requestedQuantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({ success: false, message: 'Invalid Product or Variant ID format.' });
    }

    const product = await Product.findOne(
      { _id: productId, status: 'active', 'variants._id': variantId },
      { 'variants.$': 1 }
    ).lean();

    if (!product || !product.variants.length) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    const variant = product.variants[0];
    const physicalStock = variant.inventory.quantity;
    const isAvailable = requestedQuantity <= physicalStock || variant.inventory.allowBackorder;

    const effectiveStock = variant.inventory.allowBackorder ? 5 : physicalStock;

    return res.status(200).json({
      success: true,
      data: {
        availableStock: effectiveStock,
        isAvailable,
        message: isAvailable ? 'In stock' : `Only ${physicalStock} left in stock`
      }
    });
  } catch (error) {
    console.error("Error in checkStock:", error);
    next(error);
  }
};

// ==========================================
// GET USER CART (DYNAMIC PRICING ENGINE)
// ==========================================
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user;
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    const cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'title slug category isPremium variants'
    });

    if (userId) {
      User.findByIdAndUpdate(userId, {
        lastKnownRegion: {
          countryCode: regionData.countryCode,
          currencyCode: regionData.currencyCode,
          symbol: regionData.symbol,
          rate: regionData.rate
        }
      }).catch(err => console.error("[Silent Tracking Error]:", err));
    }

    if (cart) {
      Cart.findByIdAndUpdate(cart._id, {
        lastKnownRegion: {
          countryCode: regionData.countryCode,
          currencyCode: regionData.currencyCode,
          symbol: regionData.symbol,
          rate: regionData.rate
        }
      }).catch(() => {});
    }

    if (!cart || !cart.items.length) {
      return res.status(200).json({ 
        success: true, 
        data: { 
          items: [], 
          subTotal: 0,
          currencySymbol: regionData.symbol,
          currencyCode: regionData.currencyCode
        } 
      });
    }

    let subTotal = 0;
    
    const formattedItems = cart.items.map(cartItem => {
      if (!cartItem.product) return null;

      const activeVariant = cartItem.product.variants.find(
        v => v._id.toString() === cartItem.variantId.toString()
      );

      if (!activeVariant) return null;

      const isDrinkware = isDrinkwareCategory(cartItem.product.category, cartItem.product.title);

      let unitPrice = 0;
      let unitOriginalPrice = 0;
      let itemTotalConverted = 0;
      let bundleLabel = null;

      if (isDrinkware && [1, 2, 4].includes(cartItem.quantity)) {
        const bundleMath = calculateDrinkwareBundleTotal(cartItem.quantity, regionData);
        unitPrice = bundleMath.unitSellingPrice;
        unitOriginalPrice = bundleMath.unitOriginalPrice;
        itemTotalConverted = bundleMath.itemTotal;
        bundleLabel = bundleMath.bundleLabel;
      } else {
        const localizedPricing = calculateRegionalPricing(
          activeVariant.pricing.price, 
          activeVariant.pricing.discountPercentage || 0, 
          cartItem.product.isPremium || false, 
          regionData
        );
        unitPrice = localizedPricing.sellingPrice;
        unitOriginalPrice = localizedPricing.originalPrice;
        itemTotalConverted = cartItem.quantity * localizedPricing.sellingPrice;
      }

      subTotal += itemTotalConverted;

      return {
        cartItemId: cartItem._id,
        productId: cartItem.product._id,
        variantId: cartItem.variantId,
        slug: cartItem.product.slug,
        title: cartItem.product.title,
        colorName: activeVariant.colorName,
        img: activeVariant.images.find(img => img.isPrimary)?.baseUrl || activeVariant.images[0]?.baseUrl,
        price: unitPrice, 
        originalPrice: unitOriginalPrice, 
        quantity: cartItem.quantity,
        itemTotal: itemTotalConverted,
        isDrinkware,
        bundleLabel,
        maxLimit: activeVariant.inventory.allowBackorder ? 5 : Math.min(5, activeVariant.inventory.quantity)
      };
    }).filter(item => item !== null); 

    return res.status(200).json({
      success: true,
      data: { 
        items: formattedItems, 
        subTotal,
        currencySymbol: regionData.symbol,      
        currencyCode: regionData.currencyCode    
      }
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    next(error);
  }
};

// ==========================================
// HYDRATE & PERSIST GUEST CART (UNIFIED DB RECORDING)
// ==========================================
export const hydrateGuestCart = async (req, res, next) => {
  try {
    const { localItems, isMutation } = req.body; 
    const deviceId = req.cookies?.device_id;
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    // 1. Check if an Admin forcibly cleared this guest cart while the user was away
    if (deviceId && !req.user) {
      const existingGuestCart = await Cart.findOne({ deviceId, user: null });
      if (existingGuestCart && existingGuestCart.forceClearLocal && !isMutation) {
        existingGuestCart.forceClearLocal = false;
        existingGuestCart.items = [];
        await existingGuestCart.save();

        return res.status(200).json({
          success: true,
          data: {
            items: [],
            subTotal: 0,
            currencySymbol: regionData.symbol,
            currencyCode: regionData.currencyCode,
            forceClearedByAdmin: true
          }
        });
      }
    }

    // 2. If localItems is empty, ensure any existing guest cart in DB is cleared too
    if (!localItems || !Array.isArray(localItems) || localItems.length === 0) {
      if (deviceId && !req.user) {
        await Cart.findOneAndUpdate(
          { deviceId, user: null },
          {
            $set: {
              items: [],
              forceClearLocal: false,
              lastKnownRegion: {
                countryCode: regionData.countryCode,
                currencyCode: regionData.currencyCode,
                symbol: regionData.symbol,
                rate: regionData.rate
              }
            }
          }
        );
      }

      return res.status(200).json({
        success: true,
        data: { items: [], subTotal: 0, currencySymbol: regionData.symbol, currencyCode: regionData.currencyCode }
      });
    }

    let subTotal = 0;
    const formattedItems = [];
    const dbItemsToPersist = [];

    // 3. Fetch live product data for the IDs sent from localStorage
    for (const item of localItems) {
      if (!mongoose.Types.ObjectId.isValid(item.productId) || !mongoose.Types.ObjectId.isValid(item.variantId)) {
        continue;
      }

      const product = await Product.findOne({ _id: item.productId, status: 'active' })
        .select('title slug category isPremium variants')
        .lean();

      if (!product) continue;

      const activeVariant = product.variants.find(v => v._id.toString() === item.variantId.toString());
      if (!activeVariant) continue;

      const maxAllowed = activeVariant.inventory.allowBackorder ? 5 : Math.min(5, activeVariant.inventory.quantity);
      const safeQuantity = Math.min(Number(item.quantity) || 1, maxAllowed);

      if (safeQuantity <= 0 && !activeVariant.inventory.allowBackorder) continue;

      const isDrinkware = isDrinkwareCategory(product.category, product.title);

      let unitPrice = 0;
      let unitOriginalPrice = 0;
      let itemTotalConverted = 0;
      let bundleLabel = null;

      if (isDrinkware && [1, 2, 4].includes(safeQuantity)) {
        const bundleMath = calculateDrinkwareBundleTotal(safeQuantity, regionData);
        unitPrice = bundleMath.unitSellingPrice;
        unitOriginalPrice = bundleMath.unitOriginalPrice;
        itemTotalConverted = bundleMath.itemTotal;
        bundleLabel = bundleMath.bundleLabel;
      } else {
        const localizedPricing = calculateRegionalPricing(
          activeVariant.pricing.price, 
          activeVariant.pricing.discountPercentage || 0, 
          product.isPremium || false, 
          regionData
        );
        unitPrice = localizedPricing.sellingPrice;
        unitOriginalPrice = localizedPricing.originalPrice;
        itemTotalConverted = safeQuantity * localizedPricing.sellingPrice;
      }

      subTotal += itemTotalConverted;

      formattedItems.push({
        cartItemId: `guest-${item.variantId}`,
        productId: product._id,
        variantId: item.variantId,
        slug: product.slug,
        title: product.title,
        colorName: activeVariant.colorName,
        img: activeVariant.images.find(img => img.isPrimary)?.baseUrl || activeVariant.images[0]?.baseUrl,
        price: unitPrice,
        originalPrice: unitOriginalPrice,
        quantity: safeQuantity,
        itemTotal: itemTotalConverted,
        isDrinkware,
        bundleLabel,
        maxLimit: maxAllowed
      });

      const existingIdx = dbItemsToPersist.findIndex(
        dbI => dbI.variantId.toString() === item.variantId.toString()
      );
      if (existingIdx > -1) {
        dbItemsToPersist[existingIdx].quantity = Math.min(dbItemsToPersist[existingIdx].quantity + safeQuantity, maxAllowed);
      } else {
        dbItemsToPersist.push({
          product: product._id,
          variantId: activeVariant._id,
          quantity: safeQuantity
        });
      }
    }

    // 4. Upsert the Guest Cart into MongoDB so Admins have real-time visibility
    if (deviceId && !req.user) {
      await Cart.findOneAndUpdate(
        { deviceId, user: null },
        {
          $set: {
            deviceId,
            user: null,
            items: dbItemsToPersist,
            forceClearLocal: false,
            lastKnownRegion: {
              countryCode: regionData.countryCode,
              currencyCode: regionData.currencyCode,
              symbol: regionData.symbol,
              rate: regionData.rate
            }
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        items: formattedItems,
        subTotal,
        currencySymbol: regionData.symbol,
        currencyCode: regionData.currencyCode
      }
    });

  } catch (error) {
    console.error("Error hydrating guest cart:", error);
    next(error);
  }
};

// ==========================================
// ADD TO CART (DUMB DATABASE UPDATE)
// ==========================================
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user;
    const { productId, variantId, quantity, availableStock } = req.verifiedItem; 

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.variantId.toString() === variantId.toString()
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      cart.items[existingItemIndex].quantity = Math.min(newQuantity, 5, availableStock);
    } else {
      cart.items.push({
        product: productId,
        variantId: variantId,
        quantity: quantity,
      });
    }

    await cart.save();
    return res.status(200).json({ success: true, message: 'Added to cart successfully.' });

  } catch (error) {
    console.error("Error adding to cart:", error);
    next(error);
  }
};

// ==========================================
// UPDATE QUANTITY
// ==========================================
export const updateCartItemQuantity = async (req, res, next) => {
  try {
    const userId = req.user;
    const { variantId, quantity } = req.verifiedItem; 

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item.variantId.toString() === variantId.toString());
    
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      return res.status(200).json({ success: true, message: 'Cart updated.' });
    } else {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    next(error);
  }
};

// ==========================================
// REMOVE FROM CART
// ==========================================
export const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user;
    const { variantId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.variantId.toString() !== variantId.toString());
    
    await cart.save();
    return res.status(200).json({ success: true, message: 'Item removed from cart.' });
  } catch (error) {
    console.error("Error removing from cart:", error);
    next(error);
  }
};

// ==========================================
// CLEAR CART
// ==========================================
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user;
    const cart = await Cart.findOne({ user: userId });
    
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    
    return res.status(200).json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    console.error("Error clearing cart:", error);
    next(error);
  }
};

// ==========================================
// GUEST TO USER MERGE (WITH SHADOW CART CLEANUP)
// ==========================================
export const syncCart = async (req, res, next) => {
  try {
    const userId = req.user;
    const deviceId = req.cookies?.device_id;
    const { localItems } = req.body; 
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
        lastKnownRegion: {
          countryCode: regionData.countryCode,
          currencyCode: regionData.currencyCode,
          symbol: regionData.symbol,
          rate: regionData.rate
        }
      });
    }

    if (localItems && Array.isArray(localItems) && localItems.length > 0) {
      for (const localItem of localItems) {
        if (!mongoose.Types.ObjectId.isValid(localItem.productId) || !mongoose.Types.ObjectId.isValid(localItem.variantId)) {
          continue;
        }

        const product = await Product.findOne(
          { _id: localItem.productId, status: 'active', 'variants._id': localItem.variantId },
          { 'variants.$': 1 }
        ).lean();

        if (product && product.variants.length > 0) {
          const variant = product.variants[0];
          const dbStock = variant.inventory.quantity;

          if (dbStock > 0 || variant.inventory.allowBackorder) {
            const existingItemIndex = cart.items.findIndex(
              i => i.variantId.toString() === localItem.variantId.toString()
            );
            
            const effectiveStock = variant.inventory.allowBackorder ? 5 : dbStock;

            if (existingItemIndex > -1) {
              const combinedQty = cart.items[existingItemIndex].quantity + localItem.quantity;
              cart.items[existingItemIndex].quantity = Math.min(combinedQty, 5, effectiveStock);
            } else {
              cart.items.push({
                product: localItem.productId,
                variantId: localItem.variantId,
                quantity: Math.min(localItem.quantity, 5, effectiveStock),
              });
            }
          }
        }
      }
      await cart.save();
    }

    if (deviceId) {
      await Cart.deleteOne({ deviceId, user: null });
    }

    return res.status(200).json({ success: true, message: 'Cart synchronized successfully.' });

  } catch (error) {
    console.error("Error syncing cart:", error);
    next(error);
  }
};