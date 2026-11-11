import { z } from "zod";

// --- Reusable Sub-Schemas ---
const imageSchema = z.object({
  imagekitFileId: z.string().min(1, "ImageKit File ID is required"),
  baseUrl: z.string().url("High-res URL must be a valid URL"),
  altText: z.string().min(1, "Alt text is required for accessibility"),
  isPrimary: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

const variantSchema = z.object({
  // Boolean flag for multicolor
  isMulticolor: z.boolean().optional(),
  
  colorName: z.string().min(3, "Color name is required"),
  
  // UPDATED: Relaxed base validation to allow empty/missing values 
  // before the superRefine cross-check runs.
  colorHex: z.string().optional().or(z.literal('')),
  
  sku: z.string().min(3, "SKU is required and must be at least 3 characters"),
  
  pricing: z.object({
    price: z
      .number()
      .min(0, "Price cannot be negative"),
    discountPercentage: z.number().min(0).max(100).optional(),
  }),

  attributes: z.object({
    material: z.string().min(3, "Material is required for this variant"),
    finish: z.string().optional(),
  }),

  // Care Instructions validation
  careInstructions: z.string().min(10, "Care instructions are required for this variant"),

  inventory: z.object({
    quantity: z.number().int().min(0, "Quantity cannot be negative"),
    lowStockThreshold: z.number().int().min(0).optional(),
    allowBackorder: z.boolean().optional(),
  }),
  
  images: z.array(imageSchema).max(5, "A variant cannot exceed 5 images"),
}).superRefine((data, ctx) => {
  // The Cross-Field Validation Logic
  if (!data.isMulticolor) {
    // If it is a solid color, hex is strictly required
    if (!data.colorHex || data.colorHex.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hex code is required unless Multicolor is selected",
        path: ["colorHex"], 
      });
    } else if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.colorHex)) {
      // If a hex is provided, it must be mathematically valid
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Must be a valid Hex code (e.g., #1A1A1A)",
        path: ["colorHex"],
      });
    }
  }
});

// --- Exported Schemas ---
export const createProductSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title too long"),
  description: z.string().min(10, "Description needs more detail"),
  category: z.enum(['Vase','Dinnerset', 'Decor', 'Bowl', 'Cup', 'Mug', 'Platter/Tray', 'Tea', 'Tealight Candle', 'Teapot', 'Tumbler', 'Serveware', 'Puja', 'Aromatic Candle']),
  
  isPremium: z.boolean().optional(),

  care: z
    .object({
      isTransitSafe: z.boolean().optional(),
      isFoodSafe: z.boolean().optional(),
      isMicrowaveDishwasherSafe: z.boolean().optional(),
    })
    .optional(),

  pricing: z.object({
    baseCurrency: z
      .string()
      .length(3, "Currency must be a 3-letter ISO code")
      .optional(),
    taxClass: z.string().optional(),
    hsnCode: z
      .string()
      .min(4, "HSN Code is required for international shipping"),
  }),

  shipping: z.object({
    weightGrams: z
      .number()
      .int()
      .min(1, "Weight is required for shipping calculations"),
    dimensions: z.object({
      lengthCm: z.number().min(0.1, "Length is required"),
      widthCm: z.number().min(0.1, "Width is required"),
      heightCm: z.number().min(0.1, "Height is required"),
    }),
    isFragile: z.boolean().optional(),
  }),

  variants: z
    .array(variantSchema)
    .min(1, "You must provide at least one color variant"),

  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),

  status: z.enum(["draft", "active", "archived"]).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// --- Exported Middleware ---
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
          message: "Invalid product data",
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
};