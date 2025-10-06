// api/submit-order.js

const { google } = require('googleapis');
const axios = require('axios');

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
    const {
      user_id,
      customerName,
      address,
      phone,
      items,
      fulfillmentType,
      timestamp,
    } = req.body;
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
    const formatGmtPlusFiveDate = (date) => {
      const gmtPlusFiveOffsetMinutes = 5 * 60;
      const gmtPlusFiveDate = new Date(
        date.getTime() + gmtPlusFiveOffsetMinutes * 60 * 1000,
      );

      return {
        day: String(gmtPlusFiveDate.getUTCDate()).padStart(2, '0'),
        month: String(gmtPlusFiveDate.getUTCMonth() + 1).padStart(2, '0'),
        year: String(gmtPlusFiveDate.getUTCFullYear()),
        hours: String(gmtPlusFiveDate.getUTCHours()).padStart(2, '0'),
        minutes: String(gmtPlusFiveDate.getUTCMinutes()).padStart(2, '0'),
        milliseconds: String(gmtPlusFiveDate.getUTCMilliseconds()).padStart(3, '0'),
      };
    };

    const { day, month, year, hours, minutes, milliseconds } =
      formatGmtPlusFiveDate(orderDate);
    const formattedOrderDateTime = `${day}.${month}.${year} ${hours}:${minutes}`;
    
    const sanitizedCustomerName = (customerName || user_id || address || '')
      .trim()
      .replace(/[\n\r]+/g, ' ')
      .replace(/[\[\]:*?/\\]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 80);

    const customerPart = sanitizedCustomerName || 'Customer';
    const baseSheetTitle = `${milliseconds}#${customerPart}_${day}.${month}_${hours}:${minutes}`.slice(
      0,
      99,
    );

    const sanitizedSheetTitle = baseSheetTitle;

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
    const normalizeFulfillmentType = (value) => {
      if (typeof value !== 'string') {
        return 'Не указан';
      }

      const trimmed = value.trim();
      if (!trimmed) {
        return 'Не указан';
      }

      const lowerCased = trimmed.toLowerCase();

      if (lowerCased === 'delivery' || lowerCased === 'доставка') {
        return 'Доставка';
      }

      if (lowerCased === 'pickup' || lowerCased === 'самовывоз') {
        return 'Самовывоз';
      }

      return trimmed;
    };

    const fulfillmentValue = normalizeFulfillmentType(fulfillmentType);

    const resolveItemPrice = (value) => {
      if (value == null || value === '') {
        return '';
      }

      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? numberValue : value;
    };


    const ensurePlainText = (value) => {
      if (value == null) {
        return '';
      }

      const stringValue = String(value);
      return /^[=+\-]/.test(stringValue.trim())
        ? `'${stringValue}`
        : stringValue;
    };

     const formatDateForSheet = (date) => {
      const pad = (value) => String(value).padStart(2, '0');
      const day = pad(date.getDate());
      const month = pad(date.getMonth() + 1);
      const year = date.getFullYear();

      return `${day}.${month}.${year}`;
    };

    const formattedOrderDate = formatDateForSheet(orderDate);
    const baseRows = [
      ['Адрес:', ensurePlainText(address || ''), '', ''],
      ['Покупатель:', ensurePlainText(customerName || user_id || ''), '', ''],
      ['Телефон:', ensurePlainText(phone || ''), '', ''],
      ['Доставка/самовывоз:', fulfillmentValue, '', ''],
      ['Итог:', orderTotal],
      ['Дата:', `'${formattedOrderDate}`, '', ''],
      ['', '', '', ''],
      ['Наименование', 'Кол-во', 'Цена', 'Сумма'],
    ];

    const productRows = items.map((item, index) => {
      const sheetRowNumber = baseRows.length + index + 1;

      return [
        item.catalogueName || item.name || item.title || '',
        item.quantity != null ? item.quantity : '',
        resolveItemPrice(item.price),
      `=B${sheetRowNumber}*C${sheetRowNumber}`,
      ];
    });

    const orderRows = [
      ...baseRows,
      ...productRows,
      ['ИТОГ:', orderTotal],
    ];

    const finalTotalRowIndex = orderRows.length - 1;
    const initialTotalRowIndex = orderRows.findIndex(
      ([label], index) =>
        index !== finalTotalRowIndex &&
        typeof label === 'string' &&
        label.trim().toLowerCase() === 'итог:',
    );

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sanitizedSheetTitle}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: orderRows },
    });

    const formattingRequests = [
      {
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 1,
          },
          properties: { pixelSize: 332 },
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: 1,
            endIndex: 2,
          },
          properties: { pixelSize: 160 },
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: 2,
            endIndex: 3,
          },
          properties: { pixelSize: 160 },
          fields: 'pixelSize',
        },
      },
       {
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: 3,
            endIndex: 4,
          },
          properties: { pixelSize: 160 },
          fields: 'pixelSize',
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 6,
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
            startRowIndex: 7,
            endRowIndex: 8,
            startColumnIndex: 0,
            endColumnIndex: 4,
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
    ];

    if (initialTotalRowIndex >= 0) {
      formattingRequests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: initialTotalRowIndex,
            endRowIndex: initialTotalRowIndex + 1,
            startColumnIndex: 3,
            endColumnIndex: 4,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'CURRENCY',
                pattern: '[$₸-kk_KZ] #,##0.00',
              },
              
            },
          },
          fields: 'userEnteredFormat.numberFormat',
        },
      });
    }

    formattingRequests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: finalTotalRowIndex,
          endRowIndex: finalTotalRowIndex + 1,
          startColumnIndex: 3,
          endColumnIndex: 4,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: {
              type: 'CURRENCY',
              pattern: '[$₸-kk_KZ] #,##0.00',
            },
          },
        },
        fields: 'userEnteredFormat.numberFormat',
      },
    });
    formattingRequests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: finalTotalRowIndex,
          endRowIndex: finalTotalRowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 4,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1, green: 1, blue: 0 },
            textFormat: { bold: true },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    });
