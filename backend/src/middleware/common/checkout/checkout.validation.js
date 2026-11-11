import { z } from "zod";

// --- Reusable Base Schemas ---

// Validates standard 24-character hex string for MongoDB ObjectIds
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// Enforces exact match with our database payment options
const paymentOptionEnum = z.enum(['FULL_ONLINE', 'PARTIAL_COD'], {
  errorMap: () => ({ message: "Invalid payment option selected" })
});

const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  email: z.string().email("Invalid email format").trim().toLowerCase(),
  phone: z.string().min(7, "Phone number is too short").max(15, "Phone number is too long").trim(),
  street: z.string().min(5, "Street address must be at least 5 characters").trim(),
  city: z.string().min(2, "City name is required").trim(),
  state: z.string().min(2, "State name is required").trim(),
  country: z.string().min(2, "Country name is required").trim(),
  pinCode: z.string().min(3, "Zip/Postal code is required").trim(),
});

const itemSchema = z.object({
  variantId: objectIdSchema,
  quantity: z.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
});

// --- Controller Specific Validations ---

/**
 * Validate Live Calculation Requests
 * Used when the frontend asks for tax/total updates based on location/coupon/payment option
 */
export const calculateTotalsSchema = z.object({
  body: z.object({
    items: z.array(itemSchema).min(1, "Cart cannot be empty"),
    
    // FIX: Make location data optional on initial load so the subtotal can calculate
    country: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    
    // FIX: Declare identity fields so Zod doesn't strip them, allowing coupon limit checks to work
    guestEmail: z.string().email().optional().or(z.literal('')),
    deviceId: z.string().optional().or(z.literal('')),
    
    couponCode: z.string().trim().toUpperCase().optional().nullable(),
    paymentOption: paymentOptionEnum.optional().default('FULL_ONLINE'), 
    skipAutoApply: z.boolean().optional().default(false),
  }),
});

/**
 * Validate Create Order Requests
 * Used when the user clicks "Proceed to Payment"
 */
export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(itemSchema).min(1, "Cart cannot be empty"),
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    couponCode: z.string().trim().toUpperCase().optional().nullable(),
    paymentOption: paymentOptionEnum,
    guestEmail: z.string().email("Invalid guest email format").trim().toLowerCase().optional().nullable(),
    deviceId: z.string().min(10, "Device ID is required for security checks").optional().nullable(),
    skipAutoApply: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.deviceId && !data.guestEmail && !data.shippingAddress.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required for guest checkout",
        path: ["guestEmail"],
      });
    }
  }),
});

/**
 * Validate Razorpay Payment Verification
 */
export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string({ required_error: "Razorpay Order ID is required" }),
    razorpay_payment_id: z.string({ required_error: "Razorpay Payment ID is required" }),
    razorpay_signature: z.string({ required_error: "Razorpay Signature is required" }),
    db_order_id: objectIdSchema,
  }),
});