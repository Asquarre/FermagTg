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
    const { user_id, address, phone, items, timestamp } = req.body;
    if (!items || items.length === 0) {
      res.status(400).json({ error: 'Empty order' });
      return;
    }
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    const timestampString =
      typeof timestamp === 'string' || typeof timestamp === 'number'
        ? String(timestamp)
        : new Date().toISOString();
    const sanitizedIdentifier = timestampString.replace(/[^0-9A-Za-z]/g, '');
    const uniqueSuffix = Date.now();
    const sheetTitleBase = sanitizedIdentifier
      ? `Order_${sanitizedIdentifier}`
      : `Order_${uniqueSuffix}`;
    const sanitizedSheetTitle = `${sheetTitleBase}_${uniqueSuffix}`.slice(0, 99);

    const addSheetResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sanitizedSheetTitle,
              },
            },
          },
        ],
      },
    });

    const sheetId =
      addSheetResponse.data?.replies?.[0]?.addSheet?.properties?.sheetId;
    if (typeof sheetId !== 'number') {
      throw new Error('Failed to create order sheet');
    }

    const orderTotal = items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
      0,
    );

    const orderRows = [
      ['Адрес:', address || ''],
      ['Покупатель:', user_id || ''],
      ['Телефон:', phone || ''],
      ['Итог:', orderTotal],
      ['', ''],
      ['Наименование', 'кол-во'],
      ...items.map((item) => [
        item.name || item.title || '',
        item.quantity != null ? item.quantity : '',
      ]),
      ['Итог', orderTotal],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sanitizedSheetTitle}!A1`,
      valueInputOption: 'RAW',
      resource: { values: orderRows },
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 3,
                startColumnIndex: 0,
                endColumnIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 1, green: 1, blue: 0 },
                  textFormat: { bold: true },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 4,
                endRowIndex: 5,
                startColumnIndex: 0,
                endColumnIndex: 2,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 1, green: 1, blue: 0 },
                  textFormat: { bold: true },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      },
    });

    res.status(200).json({ message: 'Order submitted successfully!' });
  } catch (error) {
    console.error('Error submitting order:', error);
    res.status(500).json({ error: 'Failed to submit order.' });
  }
};
