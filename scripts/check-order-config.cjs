// Check the existing Google Sheets and Telegram configuration before production deploys.
if (process.env.VERCEL_ENV === 'production') {
  const required = ['GOOGLE_SHEETS_CREDENTIALS', 'GOOGLE_SHEETS_ID', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`Не настроена обработка заказов: ${missing.join(', ')}. См. docs/order-deployment.md.`);
    process.exitCode = 1;
  }
}
