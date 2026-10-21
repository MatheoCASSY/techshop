import { z } from 'zod';

export const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(1000),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const reviewSchema = z.object({
  id: z.string(),
  rating: z.number().int(),
  comment: z.string(),
  authorName: z.string(),
  createdAt: z.string(),
});
export type Review = z.infer<typeof reviewSchema>;
