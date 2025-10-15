const aggregatorUrl = process.env.LOG_AGGREGATOR_URL || process.env.LOGFLARE_SOURCE_URL || null;
const aggregatorToken = process.env.LOG_AGGREGATOR_TOKEN || process.env.LOGFLARE_API_KEY || null;
const aggregatorTimeoutMs = Number(process.env.LOG_AGGREGATOR_TIMEOUT_MS || 1000);

const isAggregatorEnabled = Boolean(aggregatorUrl);

const redactSecrets = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    if (value.length > 256) {
      return `${value.slice(0, 256)}…`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50); // prevent oversized payloads
  }

  if (typeof value === 'object') {
    const clone = {};
    Object.keys(value).forEach((key) => {
      if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
        clone[key] = '[redacted]';
      } else {
        clone[key] = redactSecrets(value[key]);
      }
    });
    return clone;
  }

  return value;
};

async function forwardLog(entry) {
  if (!isAggregatorEnabled) {
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), aggregatorTimeoutMs);

    await fetch(aggregatorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(aggregatorToken ? { Authorization: `Bearer ${aggregatorToken}` } : {})
      },
      body: JSON.stringify(entry),
      signal: controller.signal
    }).catch((error) => {
      if (error.name !== 'AbortError') {
        console.warn('[StructuredLog] Failed to forward entry:', error.message);
      }
    }).finally(() => clearTimeout(timeout));
  } catch (error) {
    console.warn('[StructuredLog] Exception during log forward:', error.message);
  }
}

function logStructured({ level = 'info', scope = 'Application', message, payload = {} }) {
  const normalizedLevel = ['info', 'warn', 'error', 'debug'].includes(level) ? level : 'info';
  const consoleMethod = normalizedLevel === 'error' ? 'error' : normalizedLevel === 'warn' ? 'warn' : 'log';

  const entry = {
    level: normalizedLevel,
    scope,
    message,
    timestamp: new Date().toISOString(),
    payload: redactSecrets(payload)
  };

  try {
    console[consoleMethod](`[${scope}] ${message}`, JSON.stringify(entry.payload));
  } catch (error) {
    console[consoleMethod](`[${scope}] ${message}`);
  }

  forwardLog(entry);
}

module.exports = {
  logStructured
};
