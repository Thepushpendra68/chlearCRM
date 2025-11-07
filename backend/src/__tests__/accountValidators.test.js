process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'jwt-secret';

const { validateAccount } = require('../validators/accountValidators');
const { validationResult } = require('express-validator');

describe('accountValidators', () => {
  let req;

  beforeEach(() => {
    req = {
      body: {}
    };
  });

  describe('validateAccount', () => {
    it('should pass validation with valid account data', async () => {
      req.body = {
        name: 'Test Account',
        industry: 'Technology',
        status: 'active',
        email: 'test@example.com',
        website: 'https://example.com'
      };

      // Run validators
      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should fail validation when name is missing', async () => {
      req.body = {
        industry: 'Technology'
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'name'
          })
        ])
      );
    });

    it('should fail validation when name is empty string', async () => {
      req.body = {
        name: ''
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should fail validation when name exceeds max length', async () => {
      req.body = {
        name: 'a'.repeat(256) // Exceeds 255 character limit
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should pass validation with empty email string', async () => {
      req.body = {
        name: 'Test Account',
        email: ''
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should fail validation with invalid email format', async () => {
      req.body = {
        name: 'Test Account',
        email: 'invalid-email'
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'email'
          })
        ])
      );
    });

    it('should pass validation with valid email', async () => {
      req.body = {
        name: 'Test Account',
        email: 'test@example.com'
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should fail validation with invalid URL for website', async () => {
      req.body = {
        name: 'Test Account',
        website: 'not-a-valid-url'
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should pass validation with valid URL for website', async () => {
      req.body = {
        name: 'Test Account',
        website: 'https://example.com'
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should pass validation with empty website string', async () => {
      req.body = {
        name: 'Test Account',
        website: ''
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should fail validation with invalid status', async () => {
      req.body = {
        name: 'Test Account',
        status: 'invalid_status'
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should pass validation with valid status values', async () => {
      const validStatuses = ['active', 'inactive', 'archived'];

      for (const status of validStatuses) {
        req.body = {
          name: 'Test Account',
          status
        };

        await Promise.all(validateAccount.map(validator => validator.run(req)));

        const errors = validationResult(req);
        expect(errors.isEmpty()).toBe(true);
      }
    });

    it('should fail validation with invalid UUID for parent_account_id', async () => {
      req.body = {
        name: 'Test Account',
        parent_account_id: 'invalid-uuid'
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should pass validation with valid UUID for parent_account_id', async () => {
      req.body = {
        name: 'Test Account',
        parent_account_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should pass validation with empty parent_account_id string', async () => {
      req.body = {
        name: 'Test Account',
        parent_account_id: ''
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should fail validation with negative annual_revenue', async () => {
      req.body = {
        name: 'Test Account',
        annual_revenue: -1000
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should pass validation with valid annual_revenue', async () => {
      req.body = {
        name: 'Test Account',
        annual_revenue: 1000000
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should fail validation with negative employee_count', async () => {
      req.body = {
        name: 'Test Account',
        employee_count: -10
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should fail validation with non-integer employee_count', async () => {
      req.body = {
        name: 'Test Account',
        employee_count: 10.5
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should pass validation with valid employee_count', async () => {
      req.body = {
        name: 'Test Account',
        employee_count: 100
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should fail validation when address is not an object', async () => {
      req.body = {
        name: 'Test Account',
        address: 'not-an-object'
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should pass validation with valid address object', async () => {
      req.body = {
        name: 'Test Account',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001'
        }
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should fail validation when custom_fields is not an object', async () => {
      req.body = {
        name: 'Test Account',
        custom_fields: 'not-an-object'
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should pass validation with valid custom_fields object', async () => {
      req.body = {
        name: 'Test Account',
        custom_fields: {
          custom_field_1: 'value1',
          custom_field_2: 'value2'
        }
      };

      await Promise.all(validateAccount.map(validator => validator.run(req)));

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });
  });
});

