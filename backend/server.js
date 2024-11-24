const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors'); // Import cors

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS to allow requests from your frontend
app.use(
  cors({
    origin: 'http://localhost:3001', // Only allow requests from this origin
    methods: ['GET', 'POST'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type'], // Allow specific headers
  })
);

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Load Google Sheets credentials
const credentials = JSON.parse(fs.readFileSync(process.env.GOOGLE_SHEETS_CREDENTIALS));
const { client_email, private_key } = credentials;

// Set up Google Sheets API client
const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.JWT(client_email, null, private_key, ['https://www.googleapis.com/auth/spreadsheets']),
});

// Test route to check if the server is running
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Endpoint to handle order submissions
app.post('/submit-order', async (req, res) => {
  try {
    const { user_id, address, phone, items, timestamp } = req.body;

    const orderData = [
      [timestamp, user_id, address, phone, JSON.stringify(items)],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Orders!A:E',
      valueInputOption: 'RAW',
      resource: { values: orderData },
    });

    res.status(200).send({ message: 'Order submitted successfully!' });
  } catch (error) {
    console.error('Error submitting order:', error);
    res.status(500).send({ error: 'Failed to submit order.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
