const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path'); // For resolving paths
const dotenv = require('dotenv');
const cors = require('cors'); // Import cors

// Load environment variables from the backend/.env file
dotenv.config({ path: path.resolve(__dirname, './.env') });

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS to allow requests from your frontend
app.use(
  cors({
    origin: 'http://localhost:3001', // Change this to your frontend's deployed URL
    methods: ['GET', 'POST'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type'], // Allow specific headers
  })
);

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Load Google Sheets credentials securely
let credentials;
try {
  credentials = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, process.env.GOOGLE_SHEETS_CREDENTIALS), 'utf8')
  );
} catch (error) {
  console.error('Error reading Google Sheets credentials file:', error.message);
  process.exit(1);
}

const { client_email, private_key } = credentials;

// Set up Google Sheets API client
const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.JWT(client_email, null, private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]),
});

// Test route to check if the server is running
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Endpoint to handle order submissions
app.post('/submit-order', async (req, res) => {
  try {
    const { user_id, address, phone, items, timestamp } = req.body;

    if (!user_id || !address || !phone || !items || !timestamp) {
      return res.status(400).send({ error: 'Missing required fields in the request body.' });
    }

    const orderData = [[timestamp, user_id, address, phone, JSON.stringify(items)]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Orders!A:E',
      valueInputOption: 'RAW',
      resource: { values: orderData },
    });

    res.status(200).send({ message: 'Order submitted successfully!' });
  } catch (error) {
    console.error('Error submitting order:', error);
    res.status(500).send({ error: 'Failed to submit order. Please try again later.' });
  }
});

// Catch-all error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send({ error: 'An unexpected error occurred.' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
