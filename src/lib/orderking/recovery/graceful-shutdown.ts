import { Server } from 'http';

/**
 * Sets up graceful shutdown for the application.
 * Listens for SIGTERM and SIGINT to close HTTP connections, flush Redis, and end the DB pool cleanly.
 */
export function setupGracefulShutdown(server: Server, redis: any, sql: any) {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new HTTP connections
    server.close(async (err) => {
      if (err) {
        console.error('Error during HTTP server closure:', err);
        process.exit(1);
      }
      console.log('HTTP server closed.');

      try {
        // Flush and close Redis
        if (redis) {
          console.log('Closing Redis connection...');
          await redis.quit(); // Use quit() for graceful shutdown instead of disconnect()
          console.log('Redis connection closed.');
        }

        // Close DB Pool
        if (sql) {
          console.log('Closing Database pool...');
          await sql.end();
          console.log('Database pool closed.');
        }

        console.log('Graceful shutdown completed successfully.');
        process.exit(0);
      } catch (error) {
        console.error('Error during resource cleanup:', error);
        process.exit(1);
      }
    });

    // Force shutdown if graceful shutdown takes too long (e.g., 10 seconds)
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000).unref();
  };

  // Listen for termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
