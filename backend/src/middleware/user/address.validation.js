import { z } from "zod";

// Validates standard 24-character hex string for MongoDB ObjectIds
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// The core rules for an address document
const addressCoreSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  email: z.string().email("Invalid email format").trim().toLowerCase(),
  phone: z.string().min(7, "Phone number is too short").max(15, "Phone number is too long").trim(),
  street: z.string().min(5, "Street address must be at least 5 characters").trim(),
  city: z.string().min(2, "City name is required").trim(),
  state: z.string().min(2, "State name is required").trim(),
  pinCode: z.string().min(3, "Zip/Postal code is required").trim(),
  country: z.string().min(2, "Country name is required").trim().default("India"),
  type: z.enum(['Home', 'Work', 'Other'], {
    errorMap: () => ({ message: "Type must be Home, Work, or Other" })
  }).default('Home'),
  isDefault: z.boolean().optional().default(false),
});

/**
 * Validate Create Address Requests
 */
export const createAddressSchema = z.object({
  body: addressCoreSchema,
});

/**
 * Validate Update Address Requests
 * Uses `.partial()` so the frontend doesn't have to send the entire object just to update one field
 */
export const updateAddressSchema = z.object({
  params: z.object({
    addressId: objectIdSchema,
  }),
  body: addressCoreSchema.partial(),
});

/**
 * Validate simple parameter requests (Delete / Set Default)
 */
export const addressIdParamSchema = z.object({
  params: z.object({
    addressId: objectIdSchema,
  }),
});