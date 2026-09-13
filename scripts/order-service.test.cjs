const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createOrderService, publicStatus, sheetIdFor } = require('../server/order-service.cjs');
const { createIntegrations, buildSheetRequests, telegramMessage, splitTelegramMessage } = require('../server/order-integrations.cjs');
const catalog = { productsByCategory: { Test: [
  { id: '0012', name: 'Хлеб', catalogueName: 'Хлеб', price: 150 },
  { id: '0001', name: 'Молоко', catalogueName: 'Молоко цельное', price: 250 },
] } };
const body = () => ({ orderId: randomUUID(), customerName: 'Тест', phone: '+77001234567', address: '', fulfillmentType: 'Самовывоз', items: [{id:'0012', price:150, quantity:1.5}] });
function setup(testCatalog = catalog) {
  const saved = [];
  const batches = [], messages = [];
  const stats = { writes: 0, sends: 0, formattingFails: false, googleResponseLost: false, telegramFails: false };
  const client = { spreadsheets: {
    get: async () => ({data:{sheets:structuredClone(saved)}}),
    batchUpdate: async ({resource}) => {
      batches.push(resource.requests);
      if (stats.formattingFails) throw Error('Formatting rejected: atomic batch not committed');
      const properties = resource.requests[0].addSheet.properties;
      if (saved.some(s => s.properties.sheetId === properties.sheetId)) throw Error('Duplicate sheet ID');
      stats.writes++;
      saved.push({properties, developerMetadata: resource.requests.filter(r=>r.createDeveloperMetadata).map(r=>r.createDeveloperMetadata.developerMetadata)});
      if (stats.googleResponseLost) { stats.googleResponseLost = false; throw Error('Response lost after commit'); }
      return {};
    },
  } };
  const transport = {post: async (url, message) => {
    messages.push(message);
    stats.sends++;
    if (stats.telegramFails || stats.telegramFailAt === stats.sends) throw Error('Telegram response lost');
    return {data:{ok:true}};
  }};
  const env = {GOOGLE_SHEETS_ID:'test',GOOGLE_SHEETS_CREDENTIALS:'{}',TELEGRAM_BOT_TOKEN:'test',TELEGRAM_CHAT_ID:'test'};
  const makeService = () => createOrderService({...createIntegrations(env, {client, transport}), catalog: testCatalog});
  return { stats, saved, batches, messages, makeService };
}
test('simultaneous requests and cold-start replay create one sheet and one message', async () => {
  const h=setup(), request=body();
  const results = await Promise.all([h.makeService().submit(request), h.makeService().submit(request), h.makeService().submit(request)]);
  assert(results.every(o=>publicStatus(o).status==='confirmed'));
  await h.makeService().submit(request);
  assert.equal(h.stats.writes,1); assert.equal(h.stats.sends,1);
});
test('lost Google response is recovered without a second sheet or speculative Telegram send', async () => {
  const h=setup(), request=body(); h.stats.googleResponseLost=true;
  assert.equal((await h.makeService().submit(request)).sheetsDone,true);
  assert.equal((await h.makeService().find(request.orderId)).sheetsDone,true);
  await h.makeService().submit(request);
  assert.equal(h.stats.writes,1); assert.equal(h.stats.sends,0);
});
test('formatting failure does not save partial data, confirm or send Telegram', async () => {
  const h=setup(), request=body(); h.stats.formattingFails=true;
  await assert.rejects(h.makeService().submit(request));
  assert.equal(await h.makeService().find(request.orderId),null);
  assert.equal(h.stats.writes,0); assert.equal(h.stats.sends,0);
  h.stats.formattingFails=false;
  assert.equal((await h.makeService().submit(request)).sheetsDone,true);
  assert.equal(h.stats.writes,1); assert.equal(h.stats.sends,1);
});
test('Telegram failure does not fail the accepted order or resend on replay', async () => {
  const h=setup(), request=body(); h.stats.telegramFails=true;
  assert.equal(publicStatus(await h.makeService().submit(request)).status,'confirmed');
  await h.makeService().submit(request);
  assert.equal(h.stats.writes,1); assert.equal(h.stats.sends,1);
});
test('same ID with different contents is rejected; new prices are validated', async () => {
  const h=setup(), request=body();
  await h.makeService().submit(request);
  await assert.rejects(h.makeService().submit({...request,items:[{...request.items[0],quantity:2}]}),{status:409});
  await assert.rejects(h.makeService().submit({...body(),items:[{id:'0012',price:1,quantity:1}]}),{status:409});
});
test('same ID stays stable across processes; sheet ID collision never overwrites another order', async () => {
  const h=setup(), request=body();
  assert.equal(sheetIdFor(request.orderId),sheetIdFor(request.orderId.toUpperCase()));
  h.saved.push({properties:{sheetId:sheetIdFor(request.orderId)},developerMetadata:[]});
  await assert.rejects(h.makeService().submit(request),/collision/);
  assert.equal(h.stats.writes,0); assert.equal(h.stats.sends,0);
});
test('intentional new order with the same cart gets a separate sheet', async () => {
  const h=setup(); await h.makeService().submit(body()); await h.makeService().submit(body());
  assert.equal(h.stats.writes,2); assert.equal(h.stats.sends,2);
});
test('atomic batch preserves quantities, formulas, formatting and only hidden IDs', () => {
  const order={id:randomUUID(),hash:'hash',sheetId:123,createdAt:new Date().toISOString(),total:225,
    payload:{...body(),items:[{id:'INTERNAL-SKU',name:'Хлеб',catalogueName:'Хлеб',quantity:1.5,price:150}]}};
  const requests=buildSheetRequests(order,'Тестовый заказ');
  const rows=requests[1].updateCells.rows;
  assert.equal(rows[8].values[1].userEnteredValue.numberValue,1.5);
  assert.equal(rows[8].values[3].userEnteredValue.formulaValue,'=B9*C9');
  assert.equal(rows[4].values[1].userEnteredValue.numberValue,225);
  assert(requests.some(r=>r.repeatCell));
  assert(!JSON.stringify(rows).includes(order.id));
  assert(!telegramMessage(order).includes('INTERNAL-SKU'));
  assert(!telegramMessage(order).includes(order.id));
  order.payload.items=Array.from({length:150},(_,i)=>({name:`Товар ${i} ${'x'.repeat(50)}`,quantity:2,price:10}));
  const message=telegramMessage(order);
  assert.equal(typeof message,'string'); assert(message.length>4096);
  assert(!message.includes('Часть '));
  for(let i=0;i<150;i++) assert(message.includes(`Товар ${i} `));
});

