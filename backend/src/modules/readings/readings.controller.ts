import { NextFunction, Request, Response } from 'express';
import { ListReadingsQuery } from './readings.schema';
import { readingsService } from './readings.service';

export const readingsController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reading = await readingsService.createReading(
        req.user!.id,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Reading added successfully.',
        data: { reading },
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListReadingsQuery;
      const result = await readingsService.listReadings(req.user!.id, query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reading = await readingsService.getReadingById(
        req.user!.id,
        String(req.params.id)
      );
      res.status(200).json({
        success: true,
        data: { reading },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reading = await readingsService.updateReading(
        req.user!.id,
        String(req.params.id),
        req.body
      );
      res.status(200).json({
        success: true,
        message: 'Reading updated successfully.',
        data: { reading },
      });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await readingsService.deleteReading(req.user!.id, String(req.params.id));
      res.status(200).json({
        success: true,
        message: 'Reading deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
};
