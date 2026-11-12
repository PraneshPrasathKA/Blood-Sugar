import { Router } from 'express';
import { pool } from '../config/database';
import { authRouter } from '../modules/auth/auth.routes';
import { readingsRouter } from '../modules/readings/readings.routes';
import { reportsRouter } from '../modules/reports/reports.routes';

export const apiRouter = Router();

apiRouter.get('/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      success: true,
      status: 'ok',
      database: 'connected',
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/readings', readingsRouter);
apiRouter.use('/reports', reportsRouter);

