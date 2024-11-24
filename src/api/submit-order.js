// api/submit-order.js

const { google } = require('googleapis');


// Since we can't read files like credentials.json in serverless functions, we'll use environment variables
const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
credentials.private_key = credentials.private_key.replace(/\\n/g, '\n'); // Handle newline characters
const { client_email, private_key } = credentials;

// Set up Google Sheets API client
const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.JWT(client_email, null, private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]),
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { address, phone, items, timestamp } = req.body;

    const orderData = [[timestamp, address, phone, JSON.stringify(items)]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Orders!A:D',
      valueInputOption: 'RAW',
      resource: { values: orderData },
    });

    res.status(200).json({ message: 'Order submitted successfully!' });
  } catch (error) {
    console.error('Error submitting order:', error);
    res.status(500).json({ error: 'Failed to submit order.' });
  }
};