test('original basket order, client timestamp, title and single Telegram message are preserved', async () => {
  const h=setup(), request={...body(),timestamp:'2026-09-12T20:34:56.123Z'};
  request.items.push({id:'0001',quantity:2,price:250});
  await h.makeService().submit(request);
  assert.equal(h.saved[0].properties.title,'123#Тест_13.09_01:34');
  const rows=h.batches[0][1].updateCells.rows;
  assert.equal(rows[8].values[0].userEnteredValue.stringValue,'Хлеб');
  assert.equal(rows[9].values[0].userEnteredValue.stringValue,'Молоко цельное');
  assert.equal(rows[9].values[3].userEnteredValue.formulaValue,'=B10*C10');
  assert.deepEqual(h.messages,[{chat_id:'test',text:[
    '13.09.2026 01:34','','🛒 Новый заказ','👨Покупатель: Тест','📞Телефон: +77001234567',
    '📍Адрес: Не указан','🚛Доставка/самовывоз: Самовывоз','','Товары:',
    '• Хлеб x1.5 (150.00 ₸)','• Молоко x2 (250.00 ₸)','','Итог: 725.00 ₸',
  ].join('\n')}]);
  // The old canonical hash still matches even when the retry has sorted items.
  await h.makeService().submit({...request,items:[...request.items].reverse()});
  assert.equal(h.stats.writes,1); assert.equal(h.stats.sends,1);
});

