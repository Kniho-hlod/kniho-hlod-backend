import dotenv from 'dotenv';
dotenv.config();

import { createApp, createExtractUser } from '@eleansphere/be-core';
import { toModelConfigs } from '@eleansphere/entity-core';
import { allEntities } from '@kniho-hlod/kniho-hlod-service';
import { plugin } from './plugin';
import { makeRequestLogger } from './middleware/request-logger';

createApp({
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  middleware: [makeRequestLogger('')],
  // `user` and `systemNotification` have their own plugin routes (bcrypt hooks / public GET
  // /active), so they're registered as models but their CRUD routes aren't auto-mounted.
  modelConfigs: toModelConfigs(allEntities, { custom: ['user', 'systemNotification'] }),
  // Avatar bytes live in an S3-compatible bucket (Cloudflare R2), same as klotilda-api's product
  // images; Postgres keeps only File metadata rows. Replaces the old BLOB-in-DB profileImage
  // entity — existing avatars were dropped, users re-upload. Uploads (POST/DELETE /api/files)
  // require a JWT; GET stays public (browser <img> tags can't send an Authorization header).
  storage: {
    s3: {
      endpoint: process.env.R2_ENDPOINT!,
      bucket: process.env.R2_BUCKET!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
    },
    writeMiddleware: [createExtractUser(process.env.JWT_SECRET!)],
  },
  plugins: [plugin],
  auth: {
    modelName: 'user',
    // Replaces the old custom routes/auth.ts — same behavior (username/email/password required,
    // role defaults to 'user', duplicate email -> 409), now owned by be-core.
    register: {
      idPrefix: 'u',
      requiredFields: ['username'],
      extraFields: ['username'],
      defaults: { role: 'user' },
    },
    changePassword: true,
  },
});
