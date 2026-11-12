import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validateBody, validateQuery } from '../../middleware/validate';
import { readingsController } from './readings.controller';
import {
  createReadingSchema,
  listReadingsQuerySchema,
  updateReadingSchema,
} from './readings.schema';

export const readingsRouter = Router();

readingsRouter.use(authenticate);

readingsRouter.post(
  '/',
  validateBody(createReadingSchema),
  readingsController.create
);
readingsRouter.get(
  '/',
  validateQuery(listReadingsQuerySchema),
  readingsController.list
);
readingsRouter.get('/:id', readingsController.getOne);
readingsRouter.patch(
  '/:id',
  validateBody(updateReadingSchema),
  readingsController.update
);
readingsRouter.delete('/:id', readingsController.remove);

