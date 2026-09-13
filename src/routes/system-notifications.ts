// src/routes/system-notifications.ts
import { Application, RequestHandler } from 'express';
import { ModelStatic, Model } from 'sequelize';
import { createCrudRouter, generateId } from '@eleansphere/be-core';
import { makeRequestLogger } from '../middleware/request-logger';

export function registerSystemNotificationRoutes(
  app: Application,
  SystemNotificationModel: ModelStatic<Model>,
  extractUser: RequestHandler
): void {
  // Public GET /active is mounted by be-core itself (systemNotificationEntity's `activeRange` —
  // see kniho-hlod-service) even though this model is registered as `custom` below; no route
  // code needed for it here.

  // CRUD for admin — protected by JWT
  app.use('/api/system-notifications', extractUser);
  app.use(
    '/api/system-notifications',
    createCrudRouter({
      model: SystemNotificationModel,
      prefix: 'sn',
      generateId,
      log: true,
      middleware: [makeRequestLogger('/api/system-notifications')],
    })
  );
}
