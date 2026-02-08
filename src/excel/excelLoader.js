const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const textDecoder = new TextDecoder('utf-8');

export const normalizeProductName = (value) =>
  value ? value.toString().trim().toLowerCase() : '';

const parsePriceValue = (rawValue) => {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  if (typeof rawValue === 'number') {
    return rawValue;
  }

  const numeric = Number.parseFloat(rawValue.toString().trim().replace(',', '.'));

  return Number.isNaN(numeric) ? null : numeric;
};
const parseWorkbookSheetNames = (xmlText) => {
  if (!xmlText) {
    return [];
  }

  const document = new DOMParser().parseFromString(xmlText, 'application/xml');
  const sheets = Array.from(document.getElementsByTagName('sheet'));

  return sheets.map((sheet) => ({
    name: sheet.getAttribute('name') ?? '',
    relationId: sheet.getAttribute('r:id') ?? '',
    sheetId: sheet.getAttribute('sheetId') ?? '',
  }));
};

const parseWorkbookRelationships = (xmlText) => {
  if (!xmlText) {
    return new Map();
  }

  const document = new DOMParser().parseFromString(xmlText, 'application/xml');
  const relationships = Array.from(document.getElementsByTagName('Relationship'));
  const relationshipMap = new Map();

  relationships.forEach((relationship) => {
    const id = relationship.getAttribute('Id');
    const target = relationship.getAttribute('Target');
    if (id && target) {
      relationshipMap.set(id, target);
    }
  });

  return relationshipMap;
};

const columnLabelToIndex = (label) => {
  let index = 0;
  for (let i = 0; i < label.length; i += 1) {
    const charCode = label.charCodeAt(i);
    index = index * 26 + (charCode - 64);
  }
  return index - 1;
};

const extractCellValue = (cell, sharedStrings) => {
  const type = cell.getAttribute('t');

  if (type === 's') {
    const valueNode = cell.getElementsByTagName('v')[0];
    if (!valueNode) {
      return '';
    }
    const index = Number.parseInt(valueNode.textContent ?? '', 10);
    return Number.isNaN(index) ? '' : sharedStrings[index] ?? '';
  }

  if (type === 'inlineStr') {
    const textNode = cell.getElementsByTagName('t')[0];
    return textNode ? textNode.textContent ?? '' : '';
  }

  const valueNode = cell.getElementsByTagName('v')[0];
  if (valueNode) {
    return valueNode.textContent ?? '';
  }

  const textNode = cell.getElementsByTagName('t')[0];
  return textNode ? textNode.textContent ?? '' : '';
};

const parseSharedStrings = (xmlText) => {
  if (!xmlText) {
    return [];
  }

  const document = new DOMParser().parseFromString(xmlText, 'application/xml');
  const nodes = Array.from(document.getElementsByTagName('si'));

  return nodes.map((node) => {
    const textFragments = Array.from(node.getElementsByTagName('t')).map(
      (item) => item.textContent ?? ''
    );

    return textFragments.length > 0 ? textFragments.join('') : node.textContent ?? '';
  });
};

const parseSheetRows = (xmlText, sharedStrings) => {
  if (!xmlText) {
    return [];
  }

  const document = new DOMParser().parseFromString(xmlText, 'application/xml');
  const rows = Array.from(document.getElementsByTagName('row'));

  return rows.map((row) => {
    const cells = Array.from(row.getElementsByTagName('c'));
    const rowValues = [];

    cells.forEach((cell) => {
      const reference = cell.getAttribute('r');
      let columnIndex = rowValues.length;

      if (reference) {
        const columnLabel = reference.replace(/\d+/g, '');
        if (columnLabel) {
          columnIndex = columnLabelToIndex(columnLabel);
        }
      }

      rowValues[columnIndex] = extractCellValue(cell, sharedStrings);
    });

    return rowValues;
  });
};

