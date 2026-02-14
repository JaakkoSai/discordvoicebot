type Level = "DEBUG" | "INFO" | "WARN" | "ERROR";

function write(level: Level, message: string, meta?: unknown): void {
  const ts = new Date().toISOString();
  if (meta === undefined) {
    console.log(`${ts} [${level}] ${message}`);
    return;
  }
  console.log(`${ts} [${level}] ${message}`, meta);
}

export const logger = {
  debug: (message: string, meta?: unknown): void => write("DEBUG", message, meta),
  info: (message: string, meta?: unknown): void => write("INFO", message, meta),
  warn: (message: string, meta?: unknown): void => write("WARN", message, meta),
  error: (message: string, meta?: unknown): void => write("ERROR", message, meta)
};
