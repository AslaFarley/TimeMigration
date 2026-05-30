import fs from 'fs';

const zipBuffer = fs.readFileSync('dist.zip');
const zipBase64 = zipBuffer.toString('base64');

const payload = {
  slug: 'time-migration',
  title: 'Time Migration',
  tagline: 'A narrative time-jumping adventure across historical eras',
  description: 'Experience different historical eras through time migration. Built with React + TypeScript.',
  framework: 'html',
  sourceType: 'zip',
  files: {},
  zip: zipBase64
};

const body = JSON.stringify(payload);
console.log('Payload size:', (Buffer.byteLength(body) / 1024).toFixed(1), 'KB');

try {
  const response = await fetch('https://gapp.so/api/deploy', {
    method: 'POST',
    headers: {
      'x-api-key': 'gapp_6d9d224752a91c8fba77c44c9e682fdc34d1e287',
      'Content-Type': 'application/json'
    },
    body
  });
  const text = await response.text();
  console.log('Status:', response.status);
  console.log('Response:', text);
} catch (e) {
  console.error('Error:', e.message);
}