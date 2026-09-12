const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  // 8-byte signature
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image scanlines
  // Each scanline begins with 1 filter byte (0 = none), followed by width * 4 bytes
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 512;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData.writeUInt8(0, rowOffset); // filter 0

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Distance from center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: deep zinc/charcoal #0f172a or #18181b
      let r = 24, g = 24, b = 27, a = 255;

      // If rounded card border for non-maskable
      const cornerRadius = 90 * scale;
      const rx = Math.abs(x - cx);
      const ry = Math.abs(y - cy);
      const hw = (width / 2) - 8 * scale;
      const hh = (height / 2) - 8 * scale;

      // Door rectangle:
      const doorW = 200 * scale;
      const doorH = 290 * scale;
      const doorX1 = cx - doorW / 2;
      const doorX2 = cx + doorW / 2;
      const doorY1 = cy - doorH / 2 + 10 * scale;
      const doorY2 = cy + doorH / 2 + 10 * scale;

      // Outer frame
      const frameThick = 6 * scale;
      const inDoor = x >= doorX1 && x <= doorX2 && y >= doorY1 && y <= doorY2;
      const inFrame = (x >= doorX1 - frameThick && x <= doorX2 + frameThick && y >= doorY1 - frameThick && y <= doorY2 + frameThick);

      if (inDoor) {
        // Door inner
        r = 39; g = 39; b = 42;
        // Inner panels
        const p1Y1 = doorY1 + 20 * scale;
        const p1Y2 = doorY1 + 110 * scale;
        const p2Y1 = doorY1 + 130 * scale;
        const p2Y2 = doorY2 - 20 * scale;
        const pX1 = doorX1 + 15 * scale;
        const pX2 = doorX2 - 15 * scale;

        if (x >= pX1 && x <= pX2 && ((y >= p1Y1 && y <= p1Y2) || (y >= p2Y1 && y <= p2Y2))) {
          r = 20; g = 20; b = 23;
        }

        // Lock / handle
        const handleX = doorX2 - 25 * scale;
        const handleY = cy + 15 * scale;
        const hDist = Math.hypot(x - handleX, y - handleY);
        if (hDist <= 8 * scale) {
          // Emerald accent #10b981
          r = 16; g = 185; b = 129;
        }
      } else if (inFrame) {
        r = 63; g = 63; b = 70;
      } else {
        // Background subtle gradient
        const t = y / height;
        r = Math.round(24 * (1 - t * 0.3));
        g = Math.round(24 * (1 - t * 0.3));
        b = Math.round(27 * (1 - t * 0.3));

        // Signal wave above door
        const waveY = doorY1 - 25 * scale;
        if (Math.abs(y - waveY) <= 3 * scale && Math.abs(x - cx) <= 35 * scale) {
          r = 16; g = 185; b = 129;
        }
      }

      rawData.writeUInt8(r, pxOffset);
      rawData.writeUInt8(g, pxOffset + 1);
      rawData.writeUInt8(b, pxOffset + 2);
      rawData.writeUInt8(a, pxOffset + 3);
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(__dirname, '../public');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180));
console.log('PWA PNG icons generated successfully in public/');
