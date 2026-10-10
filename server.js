const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Admin credentials & auth tokens
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'fuel2025';
const activeTokens = new Set(['fuel-admin-session-active']);

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=UTF-8'
};

// Helper: Read JSON file safely
function readJsonFile(filename, defaultValue) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultValue;
  }
}

// Helper: Write JSON file safely
function writeJsonFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Helper: Parse request body (JSON)
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 20 * 1024 * 1024) { // 20MB limit
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body) return resolve({});
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        resolve({ _raw: body });
      }
    });
    req.on('error', reject);
  });
}

// Helper: Send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(JSON.stringify(data));
}

// Check admin auth
function isAuthenticated(req) {
  const authHeader = req.headers['authorization'] || '';
  const customHeader = req.headers['x-admin-token'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || customHeader;
  return activeTokens.has(token);
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // ----------------------------------------------------
  // API ROUTING
  // ----------------------------------------------------
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Admin Login
      if (pathname === '/api/admin/login' && req.method === 'POST') {
        const body = await parseRequestBody(req);
        if (body.username === ADMIN_USER && body.password === ADMIN_PASS) {
          const token = 'fuel-admin-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
          activeTokens.add(token);
          return sendJson(res, 200, {
            success: true,
            token,
            message: 'Login successful. Welcome back, Admin!'
          });
        }
        return sendJson(res, 401, { success: false, message: 'Invalid admin username or password.' });
      }

      // 2. Admin Check Auth
      if (pathname === '/api/admin/check-auth' && req.method === 'GET') {
        const valid = isAuthenticated(req);
        return sendJson(res, 200, { authenticated: valid });
      }

      // 3. Products Endpoints
      if (pathname === '/api/products') {
        if (req.method === 'GET') {
          const products = readJsonFile('products.json', []);
          return sendJson(res, 200, products);
        }

        if (req.method === 'POST') {
          if (!isAuthenticated(req)) return sendJson(res, 401, { error: 'Unauthorized' });
          const newProduct = await parseRequestBody(req);
          const products = readJsonFile('products.json', []);
          
          if (!newProduct.id) {
            newProduct.id = 'product-' + Date.now();
          }
          if (newProduct.price) newProduct.price = parseFloat(newProduct.price);
          if (newProduct.salePrice) newProduct.salePrice = parseFloat(newProduct.salePrice);
          if (typeof newProduct.inStock === 'undefined') newProduct.inStock = true;
          
          products.unshift(newProduct);
          writeJsonFile('products.json', products);
          return sendJson(res, 201, { success: true, product: newProduct });
        }
      }

      // Products CRUD by ID: /api/products/:id
      const productMatch = pathname.match(/^\/api\/products\/([^\/]+)$/);
      if (productMatch) {
        const prodId = productMatch[1];
        const products = readJsonFile('products.json', []);
        const idx = products.findIndex(p => String(p.id) === String(prodId));

        if (req.method === 'GET') {
          if (idx === -1) return sendJson(res, 404, { error: 'Product not found' });
          return sendJson(res, 200, products[idx]);
        }

        if (req.method === 'PUT') {
          if (!isAuthenticated(req)) return sendJson(res, 401, { error: 'Unauthorized' });
          if (idx === -1) return sendJson(res, 404, { error: 'Product not found' });
          const updates = await parseRequestBody(req);
          
          if (updates.price) updates.price = parseFloat(updates.price);
          if (updates.salePrice) updates.salePrice = parseFloat(updates.salePrice);
          
          products[idx] = { ...products[idx], ...updates, id: prodId };
          writeJsonFile('products.json', products);
          return sendJson(res, 200, { success: true, product: products[idx] });
        }

        if (req.method === 'DELETE') {
          if (!isAuthenticated(req)) return sendJson(res, 401, { error: 'Unauthorized' });
          if (idx === -1) return sendJson(res, 404, { error: 'Product not found' });
          const deleted = products.splice(idx, 1);
          writeJsonFile('products.json', products);
          return sendJson(res, 200, { success: true, deleted: deleted[0] });
        }
      }

      // 4. Site Content: GET & POST /api/content
      if (pathname === '/api/content') {
        if (req.method === 'GET') {
          const content = readJsonFile('site-content.json', {});
          return sendJson(res, 200, content);
        }

        if (req.method === 'POST') {
          if (!isAuthenticated(req)) return sendJson(res, 401, { error: 'Unauthorized' });
          const updates = await parseRequestBody(req);
          const content = readJsonFile('site-content.json', {});
          const merged = { ...content, ...updates };
          writeJsonFile('site-content.json', merged);
          return sendJson(res, 200, { success: true, message: 'Content updated successfully', content: merged });
        }
      }

      // 5. Worship Songs: GET & POST /api/worship
      if (pathname === '/api/worship') {
        if (req.method === 'GET') {
          const worship = readJsonFile('worship-songs.json', { english: [], telugu: [] });
          return sendJson(res, 200, worship);
        }

        if (req.method === 'POST') {
          if (!isAuthenticated(req)) return sendJson(res, 401, { error: 'Unauthorized' });
          const updates = await parseRequestBody(req);
          writeJsonFile('worship-songs.json', updates);
          return sendJson(res, 200, { success: true, message: 'Worship lyrics updated', worship: updates });
        }
      }

      // 6. Submissions: User prayer requests and salvation decisions
      if (pathname === '/api/submissions') {
        if (req.method === 'POST') {
          const sub = await parseRequestBody(req);
          const subs = readJsonFile('submissions.json', []);
          sub.id = 'sub-' + Date.now();
          sub.date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
          sub.status = sub.status || 'New';
          subs.unshift(sub);
          writeJsonFile('submissions.json', subs);
          return sendJson(res, 201, { success: true, message: 'Thank you! Your request has been received.' });
        }

        if (req.method === 'GET') {
          if (!isAuthenticated(req)) return sendJson(res, 401, { error: 'Unauthorized' });
          const subs = readJsonFile('submissions.json', []);
          return sendJson(res, 200, subs);
        }
      }

      // Delete submission: DELETE /api/submissions/:id
      const subMatch = pathname.match(/^\/api\/submissions\/([^\/]+)$/);
      if (subMatch && req.method === 'DELETE') {
        if (!isAuthenticated(req)) return sendJson(res, 401, { error: 'Unauthorized' });
        const subId = subMatch[1];
        const subs = readJsonFile('submissions.json', []);
        const idx = subs.findIndex(s => String(s.id) === String(subId));
        if (idx !== -1) {
          subs.splice(idx, 1);
          writeJsonFile('submissions.json', subs);
        }
        return sendJson(res, 200, { success: true });
      }

      // 7. Image Upload: POST /api/upload-image
      if (pathname === '/api/upload-image' && req.method === 'POST') {
        if (!isAuthenticated(req)) return sendJson(res, 401, { error: 'Unauthorized' });
        const body = await parseRequestBody(req);
        
        if (!body.base64Data) {
          return sendJson(res, 400, { error: 'No image data provided' });
        }

        const match = body.base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        let ext = 'png';
        let buffer;

        if (match) {
          ext = match[1] === 'jpeg' ? 'jpg' : match[1];
          buffer = Buffer.from(match[2], 'base64');
        } else {
          buffer = Buffer.from(body.base64Data, 'base64');
        }

        const cleanName = (body.filename || 'badge')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .replace(/\.[^/.]+$/, '');
        const filename = `${cleanName}-${Date.now()}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);

        fs.writeFileSync(filePath, buffer);
        const imageUrl = `/uploads/${filename}`;
        return sendJson(res, 200, { success: true, url: imageUrl, filename });
      }

      return sendJson(res, 404, { error: 'API route not found' });
    } catch (apiErr) {
      console.error('API Error:', apiErr);
      return sendJson(res, 500, { error: 'Internal server error: ' + apiErr.message });
    }
  }

  // ----------------------------------------------------
  // STATIC FILE SERVING
  // ----------------------------------------------------
  let filePathName = pathname;
  if (filePathName === '/' || filePathName === '') {
    filePathName = '/index.html';
  } else if (filePathName === '/admin') {
    filePathName = '/admin.html';
  }

  // Resolve safe path
  const safePath = path.normalize(path.join(PUBLIC_DIR, filePathName));

  // Security check: ensure within PUBLIC_DIR
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(safePath, (err, stats) => {
    if (err) {
      if (!path.extname(safePath)) {
        const htmlPath = safePath + '.html';
        if (fs.existsSync(htmlPath)) {
          return serveFile(htmlPath, res);
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      return res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found - DailyBibleFuel</title><style>body{font-family:Poppins,sans-serif;text-align:center;padding:50px;background:#FAF8F5;color:#163A63;}</style></head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p>The page you requested could not be found.</p>
          <p><a href="/" style="color:#D32F2F;font-weight:bold;text-decoration:none;">← Return to DailyBibleFuel Home</a></p>
        </body>
        </html>
      `);
    }

    if (stats.isDirectory()) {
      const indexFile = path.join(safePath, 'index.html');
      if (fs.existsSync(indexFile)) {
        return serveFile(indexFile, res);
      }
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('403 Directory Listing Denied');
    }

    serveFile(safePath, res);
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('500 Internal Server Error');
    }
    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    };
    if (['.html', '.js', '.json'].includes(ext)) {
      headers['Cache-Control'] = 'no-cache, must-revalidate';
      headers['Pragma'] = 'no-cache';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}

server.listen(PORT, () => {
  console.log(`DailyBibleFuel server running on http://localhost:${PORT}`);
  console.log(`Admin Panel available at http://localhost:${PORT}/admin`);
  console.log(`Default credentials: user="${ADMIN_USER}", pass="${ADMIN_PASS}"`);
});
