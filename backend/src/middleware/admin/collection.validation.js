import { z } from "zod";

// --- Utility: MongoDB ObjectId Validator ---
// Ensures the string provided is a mathematically valid 24-character hexadecimal string
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID reference format");

// --- Sub-Schema: Reusable Image Object ---
const imageSchema = z.object({
  imagekitFileId: z.string().min(1, "ImageKit File ID is required"),
  baseUrl: z.string().url("High-res URL must be a valid URL"),
  altText: z.string().min(1, "Alt text is required for accessibility"),
});

// --- Sub-Schema: Lookbook Hotspots ---
const hotspotSchema = z.object({
  topPercentage: z
    .number()
    .min(0, "Top percentage cannot be less than 0")
    .max(100, "Top percentage cannot exceed 100"),
  leftPercentage: z
    .number()
    .min(0, "Left percentage cannot be less than 0")
    .max(100, "Left percentage cannot exceed 100"),
  product: objectIdSchema,
});

// --- Main Schema: Create Collection ---
export const createCollectionSchema = z.object({
  // 1. Core Details
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),
  subtitle: z
    .string()
    .min(3, "Subtitle must be at least 3 characters")
    .max(100, "Subtitle cannot exceed 100 characters"),
  description: z
    .string()
    .min(10, "Description needs more detail (minimum 10 characters)"),

  // 2. The Immersive Hero
  heroImage: imageSchema,

  // 3. The Interactive Lookbook
  lookbook: z.object({
    image: imageSchema,
    hotspots: z.array(hotspotSchema).optional().default([]),
  }),

  // 4. The Asymmetric Roster (Grid)
  // Ensures the admin selects at least one product to show in the grid
  gridProducts: z
    .array(objectIdSchema)
    .min(1, "You must select at least one product for the collection grid"),

  // 5. The Ultimate Upsell (Bundle)
  bundle: z.object({
    products: z
      .array(objectIdSchema)
      .min(2, "A bundle must contain at least 2 products to form a set"), 
    discountPercentage: z
      .number()
      .min(0, "Discount cannot be negative")
      .max(100, "Discount cannot exceed 100")
      .optional()
      .default(0),
  }).optional(), // Marked optional in case a collection does not offer a bundled discount

  // 6. Visibility & SEO
  status: z.enum(["draft", "active", "archived"]).optional().default("draft"),
  
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),
});

// --- Main Schema: Update Collection ---
// `.partial()` makes all fields optional for PATCH/PUT requests.
// This allows the admin to update a single field (like status) without resending the entire payload.
export const updateCollectionSchema = createCollectionSchema.partial();

// --- Exported Middleware ---
// Intercepts the request, validates the body against the Zod schema, and formats errors cleanly
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Invalid collection data provided",
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
};