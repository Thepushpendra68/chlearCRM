const auditService = require('../../services/auditService');
const { logAuditEvent, AuditActions, AuditSeverity } = require('../auditLogger');

jest.mock('../../services/auditService', () => ({
  logEvent: jest.fn().mockResolvedValue(undefined)
}));

describe('logAuditEvent', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses request user context when overrides not provided', async () => {
    const req = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
        role: 'company_admin',
        company_id: 'company-abc'
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'jest'
      }
    };

    await logAuditEvent(req, {
      action: AuditActions.USER_PROFILE_UPDATED,
      resourceType: 'user',
      resourceId: 'user-123',
      resourceName: 'User Example',
      companyId: 'company-abc',
      details: { updated_fields: ['timezone'] }
    });

    expect(auditService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-123',
        actorEmail: 'user@example.com',
        actorRole: 'company_admin',
        resourceType: 'user',
        resourceId: 'user-123',
        details: expect.objectContaining({
          updated_fields: ['timezone'],
          resource_name: 'User Example',
          company_id: 'company-abc'
        }),
        ipAddress: '127.0.0.1',
        userAgent: 'jest'
      })
    );
  });

  it('honors explicit actor overrides', async () => {
    const req = {
      user: {
        id: 'request-user',
        email: 'request@example.com',
        role: 'sales_rep',
        company_id: 'company-abc'
      }
    };

    await logAuditEvent(req, {
      action: AuditActions.IMPORT_COMPLETED,
      resourceType: 'lead_import',
      resourceName: 'leads.csv',
      companyId: 'company-abc',
      actorId: 'override-user',
      actorEmail: 'override@example.com',
      actorRole: 'import_bot',
      severity: AuditSeverity.WARNING,
      details: { total_records: 10, successful: 9, failed: 1 }
    });

    expect(auditService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'override-user',
        actorEmail: 'override@example.com',
        actorRole: 'import_bot',
        severity: AuditSeverity.WARNING
      })
    );
  });

  it('tracks impersonation context when original user present', async () => {
    const req = {
      originalUser: {
        id: 'super-admin',
        email: 'super@example.com',
        role: 'super_admin'
      },
      user: {
        id: 'impersonated-user',
        email: 'impersonated@example.com',
        role: 'sales_rep',
        company_id: 'company-xyz'
      },
      headers: {
        'user-agent': 'jest'
      }
    };

    await logAuditEvent(req, {
      action: AuditActions.LEAD_UPDATED,
      resourceType: 'lead',
      resourceId: 'lead-1',
      resourceName: 'Lead 1',
      companyId: 'company-xyz',
      details: { changes: [] }
    });

    expect(auditService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'super-admin',
        actorEmail: 'super@example.com',
        actorRole: 'super_admin',
        isImpersonation: true,
        impersonatedUserId: 'impersonated-user'
      })
    );
  });
});
