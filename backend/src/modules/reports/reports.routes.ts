import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validateQuery } from '../../middleware/validate';
import { reportsController } from './reports.controller';
import { reportDateQuerySchema } from './reports.schema';

export const reportsRouter = Router();

reportsRouter.use(authenticate);

reportsRouter.get(
  '/daily',
  validateQuery(reportDateQuerySchema),
  reportsController.daily
);
reportsRouter.get(
  '/month-to-date',
  validateQuery(reportDateQuerySchema),
  reportsController.monthToDate
);
reportsRouter.get(
  '/monthly',
  validateQuery(reportDateQuerySchema),
  reportsController.monthly
);

