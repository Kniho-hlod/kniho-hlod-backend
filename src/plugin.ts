import { ProjectPlugin, createExtractUser } from '@eleansphere/be-core';
import { registerAuthRoutes } from './routes/auth';
import { registerUserRoutes } from './routes/users';
import { registerSystemNotificationRoutes } from './routes/system-notifications';
import { registerProfileImageRoutes } from './routes/profile-images';

export const plugin: ProjectPlugin = {
  registerRoutes(app, _sequelize, models) {
    const extractUser = createExtractUser(process.env.JWT_SECRET!);

    // password is stripped from /api/users responses by be-core itself now (>=1.10.0), via
    // kniho-hlod-service's userEntity `writeOnly: true` -> `sensitive: true` on the model
    // config. The manual toJSON patch that used to live here is gone — see be-core CHANGELOG
    // and @eleansphere/entity-core's writeOnly handling.
    registerAuthRoutes(app, models['user'], extractUser);
    registerUserRoutes(app, models['user'], extractUser);
    registerSystemNotificationRoutes(app, models['systemNotification'], extractUser);
    registerProfileImageRoutes(app, models['profileImage'], extractUser);
  },
};
