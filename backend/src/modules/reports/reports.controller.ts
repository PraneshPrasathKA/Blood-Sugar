import { NextFunction, Request, Response } from 'express';
import { ReportDateQuery } from './reports.schema';
import { reportsService } from './reports.service';

export const reportsController = {
  async daily(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date } = req.query as unknown as ReportDateQuery;
      const report = await reportsService.getDailyReport(req.user!.id, date);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },

  async monthToDate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { date } = req.query as unknown as ReportDateQuery;
      const report = await reportsService.getMonthToDateReport(
        req.user!.id,
        date
      );
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },

  async monthly(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { date } = req.query as unknown as ReportDateQuery;
      const report = await reportsService.getMonthlyReport(req.user!.id, date);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },
};

