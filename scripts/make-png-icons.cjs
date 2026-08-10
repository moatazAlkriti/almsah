const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to write a simple valid PNG file buffer
function createSolidPng(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: 2 (truecolor)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk (pixel data)
  // Each scanline starts with filter byte (0), then width * 3 bytes (RGB)
  const lineLength = 1 + width * 3;
  const rawData = Buffer.alloc(height * lineLength);

  for (let y = 0; y < height; y++) {
    const offset = y * lineLength;
    rawData[offset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = offset + 1 + x * 3;
      // Add a nice dark gradient / border effect
      const isBorder = x < 8 || x >= width - 8 || y < 8 || y >= height - 8;
      if (isBorder) {
        rawData[pixelOffset] = 16;   // R
        rawData[pixelOffset + 1] = 185; // G (#10b981)
        rawData[pixelOffset + 2] = 129; // B
      } else {
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([len, body, crcBuf]);
}

// Simple CRC32 function for PNG chunk validation
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ -1) >>> 0;
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write PNG files (15, 23, 42) -> Slate 900 #0f172a
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createSolidPng(192, 192, 15, 23, 42));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createSolidPng(512, 512, 15, 23, 42));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createSolidPng(180, 180, 15, 23, 42));

console.log('Successfully generated PNG icons in /public');
