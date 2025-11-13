import '@testing-library/jest-dom';

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '123' }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }) => <a href={to}>{children}</a>
}));

// Mock API service
jest.mock('../src/services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock email service
jest.mock('../src/services/emailService', () => ({
  getTemplates: jest.fn(),
  getTemplate: jest.fn(),
  createTemplate: jest.fn(),
  updateTemplate: jest.fn(),
  deleteTemplate: jest.fn(),
  compileMJML: jest.fn(),
  createVersion: jest.fn(),
  publishVersion: jest.fn(),
  getSequences: jest.fn(),
  getSequenceById: jest.fn(),
  createSequence: jest.fn(),
  updateSequence: jest.fn(),
  deleteSequence: jest.fn(),
  aiGenerateTemplate: jest.fn(),
  aiGenerateSubjectVariants: jest.fn(),
  aiOptimizeContent: jest.fn()
}));

// Mock AuthContext
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      role: 'manager',
      company_id: 'company-1'
    },
    logout: jest.fn()
  }),
  AuthProvider: ({ children }) => children
}));

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};

// Mock scrollIntoView
global.Element.prototype.scrollIntoView = jest.fn();

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});
