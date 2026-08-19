import cron from 'node-cron';
import { cleanupService } from './services';
import '@config';

const runCleanupTask = async () => {
  console.log(
    `[${new Date().toISOString()}] Starting scheduled cleanup task...`,
  );

  try {
    const result = await cleanupService.runAllCleanupTasks();

    if (result.success) {
      console.log(
        `[${new Date().toISOString()}] Cleanup completed successfully:`,
        {
          processedMutes: result.processedMutes,
          processedBans: result.processedBans,
          processedSubscriptions: result.processedSubscriptions,
          processedCompanies: result.processedCompanies,
          totalProcessed: result.totalProcessed,
        },
      );
    } else {
      console.error(
        `[${new Date().toISOString()}] Cleanup failed:`,
        result.error,
      );
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Unexpected error in cleanup task:`,
      error,
    );
  }
};

// Export function for manual execution
export const runCronJob = runCleanupTask;

// Start the cron scheduler when this file is executed directly
if (require.main === module) {
  console.log(`[${new Date().toISOString()}] Starting cron scheduler...`);
  console.log('Cleanup tasks will run every hour at minute 0');

  // Schedule cleanup task to run every hour
  cron.schedule('0 * * * *', runCleanupTask, {
    scheduled: true,
    timezone: 'UTC',
  });

  // Run cleanup task immediately on startup (optional)
  console.log(`[${new Date().toISOString()}] Running initial cleanup task...`);
  runCleanupTask();

  console.log(
    `[${new Date().toISOString()}] Cron scheduler started successfully`,
  );

  // Graceful shutdown handlers
  process.on('SIGINT', () => {
    console.log(
      `[${new Date().toISOString()}] Received SIGINT, gracefully shutting down cron scheduler...`,
    );
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log(
      `[${new Date().toISOString()}] Received SIGTERM, gracefully shutting down cron scheduler...`,
    );
    process.exit(0);
  });

  // Keep the process alive
  process.on('uncaughtException', (error) => {
    console.error(
      `[${new Date().toISOString()}] Uncaught exception in cron process:`,
      error,
    );
    // Don't exit on uncaught exceptions, just log them
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error(
      `[${new Date().toISOString()}] Unhandled rejection at:`,
      promise,
      'reason:',
      reason,
    );
    // Don't exit on unhandled rejections, just log them
  });
}
