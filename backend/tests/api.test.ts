import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/config/database';
import { runMigrations } from '../src/database/migrate';
import { formatLocalDate, getTodayDateString } from '../src/utils/dates';

const app = createApp();
const runId = Date.now();
const userAEmail = `test-usera-${runId}@sweety.test`;
const userBEmail = `test-userb-${runId}@sweety.test`;

function getPastDate(daysBack: number): string {
  const today = new Date();
  today.setDate(today.getDate() - daysBack);
  return formatLocalDate(today);
}

function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatLocalDate(tomorrow);
}

describe('Sweety API Integration Tests', () => {
  let userAToken = '';
  let userBToken = '';
  let createdReadingId = '';

  beforeAll(async () => {
    await runMigrations(pool);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE 'test-%@sweety.test'");
    await pool.end();
  });

  describe('Authentication', () => {
    it('registers a new user and hashes password in PostgreSQL', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alice Patient',
        email: userAEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.user.email).toBe(userAEmail);
      expect(res.body.data.user.password).toBeUndefined();

      userAToken = res.body.data.token;

      const dbUser = await pool.query(
        'SELECT password FROM users WHERE email = $1',
        [userAEmail]
      );
      expect(dbUser.rows[0].password).not.toBe('Password123!');
      expect(dbUser.rows[0].password.startsWith('$2')).toBe(true);
    });

    it('rejects duplicate email registration', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alice Duplicate',
        email: userAEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('logs in with valid credentials and rejects invalid password', async () => {
      const badRes = await request(app).post('/api/auth/login').send({
        email: userAEmail,
        password: 'WrongPassword!',
      });
      expect(badRes.status).toBe(401);

      const goodRes = await request(app).post('/api/auth/login').send({
        email: userAEmail,
        password: 'Password123!',
      });
      expect(goodRes.status).toBe(200);
      expect(goodRes.body.data.token).toBeTruthy();
      userAToken = goodRes.body.data.token;
    });

    it('rejects unauthorized requests and returns profile on /me', async () => {
      const noTokenRes = await request(app).get('/api/auth/me');
      expect(noTokenRes.status).toBe(401);

      const badTokenRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token');
      expect(badTokenRes.status).toBe(401);

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe(userAEmail);
    });
  });

  describe('Readings CRUD and Business Validation', () => {
    const today = getTodayDateString();
    const yesterday = getPastDate(1);

    it('creates a valid reading', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          reading_date: today,
          time_slot: 'AFTER_LUNCH',
          glucose_value: 145,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.reading.glucose_value).toBe(145);
      expect(res.body.data.reading.reading_date).toBe(today);
      createdReadingId = res.body.data.reading.id;
    });

    it('validates missing glucose value', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          reading_date: today,
          time_slot: 'MORNING_FASTING',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Please enter a glucose value.');
    });

    it('validates glucose value below 40, above 600, and decimals', async () => {
      for (const badValue of [39, 601, 110.5]) {
        const res = await request(app)
          .post('/api/readings')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            reading_date: today,
            time_slot: 'MORNING_FASTING',
            glucose_value: badValue,
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Value must be between 40 and 600 mg/dl.');
      }
    });

    it('rejects future dates', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          reading_date: getTomorrowDate(),
          time_slot: 'MORNING_FASTING',
          glucose_value: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Date cannot be in the future.');
    });

    it('rejects duplicate slot on the same day with exact error message', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          reading_date: today,
          time_slot: 'AFTER_LUNCH',
          glucose_value: 130,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe(
        'You already have an After lunch reading for this date.'
      );
    });

    it('enforces maximum 4 readings per day and allows updating an existing reading on a full day', async () => {
      const slots = ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_DINNER'];
      for (const slot of slots) {
        const res = await request(app)
          .post('/api/readings')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            reading_date: today,
            time_slot: slot,
            glucose_value: 120,
          });
        expect(res.status).toBe(201);
      }

      // Attempt 5th reading on the same day
      const fifthRes = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          reading_date: today,
          time_slot: 'MORNING_FASTING',
          glucose_value: 110,
        });
      expect(fifthRes.status).toBe(409);
      expect(fifthRes.body.message).toBe('You can add only 4 readings per day.');

      // Update an existing reading on that 4-reading day (should succeed!)
      const updateRes = await request(app)
        .patch(`/api/readings/${createdReadingId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          glucose_value: 150,
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.reading.glucose_value).toBe(150);
    });

    it('enforces user authorization and ownership across users', async () => {
      const userBRes = await request(app).post('/api/auth/register').send({
        name: 'Bob Other',
        email: userBEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
      expect(userBRes.status).toBe(201);
      userBToken = userBRes.body.data.token;

      // User B cannot view, update, or delete User A's reading
      const getOther = await request(app)
        .get(`/api/readings/${createdReadingId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(getOther.status).toBe(403);

      const patchOther = await request(app)
        .patch(`/api/readings/${createdReadingId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ glucose_value: 100 });
      expect(patchOther.status).toBe(403);

      const deleteOther = await request(app)
        .delete(`/api/readings/${createdReadingId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(deleteOther.status).toBe(403);

      // User B sees 0 readings in their own list
      const listB = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(listB.status).toBe(200);
      expect(listB.body.data.readings).toHaveLength(0);
    });

    it('deletes a reading owned by the user', async () => {
      const tempRes = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          reading_date: yesterday,
          time_slot: 'MORNING_FASTING',
          glucose_value: 95,
        });
      expect(tempRes.status).toBe(201);

      const tempId = tempRes.body.data.reading.id;
      const delRes = await request(app)
        .delete(`/api/readings/${tempId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(delRes.status).toBe(200);

      const checkRes = await request(app)
        .get(`/api/readings/${tempId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(checkRes.status).toBe(404);
    });
  });

  describe('Reporting Calculations', () => {
    it('computes highest, lowest, average (1 decimal), count, and handles empty states', async () => {
      // User B adds 3 readings on 2025-05-10 and 2 readings on 2025-04-20
      const mayDate = '2025-05-10';
      const aprilDate = '2025-04-20';

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ reading_date: mayDate, time_slot: 'MORNING_FASTING', glucose_value: 100 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ reading_date: mayDate, time_slot: 'AFTER_BREAKFAST', glucose_value: 115 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ reading_date: mayDate, time_slot: 'AFTER_LUNCH', glucose_value: 123 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ reading_date: aprilDate, time_slot: 'MORNING_FASTING', glucose_value: 88 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ reading_date: aprilDate, time_slot: 'AFTER_DINNER', glucose_value: 162 });

      // Daily report on 2025-05-10: (100 + 115 + 123) / 3 = 112.666... -> 112.7
      const dailyRes = await request(app)
        .get(`/api/reports/daily?date=${mayDate}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(dailyRes.status).toBe(200);
      expect(dailyRes.body.data.summary).toEqual({
        count: 3,
        highest: 123,
        lowest: 100,
        average: 112.7,
      });
      expect(dailyRes.body.data.readings).toHaveLength(3);

      // Month-to-date on 2025-05-10
      const mtdRes = await request(app)
        .get(`/api/reports/month-to-date?date=${mayDate}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(mtdRes.status).toBe(200);
      expect(mtdRes.body.data.range).toEqual({
        startDate: '2025-05-01',
        endDate: '2025-05-10',
      });
      expect(mtdRes.body.data.summary).toEqual({
        count: 3,
        highest: 123,
        lowest: 100,
        average: 112.7,
      });

      // Previous month (April 2025) when selected date is 2025-05-10
      const monthlyRes = await request(app)
        .get(`/api/reports/monthly?date=${mayDate}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(monthlyRes.status).toBe(200);
      expect(monthlyRes.body.data.range).toEqual({
        startDate: '2025-04-01',
        endDate: '2025-04-30',
      });
      expect(monthlyRes.body.data.summary).toEqual({
        count: 2,
        highest: 162,
        lowest: 88,
        average: 125,
      });

      // Empty state date
      const emptyRes = await request(app)
        .get('/api/reports/daily?date=2024-01-01')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(emptyRes.status).toBe(200);
      expect(emptyRes.body.data.summary).toEqual({
        count: 0,
        highest: null,
        lowest: null,
        average: null,
      });
      expect(emptyRes.body.data.readings).toEqual([]);
    });
  });
});

