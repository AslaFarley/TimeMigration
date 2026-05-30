import https from 'https';
import fs from 'fs';
import path from 'path';

function readDirFlat(dir, prefix) {
  let files = {};
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = prefix ? prefix + '/' + e.name : e.name;
    if (e.isFile()) {
      files[rel] = fs.readFileSync(full, 'utf-8');
    } else if (e.isDirectory()) {
      Object.assign(files, readDirFlat(full, rel));
    }
  }
  return files;
}

const files = readDirFlat('./dist', '');

const body = JSON.stringify({
  slug: 'time-migration',
  title: 'Time Migration',
  tagline: 'A narrative time-jumping adventure across eras',
  description: 'Experience different historical eras through time migration in this interactive narrative game.',
  framework: 'react',
  sourceType: 'paste',
  files: files
});

console.log('Payload size:', (Buffer.byteLength(body) / 1024).toFixed(1), 'KB');

const req = https.request({
  hostname: 'gapp.so',
  path: '/api/deploy',
  method: 'POST',
  headers: {
    'x-api-key': 'gapp_6d9d224752a91c8fba77c44c9e682fdc34d1e287',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  },
  timeout: 120000
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    try {
      const j = JSON.parse(data);
      if (j.success) {
        console.log('DEPLOY SUCCESS!');
        console.log('URL:', j.app?.url || j.url || JSON.stringify(j.app));
      }
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
});

req.on('error', e => console.error('Error:', e.message));
req.on('timeout', () => {
  req.destroy();
  console.error('Request timed out after 120s');
});
req.write(body);
req.end();