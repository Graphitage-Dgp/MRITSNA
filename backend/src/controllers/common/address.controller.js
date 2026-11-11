import Address from "../../models/address.model.js";

// --- Helper to safely extract User ID ---
const getUserId = (reqUser) => {
  return reqUser ? (reqUser._id || reqUser.id || reqUser.userId || reqUser) : null;
};

/**
 * Get all active addresses for the logged-in user
 */
export const getUserAddresses = async (req, res) => {
  try {
    const userId = getUserId(req.user);

    // Fetch active addresses, sorting the 'Default' one to the very top
    const addresses = await Address.find({ user: userId, isActive: true })
      .sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("[Get Addresses Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your addresses.",
    });
  }
};

/**
 * Create a new address
 */
export const createAddress = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    
    // Check if this is the user's very first address
    const existingCount = await Address.countDocuments({ user: userId, isActive: true });
    
    // If it's their first address, force it to be the default
    const isFirstAddress = existingCount === 0;

    const newAddress = new Address({
      ...req.body,
      user: userId,
      isDefault: isFirstAddress ? true : (req.body.isDefault || false)
    });

    // The pre('save') hook in the model will automatically remove 'isDefault' from others if needed
    const savedAddress = await newAddress.save();

    return res.status(201).json({
      success: true,
      message: "Address saved successfully.",
      data: savedAddress,
    });
  } catch (error) {
    console.error("[Create Address Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save address.",
    });
  }
};

/**
 * Update an existing address
 */
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = getUserId(req.user);

    // We use findById and save() instead of findByIdAndUpdate so the pre('save') hook triggers!
    const address = await Address.findOne({ _id: addressId, user: userId, isActive: true });

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    // Update fields
    const updatableFields = [
      'firstName', 'lastName', 'email', 'phone', 'street', 
      'city', 'state', 'pinCode', 'country', 'type', 'isDefault'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        address[field] = req.body[field];
      }
    });

    const updatedAddress = await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully.",
      data: updatedAddress,
    });
  } catch (error) {
    console.error("[Update Address Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update address.",
    });
  }
};

/**
 * Soft Delete an address
 */
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = getUserId(req.user);

    const address = await Address.findOne({ _id: addressId, user: userId, isActive: true });

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    // Soft delete
    address.isActive = false;
    const wasDefault = address.isDefault;
    address.isDefault = false;
    await address.save();

    // If they deleted their default address, automatically make their most recent active address the new default
    if (wasDefault) {
      const fallbackAddress = await Address.findOne({ user: userId, isActive: true }).sort({ createdAt: -1 });
      if (fallbackAddress) {
        fallbackAddress.isDefault = true;
        await fallbackAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address removed.",
      data: addressId
    });
  } catch (error) {
    console.error("[Delete Address Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove address.",
    });
  }
};

/**
 * Quick Toggle to set an address as Default
 */
export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = getUserId(req.user);

    const address = await Address.findOne({ _id: addressId, user: userId, isActive: true });

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    // Setting this to true and saving will trigger the model's pre('save') hook to strip default from all others
    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated.",
      data: address
    });
  } catch (error) {
    console.error("[Set Default Address Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update default address.",
    });
  }
};