import { ProjectPlugin, createExtractUser } from '@eleansphere/be-core';
import { registerAuthRoutes } from './routes/auth';
import { registerUserRoutes } from './routes/users';
import { registerSystemNotificationRoutes } from './routes/system-notifications';
import { registerProfileImageRoutes } from './routes/profile-images';

export const plugin: ProjectPlugin = {
  registerRoutes(app, _sequelize, models) {
    const extractUser = createExtractUser(process.env.JWT_SECRET!);

    // Hotfix: GET/POST/PUT /api/users otherwise returns the bcrypt password hash to any
    // authenticated user (be-core's `sensitive` field-stripping exists in be-core's source
    // but isn't published yet, and kniho-hlod-service's `password.sensitive: true` is a
    // no-op against the currently installed be-core version). Remove once be-core ships
    // `sensitive` support for real and this repo updates to that version.
    const originalUserToJSON = models['user'].prototype.toJSON;
    models['user'].prototype.toJSON = function (this: any) {
      const values = originalUserToJSON.call(this) as Record<string, unknown>;
      delete values.password;
      return values;
    };

    registerAuthRoutes(app, models['user'], extractUser);
    registerUserRoutes(app, models['user'], extractUser);
    registerSystemNotificationRoutes(app, models['systemNotification'], extractUser);
    registerProfileImageRoutes(app, models['profileImage'], extractUser);
  },
};
