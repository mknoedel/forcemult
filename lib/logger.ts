/**
 * Minimal structured logger. Prefer this over `console.log` so logs are
 * consistent and filterable. Levels: error, warn, info, debug. Errors/warnings
 * go to stderr; info/debug to stdout. Set `LOG_LEVEL` to control verbosity
 * (default: info).
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function currentLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel | undefined;
  return env && env in LEVELS ? env : 'info';
}

function write(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
): void {
  if (LEVELS[level] > LEVELS[currentLevel()]) return;
  const entry = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    ...meta,
  });
  // The logger is the single sanctioned place that writes to the console.
  if (level === 'error' || level === 'warn') {
    console.error(entry);
  } else {
    console.log(entry);
  }
}

export const logger = {
  error: (message: string, meta?: Record<string, unknown>) =>
    write('error', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    write('warn', message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    write('info', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) =>
    write('debug', message, meta),
};