const findEndOfCentralDirectory = (view) => {
  for (let i = view.byteLength - 22; i >= 0; i -= 1) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) {
      return i;
    }
  }

  throw new Error('Не удалось найти конец ZIP архива.');
};

const parseCentralDirectory = (view, buffer, offset, totalEntries) => {
  const entries = new Map();
  let cursor = offset;

  for (let i = 0; i < totalEntries; i += 1) {
    const signature = view.getUint32(cursor, true);

    if (signature !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error('Неверная структура центрального каталога ZIP.');
    }

    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const fileNameLength = view.getUint16(cursor + 28, true);
    const extraFieldLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);

    const fileNameBytes = new Uint8Array(buffer, cursor + 46, fileNameLength);
    const fileName = textDecoder.decode(fileNameBytes);

    entries.set(fileName, {
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    cursor += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return entries;
};

const readLocalFile = (view, buffer, entry) => {
  const { localHeaderOffset, compressedSize } = entry;
  const signature = view.getUint32(localHeaderOffset, true);

  if (signature !== LOCAL_FILE_HEADER_SIGNATURE) {
    throw new Error('Неверный заголовок файла в ZIP.');
  }

  const compressionMethod = view.getUint16(localHeaderOffset + 8, true);
  const fileNameLength = view.getUint16(localHeaderOffset + 26, true);
  const extraFieldLength = view.getUint16(localHeaderOffset + 28, true);
  const dataStart = localHeaderOffset + 30 + fileNameLength + extraFieldLength;
  const dataEnd = dataStart + compressedSize;

  return {
    compressionMethod,
    compressedData: buffer.slice(dataStart, dataEnd),
  };
};

const decompressEntry = async (compressionMethod, compressedBuffer) => {
  if (compressionMethod === 0) {
    return new Uint8Array(compressedBuffer);
  }

  if (compressionMethod === 8) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error(
        'Браузер не поддерживает распаковку формата Excel. Попробуйте обновить браузер.'
      );
    }

    const stream = new DecompressionStream('deflate-raw');
    const response = new Response(compressedBuffer);
    const decompressedStream = response.body?.pipeThrough(stream);
    if (!decompressedStream) {
      throw new Error('Не удалось распаковать данные Excel файла.');
    }
    const decompressedBuffer = await new Response(decompressedStream).arrayBuffer();
    return new Uint8Array(decompressedBuffer);
  }

  throw new Error(`Неподдерживаемый метод сжатия ZIP: ${compressionMethod}`);
};

const readEntryAsText = async (entries, name, buffer, view) => {
  const entry = entries.get(name);
  if (!entry) {
    return null;
  }

  const { compressionMethod, compressedData } = readLocalFile(view, buffer, entry);

  if (compressedData.byteLength === 0) {
    return '';
  }

  const decompressed = await decompressEntry(compressionMethod, compressedData);
  return textDecoder.decode(decompressed);
};

export const readExcelPriceMap = async (arrayBuffer) => {
  const view = new DataView(arrayBuffer);
  const endOfCentralDirectoryOffset = findEndOfCentralDirectory(view);
  const totalEntries = view.getUint16(endOfCentralDirectoryOffset + 10, true);
  const centralDirectoryOffset = view.getUint32(endOfCentralDirectoryOffset + 16, true);

  const entries = parseCentralDirectory(view, arrayBuffer, centralDirectoryOffset, totalEntries);

  const worksheetEntryName = Array.from(entries.keys())
    .filter((name) => name.startsWith('xl/worksheets/') && name.endsWith('.xml'))
    .sort()[0] ?? 'xl/worksheets/sheet1.xml';

  const sharedStringsXml = await readEntryAsText(entries, 'xl/sharedStrings.xml', arrayBuffer, view);
  const sharedStrings = parseSharedStrings(sharedStringsXml);
  const worksheetXml = await readEntryAsText(entries, worksheetEntryName, arrayBuffer, view);
  const rows = parseSheetRows(worksheetXml, sharedStrings);
  const priceMap = new Map();

  rows.forEach((row) => {
    if (!row || row.length === 0) {
      return;
    }

    const [nameCell, priceCell] = row;
    const normalizedName = normalizeProductName(nameCell);
    if (!normalizedName) {
      return;
    }

    const numericPrice = parsePriceValue(priceCell);
    if (numericPrice === null) {
      return;
    }

    priceMap.set(normalizedName, numericPrice);
  });

  return priceMap;
};

