import { withTransaction } from '../../config/database';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors';
import { readingsRepository } from './readings.repository';
import {
  CreateReadingInput,
  ListReadingsQuery,
  UpdateReadingInput,
} from './readings.schema';
import { formatDuplicateSlotError, ReadingRecord } from './readings.types';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertValidUuid(id: string): void {
  if (!UUID_REGEX.test(id)) {
    throw new BadRequestError('Invalid reading ID format.');
  }
}

export const readingsService = {
  async createReading(
    userId: string,
    input: CreateReadingInput
  ): Promise<ReadingRecord> {
    return withTransaction(async (client) => {
      await readingsRepository.lockUserForReadingMutation(client, userId);

      const dailyCount = await readingsRepository.countByUserAndDate(
        client,
        userId,
        input.reading_date
      );
      if (dailyCount >= 4) {
        throw new ConflictError('You can add only 4 readings per day.');
      }

      const duplicate = await readingsRepository.findByUserDateAndSlot(
        client,
        userId,
        input.reading_date,
        input.time_slot
      );
      if (duplicate) {
        throw new ConflictError(formatDuplicateSlotError(input.time_slot));
      }

      return readingsRepository.create(client, {
        userId,
        readingDate: input.reading_date,
        timeSlot: input.time_slot,
        glucoseValue: input.glucose_value,
      });
    });
  },

  async listReadings(userId: string, query: ListReadingsQuery) {
    const { readings, total } = await readingsRepository.listByUser({
      userId,
      page: query.page,
      limit: query.limit,
      date: query.date,
      from: query.from,
      to: query.to,
    });

    return {
      readings,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  },

  async getReadingById(
    userId: string,
    readingId: string
  ): Promise<ReadingRecord> {
    assertValidUuid(readingId);
    const reading = await readingsRepository.findById(readingId);
    if (!reading) {
      throw new NotFoundError('Reading not found.');
    }
    if (reading.user_id !== userId) {
      throw new ForbiddenError('You do not have access to this reading.');
    }
    return reading;
  },

  async updateReading(
    userId: string,
    readingId: string,
    input: UpdateReadingInput
  ): Promise<ReadingRecord> {
    assertValidUuid(readingId);

    return withTransaction(async (client) => {
      await readingsRepository.lockUserForReadingMutation(client, userId);

      const existing = await readingsRepository.findById(readingId, client);
      if (!existing) {
        throw new NotFoundError('Reading not found.');
      }
      if (existing.user_id !== userId) {
        throw new ForbiddenError('You do not have access to this reading.');
      }

      const nextDate = input.reading_date ?? existing.reading_date;
      const nextSlot = input.time_slot ?? existing.time_slot;
      const nextValue = input.glucose_value ?? existing.glucose_value;

      if (
        nextDate !== existing.reading_date ||
        nextSlot !== existing.time_slot
      ) {
        const dailyCount = await readingsRepository.countByUserAndDate(
          client,
          userId,
          nextDate,
          readingId
        );
        if (dailyCount >= 4) {
          throw new ConflictError('You can add only 4 readings per day.');
        }

        const duplicate = await readingsRepository.findByUserDateAndSlot(
          client,
          userId,
          nextDate,
          nextSlot,
          readingId
        );
        if (duplicate) {
          throw new ConflictError(formatDuplicateSlotError(nextSlot));
        }
      }

      return readingsRepository.update(client, readingId, {
        readingDate: nextDate,
        timeSlot: nextSlot,
        glucoseValue: nextValue,
      });
    });
  },

  async deleteReading(userId: string, readingId: string): Promise<void> {
    assertValidUuid(readingId);
    const existing = await readingsRepository.findById(readingId);
    if (!existing) {
      throw new NotFoundError('Reading not found.');
    }
    if (existing.user_id !== userId) {
      throw new ForbiddenError('You do not have access to this reading.');
    }
    await readingsRepository.deleteById(readingId);
  },
};

