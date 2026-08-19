import './config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { mw } from 'request-ip';
import morgan from 'morgan';
import path from 'path';
import { IS_PRODUCTION, PORT } from '@common/constants';
import { authRouter } from '@auth/routes';
import { csrfRouter } from '@csrf/routes';
import { doubleCsrfProtection } from '@csrf/middlewares';
import { permissionsRouter } from '@permissions/routes';
import { mailListener } from '@mail';
import { useSwagger } from '@swagger';
import { errorHandler } from '@common/middlewares';
import { i18n } from '@common/locales';
import { usersRouter } from '@user/routes';
import { companyRouter } from '@company/routes';
import { chatRouter, mesiboApiRouter, mesiboRouter } from '@mesibo';
import { questionsRouter } from '@questions/routes';
import { aiRouter } from '@ai/routes';
import { reviewsRouter } from '@rating';
import { traficBanRouter } from '@parser';
import { cadenceRouter } from '@cadence';
import { adminRouter } from '@admin/routes';
import { infoRouter } from '@info';
import { pointInstructionRouter } from '@point-instruction';

BigInt.prototype['toJSON'] = function () {
  return this.toString();
};

const bootstrap = async () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGINS.split(','),
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(helmet());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.contentSecurityPolicy());
  if (IS_PRODUCTION) {
    app.use(doubleCsrfProtection);
  }

  app.use(i18n.init);

  app.use(mw());
  app.use(morgan('combined'));

  const adminDist = path.join(process.cwd(), 'admin/dist');
  app.use('/admin', express.static(adminDist));
  app.get(/^\/admin(?:\/.*)?$/, (req, res, next) => {
    if (path.extname(req.path)) return next();
    res.sendFile(path.join(adminDist, 'index.html'));
  });

  app.use('/api/auth', authRouter);
  app.use('/api/csrf', csrfRouter);
  app.use('/api/permissions', permissionsRouter);

  useSwagger('/api/docs', app);

  app.use('/api/users', usersRouter);
  app.use('/api/company', companyRouter);
  app.use('/api/mesibo', mesiboRouter);
  app.use('/api/mesibo-api', mesiboApiRouter);
  app.use('/api/questions', questionsRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/chats', chatRouter);
  app.use('/api/trafic-ban', traficBanRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/cadences', cadenceRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/info', infoRouter);
  app.use('/api/points', pointInstructionRouter);

  app.use(errorHandler);

  app.listen(PORT, () => {
    mailListener.initialize();
    console.log(`Server started on PORT: ${PORT}`);
  });
};

bootstrap()
  .then(() => console.log('App initialized'))
  .catch((e) => console.error(e));
