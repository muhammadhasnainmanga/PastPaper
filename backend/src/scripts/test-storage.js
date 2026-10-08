const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { uploadFile, getFileStream, fileExists, deleteFile } = require('../services/storage.js');

(async () => {
  const key = 'test/hello.pdf';
  try {
    await uploadFile(key, Buffer.from('%PDF-1.4 test file'));
    console.log('1. uploaded');

    console.log('2. exists:', await fileExists(key));

    const { stream, size } = await getFileStream(key);
    let bytes = 0;
    for await (const chunk of stream) bytes += chunk.length;
    console.log(`3. downloaded, ${bytes} bytes (stored size ${size})`);

    await deleteFile(key);
    console.log('4. deleted, exists now:', await fileExists(key));
    console.log('Storage works.');
  } catch (err) {
    console.error('Storage test failed:', err.name, '-', err.message);
    process.exit(1);
  }
})();