if (productRows.length > 0) {
      formattingRequests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: baseRows.length,
            endRowIndex: finalTotalRowIndex,
            startColumnIndex: 3,
            endColumnIndex: 4,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'CURRENCY',
                pattern: '[$₸-kk_KZ] #,##0.00',
              },
            },
          },
          fields: 'userEnteredFormat.numberFormat',
        },
      });
    }



    const formattingPromise = sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: formattingRequests,
      },
    });


    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      throw new Error('Telegram bot configuration is missing.');
    }

    const formattedOrderTotal = Number.isFinite(orderTotal)
      ? `${orderTotal.toFixed(2)} ₸`
      : String(orderTotal);

    const itemLines = items.map((item) => {
      const name = item.name || item.title || 'Без названия';
      const quantityValue =
        item.quantity != null && item.quantity !== '' ? item.quantity : '';
      const quantityPart = quantityValue !== '' ? ` x${quantityValue}` : '';

      const priceNumber = Number(item.price);
      const pricePart = Number.isFinite(priceNumber)
        ? ` (${priceNumber.toFixed(2)} ₸)`
        : '';

      return `• ${name}${quantityPart}${pricePart}`;
    });

    const messageLines = [
      formattedOrderDateTime,
      '',
      '🛒 Новый заказ',
      `👨Покупатель: ${customerName || user_id || 'Не указан'}`,
      `📞Телефон: ${phone || 'Не указан'}`,
      `📍Адрес: ${address || 'Не указан'}`,
      `🚛Доставка/самовывоз: ${fulfillmentValue}`,
      '',
      'Товары:',
      ...itemLines,
      '',
      `Итог: ${formattedOrderTotal}`,
    ];

    const messageText = messageLines.join('\n');

    const sendMessagePromise = axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: messageText,
      },
    );

    const [formattingResult, telegramResult] = await Promise.allSettled([
      formattingPromise,
      sendMessagePromise,
    ]);

    if (telegramResult.status === 'rejected') {
      throw telegramResult.reason;
    }

    const telegramResponse = telegramResult.value;

    if (formattingResult.status === 'rejected') {
      const messageId = telegramResponse?.data?.result?.message_id;
      if (messageId) {
        try {
          await axios.post(
            `https://api.telegram.org/bot${botToken}/deleteMessage`,
            {
              chat_id: chatId,
              message_id: messageId,
            },
          );
        } catch (deleteError) {
          console.error('Failed to delete Telegram message:', deleteError);
        }
      }

      throw formattingResult.reason;
    }



    res.status(200).json({ message: 'Order submitted successfully!' });
  } catch (error) {
    console.error('Error submitting order:', error);
    res.status(500).json({ error: 'Failed to submit order.' });
  }
};
