import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

export const generateSamplePdf = () => {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 73 >>
stream
BT
/F1 24 Tf
100 700 Td
(PS White - Sample Reader PDF) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000242 00000 n 
0000000366 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
443
%%EOF`;

  return Buffer.from(content, 'utf-8');
};

/**
 * Creates a minimal valid uncompressed ZIP containing an EPUB structure.
 */
export const generateSampleEpub = () => {
  const files = [
    { name: 'mimetype', data: Buffer.from('application/epub+zip', 'utf-8'), noCompress: true },
    {
      name: 'META-INF/container.xml',
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
        'utf-8'
      ),
    },
    {
      name: 'OEBPS/content.opf',
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>PS White Sample Book</dc:title>
    <dc:creator>PS White</dc:creator>
    <dc:identifier id="BookID">urn:uuid:12345</dc:identifier>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="ch1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch2" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch3" href="chapter3.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="ch1"/>
    <itemref idref="ch2"/>
    <itemref idref="ch3"/>
  </spine>
</package>`,
        'utf-8'
      ),
    },
    {
      name: 'OEBPS/toc.ncx',
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:12345"/></head>
  <docTitle><text>PS White Sample Book</text></docTitle>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel><text>Chapter 1: The Beginning</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
    <navPoint id="navPoint-2" playOrder="2">
      <navLabel><text>Chapter 2: The Journey</text></navLabel>
      <content src="chapter2.xhtml"/>
    </navPoint>
    <navPoint id="navPoint-3" playOrder="3">
      <navLabel><text>Chapter 3: The Truth</text></navLabel>
      <content src="chapter3.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`,
        'utf-8'
      ),
    },
    {
      name: 'OEBPS/chapter1.xhtml',
      data: Buffer.from(
        `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter 1</title></head>
<body>
  <h1>Chapter 1: The Beginning</h1>
  <p>The quiet monsoon rain settled over the small courtyard. In the stillness of evening, the author looked at the blank journal.</p>
</body>
</html>`,
        'utf-8'
      ),
    },
    {
      name: 'OEBPS/chapter2.xhtml',
      data: Buffer.from(
        `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter 2</title></head>
<body>
  <h1>Chapter 2: The Journey</h1>
  <p>Words began to form, sentence by sentence, carrying the echoes of memories long buried.</p>
</body>
</html>`,
        'utf-8'
      ),
    },
    {
      name: 'OEBPS/chapter3.xhtml',
      data: Buffer.from(
        `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter 3</title></head>
<body>
  <h1>Chapter 3: The Truth</h1>
  <p>And what was written could finally be spoken to the quiet world outside.</p>
</body>
</html>`,
        'utf-8'
      ),
    },
  ];

  // Build standard uncompressed ZIP buffer (Store mode 0x00)
  const zipParts = [];
  const cdParts = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf-8');
    const crc = 0; // Simple store
    const size = file.data.length;

    // Local file header: 30 bytes + nameBuf.length
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Signature
    localHeader.writeUInt16LE(20, 4); // Version needed
    localHeader.writeUInt16LE(0, 6); // Flags
    localHeader.writeUInt16LE(0, 8); // Compression: Store
    localHeader.writeUInt16LE(0, 10); // Mod time
    localHeader.writeUInt16LE(0, 12); // Mod date
    localHeader.writeUInt32LE(crc, 14); // CRC
    localHeader.writeUInt32LE(size, 18); // Comp size
    localHeader.writeUInt32LE(size, 22); // Uncomp size
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    zipParts.push(localHeader, nameBuf, file.data);

    // Central directory header: 46 bytes + nameBuf.length
    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0); // Signature
    cdHeader.writeUInt16LE(20, 4); // Version made by
    cdHeader.writeUInt16LE(20, 6); // Version needed
    cdHeader.writeUInt16LE(0, 8); // Flags
    cdHeader.writeUInt16LE(0, 10); // Compression
    cdHeader.writeUInt16LE(0, 12); // Time
    cdHeader.writeUInt16LE(0, 14); // Date
    cdHeader.writeUInt32LE(crc, 16); // CRC
    cdHeader.writeUInt32LE(size, 20); // Comp size
    cdHeader.writeUInt32LE(size, 24); // Uncomp size
    cdHeader.writeUInt16LE(nameBuf.length, 28);
    cdHeader.writeUInt16LE(0, 30); // Extra field
    cdHeader.writeUInt16LE(0, 32); // Comment
    cdHeader.writeUInt16LE(0, 34); // Disk num
    cdHeader.writeUInt16LE(0, 36); // Int attr
    cdHeader.writeUInt32LE(0, 38); // Ext attr
    cdHeader.writeUInt32LE(offset, 42); // Offset of local header

    cdParts.push(cdHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + file.data.length;
  }

  const cdStart = offset;
  let cdSize = 0;
  for (const part of cdParts) {
    cdSize += part.length;
  }

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...zipParts, ...cdParts, eocd]);
};

export const generateSampleMp3 = () => {
  // A series of valid MPEG-1 Layer 3 silent frames (sync header: 0xFF, 0xFB, 0x90, 0x64)
  const frame = Buffer.alloc(417);
  frame[0] = 0xff;
  frame[1] = 0xfb;
  frame[2] = 0x90;
  frame[3] = 0x64;

  const totalFrames = 10;
  return Buffer.concat(Array.from({ length: totalFrames }, () => frame));
};

export const generateAllSampleFiles = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const epubPath = path.join(uploadsDir, 'sample-book.epub');
  const pdfPath = path.join(uploadsDir, 'sample-book.pdf');
  const mp3Path = path.join(uploadsDir, 'sample-audio.mp3');

  fs.writeFileSync(epubPath, generateSampleEpub());
  fs.writeFileSync(pdfPath, generateSamplePdf());
  fs.writeFileSync(mp3Path, generateSampleMp3());

  console.log('Sample files generated:');
  console.log(`- ${epubPath} (${fs.statSync(epubPath).size} bytes)`);
  console.log(`- ${pdfPath} (${fs.statSync(pdfPath).size} bytes)`);
  console.log(`- ${mp3Path} (${fs.statSync(mp3Path).size} bytes)`);

  return { epubPath, pdfPath, mp3Path };
};

if (process.argv[1] && process.argv[1].endsWith('generateSampleFiles.js')) {
  generateAllSampleFiles();
}

export default generateAllSampleFiles;
