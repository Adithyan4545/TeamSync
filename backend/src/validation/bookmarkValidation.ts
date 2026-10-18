import { z } from 'zod';

export const validateCreateBookmarkSchema = z.object({
  body: z.object({
    hackathonId: z.string().optional(),
    teamId: z.string().optional(),
  }).refine(data => data.hackathonId || data.teamId, {
    message: "Either hackathonId or teamId must be provided"
  }).refine(data => !(data.hackathonId && data.teamId), {
    message: "Provide either hackathonId or teamId, not both"
  })
});
