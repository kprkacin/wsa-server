import z from "zod";

export const userValidationSchema = z.object({
  name: z.string().min(1).max(20),
});
