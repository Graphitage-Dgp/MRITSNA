
export const detectUserRegion = async (req, res, next) => {
  try {
    // The regionMiddleware executes before this controller is hit,
    // so req.region is guaranteed to be fully populated here.
    if (!req.region) {
      return res.status(500).json({
        success: false,
        message: "Failed to resolve region data. Middleware may have failed."
      });
    }

    // Return the clean package directly to the React frontend
    // so it can be saved in localStorage.
    return res.status(200).json({
      success: true,
      data: req.region
    });

  } catch (error) {
    console.error("[Region Detect Error]:", error);
    // Fallback to ensure the frontend never crashes on first load
    return res.status(200).json({
      success: true,
      data: {
        countryCode: "IN",
        currencyCode: "INR",
        symbol: "₹",
        rate: 1
      }
    });
  }
};