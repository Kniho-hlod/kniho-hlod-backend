import dotenv from 'dotenv';
dotenv.config();

import { createApp } from '@eleansphere/be-core';
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
  plugins: [plugin],
  auth: { modelName: 'user' },
});
