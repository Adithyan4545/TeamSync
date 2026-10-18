import { z } from 'zod';

export const validateCreateJoinRequestSchema = z.object({
  body: z.object({
    teamId: z.string().min(1, "Team ID is required"),
    message: z.string().max(500, "Message is too long").optional(),
  })
});
