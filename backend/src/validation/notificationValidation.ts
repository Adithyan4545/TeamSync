import { z } from 'zod';

export const validateUpdateNotificationSchema = z.object({
  body: z.object({
    read: z.boolean(),
  })
});
