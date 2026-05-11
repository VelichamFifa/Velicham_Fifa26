import { Request } from 'express';

interface LogContext {
  requestId?: string;
  userId?: string;
  email?: string;
  method?: string;
  path?: string;
  ip?: string;
  [key: string]: unknown;
}

interface ErrorDetails {
  message: string;
  code?: string;
  statusCode?: number;
  timestamp?: string;
  context?: LogContext;
}

export const logger = {
  error: (functionName: string, error: unknown, context?: LogContext | Request): ErrorDetails => {
    const timestamp = new Date().toISOString();
    const req = context && 'headers' in context ? (context as Request) : undefined;

    const logContext: LogContext = {
      ...((req && {
        method: req.method,
        path: req.path,
        ip: req.ip,
      }) ||
        (context as LogContext)),
    };

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCode = (error as any)?.code || (error as any)?.statusCode || 'UNKNOWN';

    const logEntry = {
      level: 'ERROR',
      timestamp,
      function: functionName,
      message: errorMessage,
      code: errorCode,
      context: Object.keys(logContext).length > 0 ? logContext : undefined,
      stack: errorStack,
    };

    // Log to console with formatted output
    console.error(
      JSON.stringify(logEntry, null, 2)
    );

    return {
      message: errorMessage,
      code: String(errorCode),
      statusCode: (error as any)?.statusCode || 500,
      timestamp,
      context: logContext,
    };
  },

  warn: (functionName: string, message: string, context?: LogContext): void => {
    const timestamp = new Date().toISOString();

    const logEntry = {
      level: 'WARN',
      timestamp,
      function: functionName,
      message,
      context: Object.keys(context || {}).length > 0 ? context : undefined,
    };

    console.warn(JSON.stringify(logEntry, null, 2));
  },

  info: (functionName: string, message: string, context?: LogContext): void => {
    const timestamp = new Date().toISOString();

    const logEntry = {
      level: 'INFO',
      timestamp,
      function: functionName,
      message,
      context: Object.keys(context || {}).length > 0 ? context : undefined,
    };

    console.log(JSON.stringify(logEntry, null, 2));
  },
};

export default logger;
