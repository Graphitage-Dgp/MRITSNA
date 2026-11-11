import Product from '../../models/product.model.js';
import slugify from 'slugify';
import imagekit, { deleteImageKitFile } from '../../utils/imagekit.js';


const generateUniqueSlug = async (title) => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (await Product.exists({ slug: uniqueSlug })) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
};

export const createProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    productData.slug = await generateUniqueSlug(productData.title);

    const product = await Product.create(productData);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Database Conflict: The ${duplicatedField} '${error.keyValue[duplicatedField]}' is already in use.`
      });
    }
    next(error); 
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 1. Fetch the OLD product first to get the existing images
    const oldProduct = await Product.findById(id);

    if (!oldProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Spot the missing ImageKit IDs
    if (updateData.variants) {
      // Flatten all old file IDs into a simple array
      const oldFileIds = oldProduct.variants.flatMap(variant => 
        variant.images.map(img => img.imagekitFileId)
      );

      // Flatten all incoming (new) file IDs into a simple array
      const newFileIds = updateData.variants.flatMap(variant => 
        variant.images?.map(img => img.imagekitFileId) || []
      );

      // Find IDs that exist in the old array but NOT in the new array
      const orphanedFileIds = oldFileIds.filter(id => !newFileIds.includes(id));

      // We loop through orphans and call delete without 'await' to avoid blocking the response
      orphanedFileIds.forEach(fileId => {
        deleteImageKitFile(fileId); 
      });
    }

    // Proceed with the actual database update
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true } // FIXED
    );

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Conflict: A variant with this SKU already exists in the catalog.`
      });
    }
    next(error);
  }
};

export const changeProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    if (!['active', 'draft', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided' });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: 'after' } // FIXED
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Product status changed to ${status}`,
      data: { id: product._id, status: product.status }
    });

  } catch (error) {
    next(error);
  }
};

export const getAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.find({})
      .select('title slug category isPremium status variants.pricing variants.sku variants.inventory variants.images')
      .sort({ createdAt: -1 })
      .lean(); 

    const tableData = products.map((product) => {
      const firstVariant = product.variants?.[0];
      const firstImage = firstVariant?.images?.[0];

      return {
        _id: product._id,
        title: product.title,
        slug: product.slug,
        category: product.category,
        isPremium: product.isPremium || false,
        status: product.status,
        
        price: firstVariant?.pricing?.price,
        
        sku: firstVariant?.sku || 'N/A',
        stock: firstVariant?.inventory?.quantity || 0,
        lowStock: firstVariant?.inventory?.quantity <= (firstVariant?.inventory?.lowStockThreshold || 3),
        
        // Return baseUrl instead of thumbnailUrl
        image: firstImage ? {
          baseUrl: firstImage.baseUrl,
          altText: firstImage.altText
        } : null
      };
    });

    return res.status(200).json({
      success: true,
      count: tableData.length,
      data: tableData
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const getImageKitAuth = (req, res) => {
  try {
    // Generate the signature required for direct frontend uploads
    const result = imagekit.getAuthenticationParameters();
    res.status(200).json(result);
  } catch (error) {
    console.error("ImageKit Auth Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate ImageKit signature" });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({ success: false, message: "File ID is required" });
    }

    // Delegate to the utility function you already built
    await deleteImageKitFile(fileId);
    
    res.status(200).json({ success: true, message: "Image deletion process completed" });
  } catch (error) {
    console.error("ImageKit Delete Route Error:", error);
    res.status(500).json({ success: false, message: "Server error during image deletion" });
  }
};

export const getInventoryList = async (req, res, next) => {
  try {
    // We use the Aggregation Pipeline to let MongoDB "flatten" the variants
    const inventory = await Product.aggregate([

      { $unwind: { path: "$variants", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          productId: "$_id",
          variantId: "$variants._id",
          title: "$title",
          sku: "$variants.sku",
          stock: "$variants.inventory.quantity",
          lowStockThreshold: "$variants.inventory.lowStockThreshold",
          image: { $arrayElemAt: ["$variants.images", 0] },
          isPremium: "$isPremium",
        }
      },
      { $sort: { title: 1, sku: 1 } }
    ]);

    // Format the response for the frontend
    const formattedInventory = inventory.map(item => {
      return {
        productId: item.productId,
        variantId: item.variantId || 'no-variant',
        title: item.sku ? `${item.title} - ${item.sku}` : item.title,
        sku: item.sku || 'N/A',
        stock: item.stock || 0,
        
        lowStockThreshold: item.lowStockThreshold || 3,
        
        isLowStock: (item.stock || 0) <= (item.lowStockThreshold || 3),
        image: item.image ? { baseUrl: item.image.baseUrl, altText: item.image.altText } : null,
        isPremium: item.isPremium || false,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedInventory.length,
      data: formattedInventory
    });

  } catch (error) {
    next(error);
  }
};

export const updateVariantStock = async (req, res, next) => {
  try {
    const { productId, variantId, newStock } = req.body;

    // Strict validation to prevent setting stock to NaN or negative numbers
    if (newStock === undefined || typeof newStock !== 'number' || newStock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'A valid non-negative stock quantity is required' 
      });
    }

    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product could not be found' 
      });
    }

    const variant = product.variants.id(variantId);
    
    if (!variant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Specific variant could not be found' 
      });
    }

    // Directly assign the new stock value
    variant.inventory.quantity = newStock;
    
    // Triggers native Mongoose validation and forces the deep write
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: { productId, variantId, newStock }
    });

  } catch (error) {
    next(error);
  }
};