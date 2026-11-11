import { z } from "zod";

// --- Sub-Schemas (Built from the inside out) ---

const imageSchema = z.object({
  imagekitFileId: z.string().min(1, "ImageKit File ID is required"),
  baseUrl: z.string().url("High-res URL must be a valid URL"),
  altText: z.string().min(1, "Alt text is required for accessibility"),
  isPrimary: z.boolean().optional().default(false),
  displayOrder: z.coerce.number().int().optional().default(0),
});

const variantSchema = z.object({
  // Boolean flag for multicolor
  isMulticolor: z.boolean().optional().default(false),

  colorName: z.string().min(3, "Color name is required (e.g., Obsidian)"),
  
  // Relaxed base validation to allow empty/missing values 
  // before the superRefine cross-check runs.
  colorHex: z.string().optional().or(z.literal('')),
  
  sku: z.string().min(3, "SKU is required and must be at least 3 characters"),
  
  // Variant-level pricing validation (with coerce for HTML number inputs)
  pricing: z.object({
    price: z.coerce.number().min(0, "Price cannot be negative"),
    discountPercentage: z.coerce.number().min(0).max(100).optional().default(0),
  }),

  // Variant-level attributes validation
  attributes: z.object({
    material: z.string().min(3, "Material is required (e.g., Ceramic)"),
    finish: z.string().optional(),
  }),

  // Frontend validation for Care Instructions
  careInstructions: z.string().min(10, "Care instructions are required for this variant"),

  inventory: z.object({
    // z.coerce instantly transforms form string inputs to actual numbers
    quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
    lowStockThreshold: z.coerce.number().int().min(0).optional().default(3),
    allowBackorder: z.boolean().optional().default(false),
  }),
  
  // Enforce the 5-image limit just like the backend
  images: z.array(imageSchema)
    .min(1, "At least one image is required for this variant")
    .max(5, "A variant cannot exceed 5 images"),
}).superRefine((data, ctx) => {
  // The Cross-Field Validation Logic for the Frontend Form
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

// --- Main Exported Schema ---

export const productValidationSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters"),
  
  description: z.string()
    .min(10, "Description needs more detail"),
  
  category: z.enum(['Vase','Dinnerset', 'Decor', 'Bowl', 'Cup', 'Mug', 'Platter/Tray', 'Tea', 'Tealight Candle', 'Teapot', 'Tumbler', 'Serveware', 'Puja', 'Aromatic Candle'], {
    errorMap: () => ({ message: "Please select a valid category" })
  }),

  isPremium: z.boolean().optional().default(false),

  care: z
    .object({
      isTransitSafe: z.boolean().optional().default(true),
      isFoodSafe: z.boolean().optional().default(false),
      isMicrowaveDishwasherSafe: z.boolean().optional().default(false),
    })
    .optional()
    .default({
      isTransitSafe: true,
      isFoodSafe: false,
      isMicrowaveDishwasherSafe: false,
    }),

  pricing: z.object({
    baseCurrency: z.string().length(3, "Currency must be a 3-letter ISO code").optional().default("INR"),
    taxClass: z.string().optional().default("standard"),
    hsnCode: z.string().min(4, "HSN Code is required for logistics"),
  }),

  shipping: z.object({
    weightGrams: z.coerce.number().int().min(1, "Weight is required for shipping calculations"),
    dimensions: z.object({
      lengthCm: z.coerce.number().min(0.1, "Length is required"),
      widthCm: z.coerce.number().min(0.1, "Width is required"),
      heightCm: z.coerce.number().min(0.1, "Height is required"),
    }),
    isFragile: z.boolean().optional().default(true),
  }),

  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }).optional(),

  status: z.enum(['draft', 'active', 'archived']).optional().default('draft'),

  // The massive variants array
  variants: z.array(variantSchema).min(1, "You must provide at least one color variant"),
});