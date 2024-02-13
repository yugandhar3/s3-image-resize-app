import express from "express";
import cron from 'node-cron';
import env from "dotenv";
import { listAndResizeImages } from "./script.js"
env.config();

const app = express();

/** 
 * Schedules a cron job using the node-cron package.
 *
 * The 'cron.schedule' function is used to set up a recurring task, known as a cron job.
 * The first argument is a cron expression '0 0 * * *', which defines the schedule for the task.
 * In this expression, '0 0 * * *' means "at 00:00 (midnight) every day". This is broken down as:
 *   - The first '0' stands for 'minute' (so, at the 0th minute).
 *   - The second '0' stands for 'hour' (so, at the 0th hour, which is midnight).
 *   - The asterisks '*' represent 'day of the month', 'month', and 'day of the week' respectively,
 *     where '*' means 'every' for each of these fields.
 *
 * The second argument is an async function that defines the task to be executed at each scheduled time.
 * Here, it runs the 'listAndResizeImages' function every 24 hours.
 * If there are any errors during the execution, they are caught and logged to the console.
 *
 * This setup is useful for tasks that need to be run periodically, like cleaning up or updating data.
 */
// cron.schedule('0 0 * * *', async () => {
//   try {
//     console.log('Running listAndResizeImages every 24 hours');
//     await listAndResizeImages();
//   } catch (error) {
//     console.error(`Error on ${new Date().toISOString()}:`, error.message);
//     // Additional error handling logic can be added here
//   }
// });
cron.schedule('0 */12 * * *', async () => {
  try {
    console.log('Running listAndResizeImages every 12 hours');
    await listAndResizeImages();
  } catch (error) {
    console.error(`Error on ${new Date().toISOString()}:`, error.message);
    // Additional error handling logic can be added here
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));




await listAndResizeImages();


// cron.schedule('*/2 * * * * *', async () => {
//   console.log('Running a task every 2 seconds');
//   await listAndResizeImages();
// });
