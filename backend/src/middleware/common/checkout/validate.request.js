import { ZodError } from "zod";

/**
 * Generic Express middleware to validate request payload against a Zod schema.
 * @param {import("zod").AnyZodObject} schema - The Zod schema to validate against
 */
export const validateRequest = (schema) => async (req, res, next) => {
  try {
    // parseAsync will check req.body, req.query, and req.params based on the schema definition
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // If validation passes smoothly, proceed to the actual controller
    return next();
  } catch (error) {
    // If validation fails, intercept and return a clean, frontend-friendly error response
    if (error instanceof ZodError) {
      
      // FIX: Safely extract the array to prevent .map() crashes
      const validationErrors = error.issues || error.errors || [];
      
      const formattedErrors = validationErrors.map((err) => ({
        field: err.path.join('.'), // e.g., 'body.shippingAddress.email'
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: formattedErrors,
      });
    }

    // Catch any unexpected system errors during the validation process
    console.error("[ValidateRequest Middleware Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during validation",
    });
  }
};