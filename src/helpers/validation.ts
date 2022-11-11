import z from "zod";

export const userValidationSchema = z.object({
  name: z.string().min(1).max(20),
  password: z.string().min(1),
  email: z.string().min(1),
});

export const guestValidationSchema = z.object({
  name: z.string().min(1).max(20),
});

export const loginValidationSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});
