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

    const resolveOrderDate = (value) => {
      if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      return new Date();
    };

    const orderDate = resolveOrderDate(timestamp);
    const day = String(orderDate.getDate()).padStart(2, '0');
    const month = String(orderDate.getMonth() + 1).padStart(2, '0');

    const sanitizedAddress = (address || '')
      .trim()
      .replace(/[\n\r]+/g, ' ')
      .replace(/[\[\]:*?/\\]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 80);

    const addressPart = sanitizedAddress || 'Adress';
    const baseSheetTitle = `${addressPart}_${day}.${month}`.slice(0, 99);

    const { data: spreadsheetInfo } = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title',
    });

    const existingTitles = new Set(
      (spreadsheetInfo.sheets || [])
        .map((sheet) => sheet.properties?.title)
        .filter(Boolean),
    );

    let sanitizedSheetTitle = baseSheetTitle;
    const maxSheetTitleLength = 99;
    if (existingTitles.has(sanitizedSheetTitle)) {
      let duplicateIndex = 1;
      while (existingTitles.has(sanitizedSheetTitle)) {
        const prefix = `(${duplicateIndex})`;
        const allowedBaseLength = Math.max(
          maxSheetTitleLength - prefix.length,
          0,
        );
        const truncatedBaseTitle = baseSheetTitle.slice(0, allowedBaseLength);
        sanitizedSheetTitle = `${prefix}${truncatedBaseTitle}`;
        duplicateIndex += 1;
      }
    }

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
      ['Наименование', 'Кол-во'],
      ...items.map((item) => [
        item.name || item.title || '',
        item.quantity != null ? item.quantity : '',
      ]),
      ['ИТОГ:', orderTotal],
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
                endRowIndex: 4,
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
                startRowIndex: 5,
                endRowIndex: 6,
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