test('original currency pattern and cell ranges are restored without replacing highlights', () => {
  const requests=buildSheetRequests({id:randomUUID(),hash:'hash',sheetId:123,
    createdAt:'2026-09-12T12:34:56.123Z',total:225,
    payload:{...body(),items:[{catalogueName:'Хлеб',quantity:1.5,price:150}]}},'Тест');
  const money=requests.filter(r=>r.repeatCell?.cell.userEnteredFormat.numberFormat).map(r=>r.repeatCell);
  assert.deepEqual(money.map(r=>[r.range.startRowIndex,r.range.endRowIndex,r.range.startColumnIndex,r.range.endColumnIndex]),
    [[4,5,3,4],[9,10,3,4],[8,9,3,4]]);
  for(const r of money) {
    assert.deepEqual(r.cell.userEnteredFormat,{numberFormat:{type:'CURRENCY',pattern:'[$₸-kk_KZ] #,##0.00'}});
    assert.equal(r.fields,'userEnteredFormat.numberFormat');
  }
  const yellow=requests.filter(r=>r.repeatCell?.cell.userEnteredFormat.backgroundColor);
  assert.equal(yellow.length,3);
  assert(yellow.every(r=>r.repeatCell.fields==='userEnteredFormat(backgroundColor,textFormat)'));
});

test('Telegram splitting preserves short messages, boundaries, all text and emoji', () => {
  for (const text of ['Обычный заказ\nИтог: 10.00 ₸', 'я'.repeat(4096)]) {
    assert.deepEqual(splitTelegramMessage(text), [text]);
  }
  for (const text of ['я'.repeat(4097), 'я'.repeat(3999) + '🛒'.repeat(3000),
    Array.from({length:150}, (_,i)=>`• Товар ${i} ${'я'.repeat(50)} x2 (150.00 ₸)`).join('\n')]) {
    const parts = splitTelegramMessage(text);
    assert(parts.length > 1);
    assert(parts.every(part => part.length <= 4096));
    const chunks = parts.map((part, i) => {
      const prefix = `Часть ${i + 1}/${parts.length}\n`;
      assert(part.startsWith(prefix));
      const chunk = part.slice(prefix.length);
      assert(!/^[\uDC00-\uDFFF]/.test(chunk));
      assert(!/[\uD800-\uDBFF]$/.test(chunk));
      return chunk;
    });
    assert.equal(chunks.join(''), text);
    if (text.includes('\n')) assert(chunks.slice(0,-1).every(chunk => chunk.endsWith('\n')));
  }
});

function longOrderSetup() {
  const products = Array.from({length:150}, (_,i)=>({id:String(i),name:`Товар ${i} ${'я'.repeat(50)}`,price:150}));
  return {h:setup({productsByCategory:{Test:products}}),request:{...body(),
    items:products.map(p=>({id:p.id,price:p.price,quantity:1}))}};
}

test('long order sends each part once and does not resend on concurrent request or replay', async () => {
  const {h,request}=longOrderSetup();
  const [order] = await Promise.all([h.makeService().submit(request),h.makeService().submit(request)]);
  const expected = splitTelegramMessage(telegramMessage(order));
  assert(expected.length > 1);
  assert.deepEqual(h.messages.map(m=>m.text),expected);
  await h.makeService().submit(request);
  assert.equal(h.stats.writes,1);
  assert.equal(h.stats.sends,expected.length);
});

test('failure midway through Telegram parts stops sending and replay does not duplicate parts', async () => {
  const {h,request}=longOrderSetup();
  h.stats.telegramFailAt=2;
  assert.equal(publicStatus(await h.makeService().submit(request)).status,'confirmed');
  assert.equal(h.stats.sends,2);
  await h.makeService().submit(request);
  assert.equal(h.stats.sends,2);
  assert.equal(h.stats.writes,1);
});
