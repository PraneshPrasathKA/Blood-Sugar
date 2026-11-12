import {
  comparePassword,
  hashPassword,
  signAccessToken,
} from '../../utils/auth';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/errors';
import { usersRepository } from '../users/users.repository';
import { PublicUser } from '../users/users.types';
import { LoginInput, RegisterInput } from './auth.schema';

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await usersRepository.findByEmailWithPassword(
      input.email
    );
    if (existingUser) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await usersRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return { user, token };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const userRecord = await usersRepository.findByEmailWithPassword(
      input.email
    );
    if (!userRecord) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isValidPassword = await comparePassword(
      input.password,
      userRecord.password
    );
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const user: PublicUser = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      created_at: userRecord.created_at,
      updated_at: userRecord.updated_at,
    };

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return { user, token };
  },

  async getMe(userId: string): Promise<PublicUser> {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    return user;
  },
};

