import { pool } from '../config/database';
import { TimeSlot } from '../modules/readings/readings.types';
import { hashPassword } from '../utils/auth';
import {
  formatLocalDate,
  getPreviousMonthRange,
  getTodayDateString,
} from '../utils/dates';
import { runMigrations } from './migrate';

interface SeedReading {
  reading_date: string;
  time_slot: TimeSlot;
  glucose_value: number;
}

function daysAgo(baseDateStr: string, offsetDays: number): string {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - offsetDays);
  return formatLocalDate(date);
}

async function seed() {
  await runMigrations(pool);

  const demoEmail = 'demo@example.com';
  const demoPassword = 'DemoUser123!';
  const passwordHash = await hashPassword(demoPassword);

  const existing = await pool.query<{ id: string }>(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    [demoEmail]
  );

  let userId: string;
  if (existing.rows[0]) {
    userId = existing.rows[0].id;
    await pool.query(
      'UPDATE users SET name = $1, password = $2 WHERE id = $3',
      ['Demo User', passwordHash, userId]
    );
    await pool.query('DELETE FROM readings WHERE user_id = $1', [userId]);
  } else {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['Demo User', demoEmail, passwordHash]
    );
    userId = inserted.rows[0].id;
  }

  const today = getTodayDateString();
  const [yearStr, monthStr] = today.split('-');
  const currentMonthPrefix = `${yearStr}-${monthStr}`;
  const prevMonthRange = getPreviousMonthRange(today);
  const prevMonthPrefix = prevMonthRange.startDate.slice(0, 7);

  const sampleReadings: SeedReading[] = [
    // Today (3 readings so user can also try adding the 4th slot!)
    { reading_date: today, time_slot: 'MORNING_FASTING', glucose_value: 96 },
    { reading_date: today, time_slot: 'AFTER_BREAKFAST', glucose_value: 132 },
    { reading_date: today, time_slot: 'AFTER_LUNCH', glucose_value: 141 },
  ];

  // Add past days in current month without generating future dates
  const currentDayNum = Number(today.split('-')[2]);
  const recentOffsets = [1, 2, 4, 6, 8];
  const recentTemplates: Array<Array<[TimeSlot, number]>> = [
    [
      ['MORNING_FASTING', 94],
      ['AFTER_BREAKFAST', 128],
      ['AFTER_LUNCH', 138],
      ['AFTER_DINNER', 124],
    ],
    [
      ['MORNING_FASTING', 101],
      ['AFTER_BREAKFAST', 139],
      ['AFTER_LUNCH', 148],
      ['AFTER_DINNER', 131],
    ],
    [
      ['MORNING_FASTING', 91],
      ['AFTER_LUNCH', 134],
      ['AFTER_DINNER', 122],
    ],
    [
      ['MORNING_FASTING', 98],
      ['AFTER_BREAKFAST', 135],
      ['AFTER_DINNER', 129],
    ],
    [
      ['MORNING_FASTING', 93],
      ['AFTER_BREAKFAST', 126],
      ['AFTER_LUNCH', 136],
      ['AFTER_DINNER', 119],
    ],
  ];

  recentOffsets.forEach((offset, idx) => {
    const d = daysAgo(today, offset);
    if (d.startsWith(currentMonthPrefix) && Number(d.split('-')[2]) < currentDayNum) {
      for (const [slot, val] of recentTemplates[idx]) {
        sampleReadings.push({
          reading_date: d,
          time_slot: slot,
          glucose_value: val,
        });
      }
    }
  });

  // Always include 1st of current month if today > 1st
  if (currentDayNum > 1) {
    const firstOfMonth = `${currentMonthPrefix}-01`;
    if (!sampleReadings.some((r) => r.reading_date === firstOfMonth)) {
      sampleReadings.push(
        { reading_date: firstOfMonth, time_slot: 'MORNING_FASTING', glucose_value: 95 },
        { reading_date: firstOfMonth, time_slot: 'AFTER_LUNCH', glucose_value: 142 }
      );
    }
  }

  // Previous calendar month sample readings
  const prevMonthDays: Array<{ day: string; entries: Array<[TimeSlot, number]> }> = [
    {
      day: '03',
      entries: [
        ['MORNING_FASTING', 104],
        ['AFTER_BREAKFAST', 146],
        ['AFTER_LUNCH', 155],
        ['AFTER_DINNER', 136],
      ],
    },
    {
      day: '09',
      entries: [
        ['MORNING_FASTING', 99],
        ['AFTER_BREAKFAST', 134],
        ['AFTER_LUNCH', 144],
        ['AFTER_DINNER', 127],
      ],
    },
    {
      day: '15',
      entries: [
        ['MORNING_FASTING', 92],
        ['AFTER_BREAKFAST', 129],
        ['AFTER_LUNCH', 137],
      ],
    },
    {
      day: '21',
      entries: [
        ['MORNING_FASTING', 97],
        ['AFTER_LUNCH', 149],
        ['AFTER_DINNER', 133],
      ],
    },
    {
      day: '27',
      entries: [
        ['MORNING_FASTING', 90],
        ['AFTER_BREAKFAST', 124],
        ['AFTER_LUNCH', 131],
        ['AFTER_DINNER', 118],
      ],
    },
  ];

  for (const item of prevMonthDays) {
    const dateStr = `${prevMonthPrefix}-${item.day}`;
    for (const [slot, val] of item.entries) {
      sampleReadings.push({
        reading_date: dateStr,
        time_slot: slot,
        glucose_value: val,
      });
    }
  }

  for (const r of sampleReadings) {
    await pool.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, reading_date, time_slot) DO UPDATE
         SET glucose_value = EXCLUDED.glucose_value`,
      [userId, r.reading_date, r.time_slot, r.glucose_value]
    );
  }

  console.log(
    `Seeded demo user (${demoEmail} / ${demoPassword}) with ${sampleReadings.length} readings.`
  );
}

seed()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await pool.end();
    process.exit(1);
  });

