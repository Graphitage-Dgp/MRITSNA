import mongoose from "mongoose";
import Wishlist from "../../models/wishlist.model.js";
import Product from "../../models/product.model.js";
import { calculateRegionalPricing } from "../../utils/pricingEngine.js";

// ==========================================
// GET USER WISHLIST (DYNAMIC PRICING ENGINE)
// ==========================================
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user;
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    const wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "items.productId",
      select: "title slug category isPremium status variants",
    });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: { 
          items: [],
          currencySymbol: regionData.symbol,
          currencyCode: regionData.currencyCode
        },
      });
    }

    Wishlist.findByIdAndUpdate(wishlist._id, {
      lastKnownRegion: {
        countryCode: regionData.countryCode,
        currencyCode: regionData.currencyCode,
        symbol: regionData.symbol,
        rate: regionData.rate
      }
    }).catch(() => {});

    const validItems = wishlist.items.filter((item) => item.productId !== null);

    if (validItems.length !== wishlist.items.length) {
      wishlist.items = validItems;
      await wishlist.save();
    }

    const formattedItems = validItems.map((item) => {
      const product = item.productId;
      
      const variant = product.variants.find(
        (v) => v._id.toString() === item.variantId.toString() || v.id === item.variantId
      );

      if (!variant) return null;

      let imgUrl = "";
      if (variant.images && variant.images.length > 0) {
        const primaryImg = variant.images.find((img) => img.isPrimary) || variant.images[0];
        imgUrl = primaryImg.baseUrl || primaryImg.url || "";
      }

      const localizedPricing = calculateRegionalPricing(
        variant.pricing.price, 
        variant.pricing.discountPercentage || 0, 
        product.isPremium || false, 
        regionData
      );

      return {
        productId: product._id || product.id,
        variantId: variant._id || variant.id,
        title: product.title || "Unknown Product",
        slug: product.slug || "#",
        img: imgUrl,
        colorName: variant.colorName || "Unknown Color",
        price: localizedPricing.sellingPrice,
        originalPrice: localizedPricing.originalPrice, 
        status: product.status ? product.status.toLowerCase() : "active",
        inStock: variant.inventory?.quantity > 0,
        stockQuantity: variant.inventory?.quantity || 0,
        addedAt: item.addedAt
      };
    }).filter((item) => item !== null); 

    return res.status(200).json({
      success: true,
      data: { 
        items: formattedItems,
        currencySymbol: regionData.symbol,
        currencyCode: regionData.currencyCode
      },
    });
  } catch (error) {
    console.error("[Wishlist Controller - getWishlist Error]:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch wishlist." });
  }
};

