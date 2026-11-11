import cron from 'node-cron';
import { updateLiveExchangeRates } from '../config/currencyMap.js';

/**
 * Initializes the background Cron Job to fetch and update exchange rates.
 * This function should be imported and executed once in your main server entry file (e.g., server.js).
 */
const initCurrencyUpdater = () => {
  // Schedule to run at midnight (00:00) and noon (12:00) every single day.
  // This perfectly matches the 12-hour (CACHE_DURATION_MS) limit in your currencyMap.js
  cron.schedule('0 0,12 * * *', async () => {
    console.log('[CRON] Initiating scheduled exchange rate update...');
    
    try {
      // This calls the Engine you already built
      const rates = await updateLiveExchangeRates();
      
      if (rates) {
        console.log('[CRON] Scheduled exchange rate update completed successfully.');
      } else {
        console.warn('[CRON] Scheduled exchange rate update returned no data. Check API/DB connections.');
      }
    } catch (error) {
      console.error('[CRON] Critical error during scheduled exchange rate update:', error.message);
    }
  });

  console.log('[CRON] Currency Updater Engine Scheduled: Will run automatically at 00:00 and 12:00 daily.');
};

export default initCurrencyUpdater;