import { PoolClient } from 'pg';
import { pool } from '../../config/database';
import { ReadingRecord, TimeSlot } from './readings.types';

const READING_COLUMNS = `
  id,
  user_id,
  reading_date,
  time_slot,
  glucose_value,
  created_at,
  updated_at
`;

const SLOT_ORDER_SQL = `
  CASE time_slot
    WHEN 'MORNING_FASTING' THEN 1
    WHEN 'AFTER_BREAKFAST' THEN 2
    WHEN 'AFTER_LUNCH' THEN 3
    WHEN 'AFTER_DINNER' THEN 4
  END
`;

export const readingsRepository = {
  async lockUserForReadingMutation(
    client: PoolClient,
    userId: string
  ): Promise<void> {
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [
      userId,
    ]);
  },

  async countByUserAndDate(
    client: PoolClient,
    userId: string,
    readingDate: string,
    excludeReadingId?: string
  ): Promise<number> {
    const params: unknown[] = [userId, readingDate];
    let sql = `
      SELECT COUNT(*)::int AS total
      FROM readings
      WHERE user_id = $1 AND reading_date = $2
    `;
    if (excludeReadingId) {
      params.push(excludeReadingId);
      sql += ' AND id <> $3';
    }
    const result = await client.query<{ total: number }>(sql, params);
    return result.rows[0]?.total ?? 0;
  },

  async findByUserDateAndSlot(
    client: PoolClient,
    userId: string,
    readingDate: string,
    timeSlot: TimeSlot,
    excludeReadingId?: string
  ): Promise<ReadingRecord | null> {
    const params: unknown[] = [userId, readingDate, timeSlot];
    let sql = `
      SELECT ${READING_COLUMNS}
      FROM readings
      WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3
    `;
    if (excludeReadingId) {
      params.push(excludeReadingId);
      sql += ' AND id <> $4';
    }
    sql += ' LIMIT 1';
    const result = await client.query<ReadingRecord>(sql, params);
    return result.rows[0] ?? null;
  },

  async create(
    client: PoolClient,
    input: {
      userId: string;
      readingDate: string;
      timeSlot: TimeSlot;
      glucoseValue: number;
    }
  ): Promise<ReadingRecord> {
    const result = await client.query<ReadingRecord>(
      `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
       VALUES ($1, $2, $3, $4)
       RETURNING ${READING_COLUMNS}`,
      [input.userId, input.readingDate, input.timeSlot, input.glucoseValue]
    );
    return result.rows[0];
  },

  async findById(
    id: string,
    client?: PoolClient
  ): Promise<ReadingRecord | null> {
    const executor = client ?? pool;
    const result = await executor.query<ReadingRecord>(
      `SELECT ${READING_COLUMNS} FROM readings WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] ?? null;
  },

  async update(
    client: PoolClient,
    id: string,
    input: {
      readingDate: string;
      timeSlot: TimeSlot;
      glucoseValue: number;
    }
  ): Promise<ReadingRecord> {
    const result = await client.query<ReadingRecord>(
      `UPDATE readings
       SET reading_date = $1,
           time_slot = $2,
           glucose_value = $3
       WHERE id = $4
       RETURNING ${READING_COLUMNS}`,
      [input.readingDate, input.timeSlot, input.glucoseValue, id]
    );
    return result.rows[0];
  },

  async deleteById(id: string): Promise<void> {
    await pool.query('DELETE FROM readings WHERE id = $1', [id]);
  },

  async listByUser(input: {
    userId: string;
    page: number;
    limit: number;
    date?: string;
    from?: string;
    to?: string;
  }): Promise<{ readings: ReadingRecord[]; total: number }> {
    const conditions: string[] = ['user_id = $1'];
    const params: unknown[] = [input.userId];

    if (input.date) {
      params.push(input.date);
      conditions.push(`reading_date = $${params.length}`);
    }
    if (input.from) {
      params.push(input.from);
      conditions.push(`reading_date >= $${params.length}`);
    }
    if (input.to) {
      params.push(input.to);
      conditions.push(`reading_date <= $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    const countResult = await pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM readings WHERE ${whereClause}`,
      params
    );
    const total = countResult.rows[0]?.total ?? 0;

    const offset = (input.page - 1) * input.limit;
    const listParams = [...params, input.limit, offset];
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const listResult = await pool.query<ReadingRecord>(
      `SELECT ${READING_COLUMNS}
       FROM readings
       WHERE ${whereClause}
       ORDER BY reading_date DESC, ${SLOT_ORDER_SQL} ASC, created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listParams
    );

    return {
      readings: listResult.rows,
      total,
    };
  },
};

