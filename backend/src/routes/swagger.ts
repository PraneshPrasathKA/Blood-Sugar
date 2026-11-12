import { OpenAPIV3 } from 'openapi-types';
import { env } from '../config/env';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Sweety Blood Glucose Tracker API',
    version: '1.0.0',
    description:
      'REST API for tracking daily blood glucose readings (up to 4 slots per day) and generating daily, month-to-date, and previous-month reports.',
  },
  servers: [
    {
      url: `http://localhost:${env.port}/api`,
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      TimeSlot: {
        type: 'string',
        enum: [
          'MORNING_FASTING',
          'AFTER_BREAKFAST',
          'AFTER_LUNCH',
          'AFTER_DINNER',
        ],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Demo User' },
          email: { type: 'string', format: 'email', example: 'demo@example.com' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Reading: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          reading_date: { type: 'string', format: 'date', example: '2026-11-12' },
          time_slot: { $ref: '#/components/schemas/TimeSlot' },
          glucose_value: { type: 'integer', minimum: 40, maximum: 600, example: 118 },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      ReportSummary: {
        type: 'object',
        properties: {
          highest: { type: 'integer', nullable: true, example: 168 },
          lowest: { type: 'integer', nullable: true, example: 92 },
          average: { type: 'number', nullable: true, example: 124.5 },
          count: { type: 'integer', example: 12 },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Value must be between 40 and 600 mg/dl.' },
          errors: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'API and database health check',
        responses: {
          '200': { description: 'Service is healthy' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'confirmPassword'],
                properties: {
                  name: { type: 'string', example: 'Demo User' },
                  email: { type: 'string', format: 'email', example: 'demo@example.com' },
                  password: { type: 'string', minLength: 6, example: 'DemoUser123!' },
                  confirmPassword: { type: 'string', example: 'DemoUser123!' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User registered and JWT issued' },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'demo@example.com' },
                  password: { type: 'string', example: 'DemoUser123!' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Log out current session',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Authenticated user profile' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/readings': {
      get: {
        tags: ['Readings'],
        summary: 'List authenticated user readings with pagination and optional date filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Paginated list of readings' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Readings'],
        summary: 'Create a blood glucose reading',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reading_date', 'time_slot', 'glucose_value'],
                properties: {
                  reading_date: { type: 'string', format: 'date', example: '2026-11-12' },
                  time_slot: { $ref: '#/components/schemas/TimeSlot' },
                  glucose_value: { type: 'integer', minimum: 40, maximum: 600, example: 112 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Reading created' },
          '400': { description: 'Validation error (missing value, out of range, future date)' },
          '401': { description: 'Unauthorized' },
          '409': { description: 'Duplicate slot or daily 4-reading limit exceeded' },
        },
      },
    },
    '/readings/{id}': {
      get: {
        tags: ['Readings'],
        summary: 'Get a single reading by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Reading details' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
        },
      },
      patch: {
        tags: ['Readings'],
        summary: 'Update an existing reading',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reading_date: { type: 'string', format: 'date' },
                  time_slot: { $ref: '#/components/schemas/TimeSlot' },
                  glucose_value: { type: 'integer', minimum: 40, maximum: 600 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Reading updated' },
          '400': { description: 'Validation error' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
          '409': { description: 'Duplicate slot or daily limit conflict' },
        },
      },
      delete: {
        tags: ['Readings'],
        summary: 'Delete a reading',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Reading deleted' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/reports/daily': {
      get: {
        tags: ['Reports'],
        summary: 'Get daily glucose summary and readings for a selected date',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date', example: '2026-11-12' } },
        ],
        responses: {
          '200': { description: 'Daily report summary and readings' },
          '400': { description: 'Invalid date' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/reports/month-to-date': {
      get: {
        tags: ['Reports'],
        summary: 'Get month-to-date glucose summary (1st of month through selected date)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date', example: '2026-11-12' } },
        ],
        responses: {
          '200': { description: 'Month-to-date report summary and daily series' },
          '400': { description: 'Invalid date' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/reports/monthly': {
      get: {
        tags: ['Reports'],
        summary: 'Get previous calendar month glucose summary',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date', example: '2026-11-12' } },
        ],
        responses: {
          '200': { description: 'Previous month report summary and daily series' },
          '400': { description: 'Invalid date' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
};

