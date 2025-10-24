// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.SCHEDULER_MODE = 'embed'
process.env.BUSINESS_TIMEZONE = 'America/Toronto'
process.env.BUFFER_MINUTES = '15'
process.env.BOOKING_MIN_NOTICE_HOURS = '24'
process.env.CAL_VENDOR = 'calcom'
process.env.CAL_EVENT_TYPE_SLUG = 'tripman/birthday-ride'
process.env.CAL_WEBHOOK_SECRET = 'test-webhook-secret'
process.env.RESEND_API_KEY = 'test-resend-key'
process.env.GOOGLE_CALENDAR_ID = 'test-calendar-id'
process.env.GOOGLE_CLIENT_EMAIL = 'test@example.com'
process.env.GOOGLE_PRIVATE_KEY = 'test-private-key'
process.env.ADMIN_EMAIL = 'admin@test.com'
process.env.ADMIN_PASSWORD = 'test-password'
process.env.NEXT_PUBLIC_GA4_ID = 'G-TEST123'

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  })),
}))

// Mock Google APIs
jest.mock('googleapis', () => ({
  google: {
    calendar: jest.fn(() => ({
      freebusy: {
        query: jest.fn().mockResolvedValue({
          data: {
            calendars: {
              'test-calendar-id': {
                busy: [],
              },
            },
          },
        }),
      },
      events: {
        insert: jest.fn().mockResolvedValue({
          data: { id: 'test-event-id' },
        }),
        delete: jest.fn().mockResolvedValue({}),
      },
    })),
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({
        getClient: jest.fn().mockResolvedValue({
          request: jest.fn().mockResolvedValue({}),
        }),
      })),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}))

// Mock Prisma - will be handled in individual test files
