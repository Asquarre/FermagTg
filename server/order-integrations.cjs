const { google } = require('googleapis');
const axios = require('axios');
const { OrderError } = require('./order-service.cjs');

function dateParts(iso) {
  const d = new Date(new Date(iso).getTime() + 5 * 3600000);
  const pad = (n) => String(n).padStart(2, '0');
  return { date: `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`,
    shortDate: `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    ms: String(d.getUTCMilliseconds()).padStart(3, '0') };
}

function buildSheetRequests(order, title) {
  const sheetId = order.sheetId;
  const p = order.payload;
  // Match the original sheet date (server timezone), while message/title use UTC+5.
  const d = new Date(order.createdAt);
  const date = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  const cell = (value) => ({ userEnteredValue: typeof value === 'number' ? { numberValue: value } : { stringValue: String(value ?? '') } });
  const rows = [
    ['Адрес:', p.address], ['Покупатель:', p.customerName], ['Телефон:', p.phone],
    ['Доставка/самовывоз:', p.fulfillmentType], ['Итог:', order.total], ['Дата:', date], [],
    ['Наименование', 'Кол-во', 'Цена', 'Сумма'],
  ].map((values) => ({ values: values.map(cell) }));
  p.items.forEach((item, index) => rows.push({ values: [cell(item.catalogueName), cell(item.quantity), cell(item.price),
    { userEnteredValue: { formulaValue: `=B${index + 9}*C${index + 9}` } }] }));
  rows.push({ values: [cell('ИТОГ:'), cell(order.total)] });
  const yellow = { backgroundColor: { red: 1, green: 1, blue: 0 }, textFormat: { bold: true } };
  const format = (startRowIndex, endRowIndex, startColumnIndex, endColumnIndex, userEnteredFormat) => ({ repeatCell: {
    range: { sheetId, startRowIndex, endRowIndex, startColumnIndex, endColumnIndex },
    cell: { userEnteredFormat }, fields: userEnteredFormat.numberFormat
      ? 'userEnteredFormat.numberFormat' : 'userEnteredFormat(backgroundColor,textFormat)',
  } });
  const money = { numberFormat: { type: 'CURRENCY', pattern: '[$₸-kk_KZ] #,##0.00' } };
  return [
    { addSheet: { properties: { sheetId, title, gridProperties: { rowCount: Math.max(1000, rows.length), columnCount: 4 } } } },
    { updateCells: { start: { sheetId, rowIndex: 0, columnIndex: 0 }, rows, fields: 'userEnteredValue' } },
    ...[332, 160, 160, 160].map((pixelSize, index) => ({ updateDimensionProperties: {
      range: { sheetId, dimension: 'COLUMNS', startIndex: index, endIndex: index + 1 }, properties: { pixelSize }, fields: 'pixelSize',
    } })),
    format(0, 6, 0, 1, yellow), format(7, 8, 0, 4, yellow),
    format(4, 5, 3, 4, money), format(rows.length - 1, rows.length, 3, 4, money),
    format(rows.length - 1, rows.length, 0, 4, yellow), format(8, rows.length - 1, 3, 4, money),
    // Internal metadata is not shown in cells, sheet names, or Telegram messages.
    { createDeveloperMetadata: { developerMetadata: { metadataKey: 'grocery_order', metadataValue: order.id,
      location: { sheetId }, visibility: 'DOCUMENT' } } },
    { createDeveloperMetadata: { developerMetadata: { metadataKey: 'grocery_order_hash', metadataValue: order.hash,
      location: { sheetId }, visibility: 'DOCUMENT' } } },
  ];
}

function telegramMessage(order) {
  const p = order.payload;
  const { date, time } = dateParts(order.createdAt);
  return [`${date} ${time}`, '', '🛒 Новый заказ', `👨Покупатель: ${p.customerName || 'Не указан'}`, `📞Телефон: ${p.phone || 'Не указан'}`,
    `📍Адрес: ${p.address || 'Не указан'}`, `🚛Доставка/самовывоз: ${p.fulfillmentType}`, '', 'Товары:',
    ...p.items.map((item) => `• ${item.name} x${item.quantity} (${item.price.toFixed(2)} ₸)`), '', `Итог: ${order.total.toFixed(2)} ₸`].join('\n');
}

function splitTelegramMessage(text) {
  if (text.length <= 4096) return [text];
  const chunks = [];
  let offset = 0;
  // Reserve space for part numbering. UTF-16 length is conservative for emoji.
  while (offset < text.length) {
    let end = Math.min(offset + 4000, text.length);
    if (end < text.length) {
      const newline = text.lastIndexOf('\n', end - 1);
      if (newline >= offset) end = newline + 1;
      else if (/[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    }
    chunks.push(text.slice(offset, end));
    offset = end;
  }
  return chunks.map((chunk, index) => `Часть ${index + 1}/${chunks.length}\n${chunk}`);
}

function createIntegrations(env = process.env, dependencies = {}) {
  if (!env.GOOGLE_SHEETS_ID || !env.GOOGLE_SHEETS_CREDENTIALS || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    throw new Error('Order integrations are not configured');
  }
  const credentials = JSON.parse(env.GOOGLE_SHEETS_CREDENTIALS);
  const client = dependencies.client || google.sheets({ version: 'v4', auth: new google.auth.JWT({
    email: credentials.client_email, key: credentials.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  }) });
  const options = { timeout: 10000, retry: false };
  const listSheets = async () => {
    const response = await client.spreadsheets.get({ spreadsheetId: env.GOOGLE_SHEETS_ID,
      fields: 'sheets(properties(sheetId,title),developerMetadata(metadataKey,metadataValue))' }, options);
    return response.data.sheets || [];
  };
  const findIn = (all, id) => {
    const sheet = all.find((entry) => entry.developerMetadata?.some((m) => m.metadataKey === 'grocery_order' && m.metadataValue === id));
    return sheet ? { id, sheetId: sheet.properties.sheetId, sheetsDone: true,
      hash: sheet.developerMetadata.find((m) => m.metadataKey === 'grocery_order_hash')?.metadataValue } : null;
  };
  const checkHash = (existing, order) => {
    if (existing.hash && existing.hash !== order.hash) throw new OrderError(409, 'Этот запрос уже принят с другим составом.');
  };
  return {
    sheets: {
      async find(id) { return findIn(await listSheets(), id); },
      async ensure(order) {
      const all = await listSheets();
      const accepted = findIn(all, order.id);
      if (accepted) { checkHash(accepted, order); return false; }
      const existing = all.find((sheet) => sheet.properties.sheetId === order.sheetId);
      if (existing) {
        throw new Error('Sheet identifier collision; refusing to overwrite another sheet');
      }
      const date = dateParts(order.createdAt);
      const customer = (order.payload.customerName || order.payload.address || '').trim()
        .replace(/[\n\r]+/g, ' ').replace(/[\[\]:*?/\\]/g, '').replace(/\s+/g, ' ').slice(0, 80) || 'Customer';
      const base = `${date.ms}#${customer}_${date.shortDate}_${date.time}`.slice(0, 99);
      let title = base, suffix = 1;
      while (all.some((sheet) => sheet.properties.title === title)) {
        const ending = ` (${++suffix})`;
        title = `${base.slice(0, 99 - ending.length)}${ending}`;
      }
      // Adding a fixed sheetId, data, styling and marker in ONE atomic batch makes a
      // lost response recoverable. Retrying cannot create a second sheet with that ID.
      try {
        await client.spreadsheets.batchUpdate({ spreadsheetId: env.GOOGLE_SHEETS_ID,
          resource: { requests: buildSheetRequests(order, title) } }, options);
        return true;
      } catch (error) {
        // Handles both a concurrent create and a committed batch whose response was lost.
        const recovered = findIn(await listSheets(), order.id);
        if (!recovered) throw error;
        checkHash(recovered, order);
        console.warn('Existing order recovered; Telegram not resent', { orderId: order.id });
        return false;
      }
    } },
    telegram: { async send(order) {
      const parts = splitTelegramMessage(telegramMessage(order));
      const deadline = Date.now() + 20000;
      for (const text of parts) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw new Error('Telegram time budget exceeded');
        const response = await (dependencies.transport || axios).post(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          { chat_id: env.TELEGRAM_CHAT_ID, text }, { timeout: Math.min(5000, remaining) });
        if (!response.data?.ok) throw new Error('Telegram rejected the message');
      }
    } },
  };
}
module.exports = { createIntegrations, buildSheetRequests, telegramMessage, splitTelegramMessage };
