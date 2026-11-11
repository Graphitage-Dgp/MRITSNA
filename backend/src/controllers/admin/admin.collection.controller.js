import Collection from '../../models/collection.model.js';
import slugify from 'slugify';
import { deleteImageKitFile } from '../../utils/imagekit.js';

// --- Utility: Generate Unique Slug ---
const generateUniqueSlug = async (title) => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (await Collection.exists({ slug: uniqueSlug })) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
};

// --- Create a New Collection ---
export const createCollection = async (req, res, next) => {
  try {
    const collectionData = req.body;
    
    // Auto-generate the URL slug based on the title
    collectionData.slug = await generateUniqueSlug(collectionData.title);

    const collection = await Collection.create(collectionData);

    return res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: collection
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

// --- Update an Existing Collection ---
export const updateCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Fetch the OLD collection first to compare images
    const oldCollection = await Collection.findById(id);

    if (!oldCollection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // --- ImageKit Orphan Cleanup Logic ---
    // If the admin uploaded a new image, we must delete the old one from ImageKit
    const orphanedFileIds = [];

    // Check Hero Image replacement
    if (
      updateData.heroImage && 
      oldCollection.heroImage?.imagekitFileId && 
      updateData.heroImage.imagekitFileId !== oldCollection.heroImage.imagekitFileId
    ) {
      orphanedFileIds.push(oldCollection.heroImage.imagekitFileId);
    }

    // Check Lookbook Image replacement
    if (
      updateData.lookbook?.image && 
      oldCollection.lookbook?.image?.imagekitFileId && 
      updateData.lookbook.image.imagekitFileId !== oldCollection.lookbook.image.imagekitFileId
    ) {
      orphanedFileIds.push(oldCollection.lookbook.image.imagekitFileId);
    }

    // Fire and forget deletions (doesn't block the API response)
    orphanedFileIds.forEach(fileId => {
      deleteImageKitFile(fileId);
    });

    // Proceed with the database update
    const updatedCollection = await Collection.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Collection updated successfully',
      data: updatedCollection
    });

  } catch (error) {
    next(error);
  }
};

// --- Change Collection Status (Quick Toggle) ---
export const changeCollectionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    if (!['active', 'draft', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided' });
    }

    const collection = await Collection.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: 'after' } 
    );

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Collection status changed to ${status}`,
      data: { id: collection._id, status: collection.status }
    });

  } catch (error) {
    next(error);
  }
};

// --- Get All Collections (For Admin Dashboard Table) ---
export const getAdminCollections = async (req, res, next) => {
  try {
    // We only select the fields needed for the data table to keep the payload light
    const collections = await Collection.find({})
      .select('title slug subtitle status heroImage gridProducts createdAt')
      .sort({ createdAt: -1 })
      .lean(); 

    const tableData = collections.map((collection) => ({
      _id: collection._id,
      title: collection.title,
      slug: collection.slug,
      subtitle: collection.subtitle,
      status: collection.status,
      // Count how many products are linked in the grid
      productCount: collection.gridProducts?.length || 0,
      image: collection.heroImage ? {
        baseUrl: collection.heroImage.baseUrl,
        altText: collection.heroImage.altText
      } : null,
      createdAt: collection.createdAt
    }));

    return res.status(200).json({
      success: true,
      count: tableData.length,
      data: tableData
    });
  } catch (error) {
    next(error);
  }
};

// --- Get Single Collection by ID (For Admin Edit Form) ---
export const getAdminCollectionById = async (req, res, next) => {
  try {
    // We deep-populate the linked products so the admin UI can show the names/images 
    // of the products currently selected, rather than just raw ObjectIds.
    const collection = await Collection.findById(req.params.id)
      .populate({
        path: 'gridProducts',
        select: 'title slug status variants.images variants.pricing variants.sku'
      })
      .populate({
        path: 'bundle.products',
        select: 'title slug status variants.images variants.pricing variants.sku'
      })
      .populate({
        path: 'lookbook.hotspots.product',
        select: 'title slug status variants.images variants.pricing variants.sku'
      });

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    return res.status(200).json({
      success: true,
      data: collection
    });
  } catch (error) {
    next(error);
  }
};

// --- Delete Collection (Full Cleanup) ---
export const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const collection = await Collection.findById(id);
    
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    // Delete associated images from ImageKit to prevent storage leaks
    if (collection.heroImage?.imagekitFileId) {
      deleteImageKitFile(collection.heroImage.imagekitFileId);
    }
    if (collection.lookbook?.image?.imagekitFileId) {
      deleteImageKitFile(collection.lookbook.image.imagekitFileId);
    }

    await Collection.findByIdAndDelete(id);

    return res.status(200).json({ 
      success: true, 
      message: 'Collection and associated images deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// --- Delete collection image on clikcing to the cross icon ---
export const deleteCollectionImage = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ImageKit File ID is required' 
      });
    }

    // Call your existing ImageKit utility function
    await deleteImageKitFile(fileId);

    return res.status(200).json({
      success: true,
      message: 'Image successfully removed from cloud storage'
    });
  } catch (error) {
    // If ImageKit throws a 404 (file already deleted), we can just ignore it and return success
    if (error.message?.includes('404') || error.response?.status === 404) {
      return res.status(200).json({
        success: true,
        message: 'Image was already removed'
      });
    }
    next(error);
  }
};