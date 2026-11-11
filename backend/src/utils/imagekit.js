import ImageKit from "imagekit";
import "../config/env.js";

// Initialize the SDK with your keys
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

export const deleteImageKitFile = async (fileId) => {
  try {
    if (!fileId) {
      console.warn("[Storage Warning] Attempted to delete image but no fileId was provided.");
      return;
    }
    
    await imagekit.deleteFile(fileId);
    console.log(`[Storage] Successfully deleted orphaned image from ImageKit: ${fileId}`);
  } catch (error) {
    // We catch the error here so it doesn't crash the server if a deletion fails
    console.error(`[Storage Error] Failed to delete image ${fileId} from ImageKit:`, error.message);
  }
};

export default imagekit;