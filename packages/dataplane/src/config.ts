import { z } from 'zod';

const envSchema = z.object({
  DATAPLANE_DB_URL: z.string().url(),
  DATAPLANE_DB_AUTH_TOKEN: z.string().optional(),
  DATAPLANE_DB_CONCURRENCY: z.number().default(20),
});

export type Env = z.infer<typeof envSchema>;

export const config = envSchema.parse(process.env);
