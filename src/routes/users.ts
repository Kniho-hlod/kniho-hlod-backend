// src/routes/users.ts
import { Application, RequestHandler } from 'express';
import { ModelStatic } from 'sequelize';
import { createCrudRouter, generateId, HttpError, attachFiles, StorageAdapter } from '@eleansphere/be-core';
import { logger } from '../logger';
import { makeRequestLogger } from '../middleware/request-logger';

export function registerUserRoutes(
  app: Application,
  // `ModelStatic<any>`, not `ModelStatic<Model>` — `attachFiles`'s `WithId` constraint needs `id`
  // on the row type, which the bare `Model` base class doesn't statically have (klotilda-api's
  // plugins get this for free since their `models` param is already `ModelStatic<any>`).
  UserModel: ModelStatic<any>,
  extractUser: RequestHandler,
  FileModel: ModelStatic<any>,
  storage: StorageAdapter
): void {
  app.use(
    '/api/users',
    extractUser,
    createCrudRouter({
      model: UserModel,
      prefix: 'u',
      generateId,
      log: true,
      middleware: [makeRequestLogger('/api/users')],
      // password hashing is now generic — be-core hashes any field the model config marks
      // `hash: 'bcrypt'` (see kniho-hlod-service's user entity), skipping values that already
      // look like a bcrypt hash so an unchanged password on update isn't re-hashed.
      hashFields: ['password'],
      // Avatar is a File row (be-core's detached file service), not a column on `user` — attach
      // it the same way klotilda-api attaches product images. `avatar` comes back as a (0 or 1
      // item) array; upload/replace/delete goes through POST/DELETE /api/files with
      // refType=user&refId=<id>&role=avatar.
      enrich: (rows) => attachFiles(FileModel, storage, 'user', rows, { role: 'avatar', as: 'avatar' }),
      hooks: {
        beforeCreate: async (data) => {
          if (!data.username || !data.email || !data.password || !data.role) {
            logger.warn('User creation rejected: missing required fields');
            throw new HttpError(400, 'All fields are required');
          }
          const existing = await UserModel.findOne({ where: { email: data.email } });
          if (existing) {
            logger.warn({ email: data.email }, 'User creation rejected: email already exists');
            throw new HttpError(409, 'A user with this email already exists');
          }
          return data;
        },
      },
    })
  );
}
