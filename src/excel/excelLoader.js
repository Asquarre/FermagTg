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