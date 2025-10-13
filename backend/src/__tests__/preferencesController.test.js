jest.mock('../services/preferencesService', () => ({
  updateUserPreferences: jest.fn()
}));

jest.mock('../services/userService', () => ({
  updateUser: jest.fn()
}));

const preferencesService = require('../services/preferencesService');
const userService = require('../services/userService');
const preferencesController = require('../controllers/preferencesController');

const buildRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('preferencesController.updatePreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates user preferences and profile metadata when timezone or language present', async () => {
    const req = {
      user: {
        id: 'user-123',
        company_id: 'company-456',
        role: 'sales_rep'
      },
      body: {
        theme: 'dark',
        timezone: 'Asia/Kolkata',
        language: 'en'
      }
    };
    const res = buildRes();
    const next = jest.fn();

    preferencesService.updateUserPreferences.mockResolvedValue({
      theme: 'dark'
    });

    userService.updateUser.mockResolvedValue({
      id: 'user-123',
      timezone: 'Asia/Kolkata',
      language: 'en'
    });

    await preferencesController.updatePreferences(req, res, next);

    expect(preferencesService.updateUserPreferences).toHaveBeenCalledWith('user-123', { theme: 'dark' });
    expect(userService.updateUser).toHaveBeenCalledWith(
      'user-123',
      { timezone: 'Asia/Kolkata', language: 'en' },
      req.user
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        preferences: { theme: 'dark' },
        profile: {
          id: 'user-123',
          timezone: 'Asia/Kolkata',
          language: 'en'
        }
      },
      message: 'Preferences updated successfully'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('skips profile update when timezone and language are absent', async () => {
    const req = {
      user: {
        id: 'user-789',
        company_id: 'company-000',
        role: 'sales_rep'
      },
      body: {
        email_notifications: false
      }
    };
    const res = buildRes();
    const next = jest.fn();

    preferencesService.updateUserPreferences.mockResolvedValue({
      email_notifications: false
    });

    await preferencesController.updatePreferences(req, res, next);

    expect(preferencesService.updateUserPreferences).toHaveBeenCalledWith('user-789', {
      email_notifications: false
    });
    expect(userService.updateUser).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        preferences: {
          email_notifications: false
        },
        profile: null
      },
      message: 'Preferences updated successfully'
    });
    expect(next).not.toHaveBeenCalled();
  });
});
