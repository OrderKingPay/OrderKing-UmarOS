// src/lib/logger.ts
export type LogSeverity = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogPayload {
  incident_timestamp: string;
  trace_id: string;
  severity: LogSeverity;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

const generateTraceId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
};

export const globalLogger = {
  log: (severity: LogSeverity, message: string, context?: Record<string, any>, error?: Error) => {
    const payload: LogPayload = {
      incident_timestamp: new Date().toISOString(),
      trace_id: generateTraceId(),
      severity,
      message,
      context,
    };
    
    if (error) {
      payload.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as Error;
    }

    const logString = JSON.stringify(payload);
    
    // Centralized error reporting mock (swap for Sentry/Datadog)
    if (severity === 'error' || severity === 'fatal') {
      console.error(logString);
      // reportToMonitoringService(payload);
    } else if (severity === 'warn') {
      console.warn(logString);
    } else if (severity === 'info') {
      console.info(logString);
    } else {
      console.debug(logString);
    }
  },
  
  info: (message: string, context?: Record<string, any>) => globalLogger.log('info', message, context),
  warn: (message: string, context?: Record<string, any>) => globalLogger.log('warn', message, context),
  error: (message: string, error?: any, context?: Record<string, any>) => globalLogger.log('error', message, context, error instanceof Error ? error : new Error(String(error))),
  fatal: (message: string, error?: any, context?: Record<string, any>) => globalLogger.log('fatal', message, context, error instanceof Error ? error : new Error(String(error))),
  debug: (message: string, context?: Record<string, any>) => globalLogger.log('debug', message, context),
};

export const setupGlobalErrorMonitoring = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      globalLogger.fatal('Unhandled Promise Rejection (Browser)', event.reason);
      event.preventDefault();
    });
    
    window.addEventListener('error', (event) => {
      globalLogger.fatal('Uncaught Exception (Browser)', event.error);
      event.preventDefault();
    });
  } else if (typeof process !== 'undefined') {
    if (!(global as any).__globalErrorMonitoringRegistered) {
      process.on('unhandledRejection', (reason, promise) => {
        globalLogger.fatal('Unhandled Promise Rejection (SSR)', reason);
      });
      
      process.on('uncaughtException', (error) => {
        globalLogger.fatal('Uncaught Exception (SSR)', error);
      });
      
      (global as any).__globalErrorMonitoringRegistered = true;
    }
  }
};
