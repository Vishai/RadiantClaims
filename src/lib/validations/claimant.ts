import { z } from "zod";

export const claimantSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dob: z.string().min(1, "Date of birth is required"), // ISO date string
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  county: z.string().min(1, "County is required"),
  state: z.string().length(2, "State must be 2 characters"),
  postalCode: z.string().min(5, "Postal code must be at least 5 characters"),
  referralCode: z.string().optional(),
});

export type ClaimantFormData = z.infer<typeof claimantSchema>;
