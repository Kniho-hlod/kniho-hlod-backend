import { ProjectPlugin, createExtractUser } from '@eleansphere/be-core';
import { registerUserRoutes } from './routes/users';
import { registerSystemNotificationRoutes } from './routes/system-notifications';

export const plugin: ProjectPlugin = {
  registerRoutes(app, _sequelize, models, _emailService, storage) {
    if (!storage) {
      throw new Error('plugin.registerRoutes requires AppConfig.storage to be configured');
    }
    const extractUser = createExtractUser(process.env.JWT_SECRET!);

    // password is stripped from /api/users responses by be-core itself now (>=1.10.0), via
    // kniho-hlod-service's userEntity `writeOnly: true` -> `sensitive: true` on the model
    // config. The manual toJSON patch that used to live here is gone — see be-core CHANGELOG
    // and @eleansphere/entity-core's writeOnly handling.
    // register/change-password used to be a custom route here — now be-core's createAuthRouter
    // itself mounts them (see index.ts's `auth.register`/`auth.changePassword`).
    // Avatar upload/download used to be a custom /api/profile-images route (BLOB in DB) — now
    // handled by be-core's generic /api/files service; registerUserRoutes attaches the avatar
    // File row to /api/users responses (see its `enrich`).
    registerUserRoutes(app, models['user'], extractUser, models['File'], storage);
    registerSystemNotificationRoutes(app, models['systemNotification'], extractUser);
  },
};
