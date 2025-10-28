const { supabaseAdmin } = require('../config/supabase');
const { logStructured } = require('../utils/structuredLogger');

const asInteger = (value) => {
  if (Number.isFinite(value)) {
    return Math.round(value);
  }
  return null;
};

class ImportTelemetryService {
  async recordDryRun(event) {
    return this.recordEvent({ ...event, phase: 'dry_run' });
  }

  async recordImport(event) {
    return this.recordEvent({ ...event, phase: 'import' });
  }

  async recordEvent({
    phase,
    companyId,
    userId,
    fileName = null,
    stats = {},
    warningCount = 0,
    errorCount = 0,
    duplicatePolicy = null,
    configVersion = null,
    durationMs = null,
    metadata = {}
  }) {
    const payload = {
      company_id: companyId,
      user_id: userId || null,
      phase,
      stats: stats || {},
      warning_count: warningCount ?? 0,
      error_count: errorCount ?? 0,
      duplicate_policy: duplicatePolicy || null,
      config_version: configVersion || null,
      duration_ms: asInteger(durationMs),
      metadata: {
        file_name: fileName || null,
        ...metadata
      }
    };

    try {
      logStructured({
        level: 'info',
        scope: 'ImportTelemetry',
        message: phase === 'dry_run' ? 'Dry run validation recorded' : 'Lead import recorded',
        payload: {
          phase,
          companyId,
          userId,
          fileName,
          warningCount: payload.warning_count,
          errorCount: payload.error_count,
          duplicatePolicy: payload.duplicate_policy,
          configVersion: payload.config_version,
          durationMs: payload.duration_ms,
          stats: payload.stats,
          metadata: payload.metadata
        }
      });

      const { error } = await supabaseAdmin
        .from('import_telemetry')
        .insert(payload);

      if (error) {
        if (error.code === '42P01') {
          // Table not yet provisioned; surface once and continue.
          console.warn('[ImportTelemetry] import_telemetry table missing. Skipping insert.');
        } else {
          console.error('[ImportTelemetry] Failed to persist telemetry:', error);
        }
      }
    } catch (err) {
      console.error('[ImportTelemetry] Exception while recording telemetry:', err);
    }
  }
}

module.exports = new ImportTelemetryService();