// ==========================================
// HYDRATE & PERSIST GUEST WISHLIST (UNIFIED DB RECORDING)
// ==========================================
export const hydrateGuestWishlist = async (req, res) => {
  try {
    const { localItems } = req.body; 
    const deviceId = req.cookies?.device_id;
    const regionData = req.region || { countryCode: 'IN', currencyCode: 'INR', symbol: '₹', rate: 1 };

    // 1. If localItems is empty, clear any existing guest wishlist in DB
    if (!localItems || !Array.isArray(localItems) || localItems.length === 0) {
      if (deviceId && !req.user) {
        await Wishlist.findOneAndUpdate(
          { deviceId, user: null },
          {
            $set: {
              items: [],
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
        data: { items: [], currencySymbol: regionData.symbol, currencyCode: regionData.currencyCode }
      });
    }

    const formattedItems = [];
    const dbItemsToPersist = [];

    // 2. Fetch live product data for the IDs sent from localStorage
    for (const item of localItems) {
      if (!item.productId || !item.variantId || !mongoose.Types.ObjectId.isValid(item.productId)) continue;

      const product = await Product.findOne({ _id: item.productId, status: 'active' })
        .select('title slug category isPremium variants status')
        .lean();

      if (!product) continue;

      const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
      if (!variant) continue;

      let imgUrl = "";
      if (variant.images && variant.images.length > 0) {
        const primaryImg = variant.images.find((img) => img.isPrimary) || variant.images[0];
        imgUrl = primaryImg.baseUrl || primaryImg.url || "";
      }

      const localizedPricing = calculateRegionalPricing(
        variant.pricing.price, 
        variant.pricing.discountPercentage || 0, 
        product.isPremium || false, 
        regionData
      );

      formattedItems.push({
        productId: product._id,
        variantId: item.variantId,
        title: product.title,
        slug: product.slug,
        img: imgUrl,
        colorName: variant.colorName,
        price: localizedPricing.sellingPrice,
        originalPrice: localizedPricing.originalPrice,
        status: product.status.toLowerCase(),
        inStock: variant.inventory?.quantity > 0,
        stockQuantity: variant.inventory?.quantity || 0,
        addedAt: item.addedAt || new Date().toISOString()
      });

      const alreadyAdded = dbItemsToPersist.some(
        dbI => dbI.productId.toString() === product._id.toString() && dbI.variantId === item.variantId.toString()
      );
      if (!alreadyAdded) {
        dbItemsToPersist.push({
          productId: product._id,
          variantId: item.variantId.toString(),
          addedAt: item.addedAt ? new Date(item.addedAt) : new Date()
        });
      }
    }

    // 3. Upsert the Guest Wishlist into MongoDB for real-time Admin visibility
    if (deviceId && !req.user) {
      await Wishlist.findOneAndUpdate(
        { deviceId, user: null },
        {
          $set: {
            deviceId,
            user: null,
            items: dbItemsToPersist,
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
        currencySymbol: regionData.symbol,
        currencyCode: regionData.currencyCode
      }
    });

  } catch (error) {
    console.error("[Wishlist Controller - hydrateGuestWishlist Error]:", error);
    return res.status(500).json({ success: false, message: "Failed to hydrate guest wishlist." });
  }
};

// ==========================================
// TOGGLE WISHLIST ITEM (DUMB DB UPDATE)
// ==========================================
export const toggleWishlistItem = async (req, res) => {
  try {
    const userId = req.user;
    const { productId, variantId } = req.body;

    if (!productId || !variantId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Product ID and Variant ID are required.",
        });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: userId,
        items: [{ productId, variantId }],
      });
      return res
        .status(200)
        .json({
          success: true,
          message: "Item added to wishlist.",
          action: "added",
        });
    }

    const itemIndex = wishlist.items.findIndex(
      (item) =>
        item.productId.toString() === productId && item.variantId === variantId,
    );

    if (itemIndex > -1) {
      wishlist.items.splice(itemIndex, 1);
      await wishlist.save();
      return res
        .status(200)
        .json({
          success: true,
          message: "Item removed from wishlist.",
          action: "removed",
        });
    } else {
      wishlist.items.unshift({ productId, variantId }); 
      await wishlist.save();
      return res
        .status(200)
        .json({
          success: true,
          message: "Item added to wishlist.",
          action: "added",
        });
    }
  } catch (error) {
    console.error("[Wishlist Controller - toggleWishlistItem Error]:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update wishlist." });
  }
};

// ==========================================
// GUEST TO USER MERGE (WITH SHADOW WISHLIST CLEANUP)
// ==========================================
export const syncWishlist = async (req, res) => {
  try {
    const userId = req.user;
    const deviceId = req.cookies?.device_id;
    const itemsToSync = req.body.localItems || req.body.items;

    if (itemsToSync && Array.isArray(itemsToSync) && itemsToSync.length > 0) {
      let wishlist = await Wishlist.findOne({ user: userId });

      if (!wishlist) {
        const cleanItems = itemsToSync.map(i => ({
           productId: i.productId || i.product, 
           variantId: i.variantId || i.variant 
        })).filter(i => i.productId && i.variantId);

        await Wishlist.create({
          user: userId,
          items: cleanItems,
        });
      } else {
        let addedCount = 0;

        itemsToSync.forEach((localItem) => {
          const pId = localItem.productId || localItem.product;
          const vId = localItem.variantId || localItem.variant;

          const exists = wishlist.items.some(
            (dbItem) =>
              dbItem.productId.toString() === pId &&
              dbItem.variantId === vId,
          );

          if (!exists && pId && vId) {
            wishlist.items.unshift({
              productId: pId,
              variantId: vId,
            });
            addedCount++;
          }
        });

        if (addedCount > 0) {
          await wishlist.save();
        }
      }
    }

    // Delete the shadow guest wishlist for this deviceId so it does not duplicate in Admin
    if (deviceId) {
      await Wishlist.deleteOne({ deviceId, user: null });
    }

    return res
      .status(200)
      .json({ success: true, message: "Wishlist synced successfully." });
  } catch (error) {
    console.error("[Wishlist Controller - syncWishlist Error]:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to sync wishlist." });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user;
    await Wishlist.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
    return res
      .status(200)
      .json({ success: true, message: "Wishlist cleared." });
  } catch (error) {
    console.error("[Wishlist Controller - clearWishlist Error]:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to clear wishlist." });
  }
};
