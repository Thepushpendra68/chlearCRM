const { jest } = require('@jest/globals');

// Global test setup
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.JWT_SECRET = 'test-jwt-secret';

// Suppress console logs during tests unless in debug mode
if (!process.env.DEBUG_TESTS) {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}

// Mock Supabase client
jest.mock('../src/config/supabase', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: {}, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: {}, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: {}, error: null }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: {}, error: null }))
      }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: {} }, error: null }))
    }
  }))
}));

// Mock Google Gemini AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => Promise.resolve('Generated content')
        }
      })
    })
  }))
}));

afterEach(() => {
  jest.clearAllMocks();
});