const resolveSheetEntryName = (target) => {
  if (!target) {
    return null;
  }
  if (target.startsWith('xl/')) {
    return target;
  }

  return `xl/${target.replace(/^\/+/, '')}`;
};

const buildProductId = (rawId, categoryPrefix) => {
  if (rawId === undefined || rawId === null) {
    return null;
  }

  const trimmedId = rawId.toString().trim();
  if (!trimmedId) {
    return null;
  }

  const prefix = categoryPrefix ? String(categoryPrefix) : '';
  const combinedId = prefix && !trimmedId.startsWith(prefix) ? `${prefix}${trimmedId}` : trimmedId;
  const numericId = Number.parseInt(combinedId, 10);

  return Number.isNaN(numericId) ? null : numericId;
};

export const readExcelCatalog = async (arrayBuffer, options = {}) => {
  const { categoryPrefixMap = {} } = options;
  const view = new DataView(arrayBuffer);
  const endOfCentralDirectoryOffset = findEndOfCentralDirectory(view);
  const totalEntries = view.getUint16(endOfCentralDirectoryOffset + 10, true);
  const centralDirectoryOffset = view.getUint32(endOfCentralDirectoryOffset + 16, true);

  const entries = parseCentralDirectory(view, arrayBuffer, centralDirectoryOffset, totalEntries);
  const sharedStringsXml = await readEntryAsText(entries, 'xl/sharedStrings.xml', arrayBuffer, view);
  const sharedStrings = parseSharedStrings(sharedStringsXml);

  const workbookXml = await readEntryAsText(entries, 'xl/workbook.xml', arrayBuffer, view);
  const workbookRelsXml = await readEntryAsText(
    entries,
    'xl/_rels/workbook.xml.rels',
    arrayBuffer,
    view
  );

  const sheets = parseWorkbookSheetNames(workbookXml);
  const relationships = parseWorkbookRelationships(workbookRelsXml);

  const sheetEntries = sheets
    .map((sheet) => {
      const target = relationships.get(sheet.relationId);
      const entryName = resolveSheetEntryName(target) || `xl/worksheets/sheet${sheet.sheetId}.xml`;
      return {
        name: sheet.name.trim(),
        entryName,
      };
    })
    .filter((sheet) => sheet.name);

  if (sheetEntries.length === 0) {
    throw new Error('Не удалось найти листы с данными в Excel файле.');
  }

  const categories = [];
  const productsByCategory = {};

  for (let i = 0; i < sheetEntries.length; i += 1) {
    const sheet = sheetEntries[i];
    const worksheetXml = await readEntryAsText(entries, sheet.entryName, arrayBuffer, view);
    const rows = parseSheetRows(worksheetXml, sharedStrings);
    const products = [];
    const categoryPrefix = categoryPrefixMap[sheet.name];

    rows.forEach((row) => {
      if (!row || row.length === 0) {
        return;
      }

      const [idCell, nameCell, priceCell] = row;
      const productName = nameCell ? nameCell.toString().trim() : '';
      const price = parsePriceValue(priceCell);
      const productId = buildProductId(idCell, categoryPrefix);

      if (!productName || price === null || productId === null) {
        return;
      }

      products.push({
        id: productId,
        name: productName,
        catalogueName: productName,
        price,
      });
    });

    categories.push({
      id: categoryPrefix ?? i + 1,
      name: sheet.name,
    });

    productsByCategory[sheet.name] = products;
  }

  return { categories, productsByCategory };
};