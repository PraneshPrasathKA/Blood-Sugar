import { pool } from '../../config/database';
import { PublicUser, UserRecord } from './users.types';

export const usersRepository = {
  async findByEmailWithPassword(email: string): Promise<UserRecord | null> {
    const result = await pool.query<UserRecord>(
      `SELECT id, name, email, password, created_at, updated_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );
    return result.rows[0] ?? null;
  },

  async findById(id: string): Promise<PublicUser | null> {
    const result = await pool.query<PublicUser>(
      `SELECT id, name, email, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    return result.rows[0] ?? null;
  },

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<PublicUser> {
    const result = await pool.query<PublicUser>(
      `INSERT INTO users (name, email, password)
       VALUES ($1, LOWER($2), $3)
       RETURNING id, name, email, created_at, updated_at`,
      [input.name.trim(), input.email.trim(), input.passwordHash]
    );
    return result.rows[0];
  },
};

