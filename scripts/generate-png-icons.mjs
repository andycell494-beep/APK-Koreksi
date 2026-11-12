import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePng(width, height, isMaskable = false) {
  // PNG signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter type 0 before each scanline
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const rCorner = width * 0.22;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter none
    for (let x = 0; x < width; x++) {
      // Background gradient (indigo #4f46e5 to purple #7c3aed)
      const t = (x + y) / (width + height);
      let r = Math.round(79 + (124 - 79) * t);
      let g = Math.round(70 + (58 - 70) * t);
      let b = Math.round(229 + (237 - 229) * t);
      let a = 255;

      // Rounded rectangle for non-maskable icons
      if (!isMaskable) {
        // Safe check for rounded corners
        const qx = Math.max(rCorner - x, 0, x - (width - rCorner));
        const qy = Math.max(rCorner - y, 0, y - (height - rCorner));
        if (qx > 0 && qy > 0 && (qx * qx + qy * qy > rCorner * rCorner)) {
          a = 0;
        }
      }

      if (a > 0) {
        // Paper document sheet in center
        const paperW = width * 0.44;
        const paperH = height * 0.60;
        const paperX = width * 0.22;
        const paperY = height * 0.20;

        if (x >= paperX && x <= paperX + paperW && y >= paperY && y <= paperY + paperH) {
          // White paper
          r = 255;
          g = 255;
          b = 255;

          // Lines on paper
          const relY = y - paperY;
          if ((relY > paperH * 0.18 && relY < paperH * 0.24) ||
              (relY > paperH * 0.32 && relY < paperH * 0.38) ||
              (relY > paperH * 0.46 && relY < paperH * 0.52)) {
            r = 226; g = 232; b = 240; // Slate 200
          }
        }

        // Gold Score Badge
        const badgeCx = width * 0.70;
        const badgeCy = height * 0.65;
        const badgeR = width * 0.18;
        const distSq = (x - badgeCx) * (x - badgeCx) + (y - badgeCy) * (y - badgeCy);
        if (distSq <= badgeR * badgeR) {
          // Gold #f59e0b
          r = 245; g = 158; b = 11;
          if (distSq <= (badgeR - 2) * (badgeR - 2)) {
            r = 251; g = 191; b = 36;
          }
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));
console.log('Successfully generated PWA PNG icons!');
