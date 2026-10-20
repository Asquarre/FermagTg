// Check the existing Google Sheets and Telegram configuration before production deploys.
if (process.env.VERCEL_ENV === 'production') {
  const required = ['GOOGLE_SHEETS_CREDENTIALS', 'GOOGLE_SHEETS_ID', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`Не настроена обработка заказов: ${missing.join(', ')}. См. docs/order-deployment.md.`);
    process.exitCode = 1;
  }
  if (process.env.CATALOG_SYNC_SECRET && process.env.CATALOG_SYNC_SECRET.length < 32) {
    console.error('CATALOG_SYNC_SECRET должен быть не короче 32 символов.');
    process.exitCode = 1;
  }
  if (process.env.CATALOG_SYNC_ENABLED === 'true' && (!process.env.BLOB_READ_WRITE_TOKEN || !process.env.CATALOG_SYNC_SECRET)) {
    console.error('Для включения синхронизации цен нужны BLOB_READ_WRITE_TOKEN и CATALOG_SYNC_SECRET. См. integrations/README.md.');
    process.exitCode = 1;
  }
}
