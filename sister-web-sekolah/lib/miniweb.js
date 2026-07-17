/**
 * miniweb.js
 * -------------------------------------------------------------
 * Micro web framework berbasis Node.js core "http" module saja
 * (tanpa dependency eksternal / tanpa perlu "npm install").
 *
 * Alasan desain:
 *  - Supaya proyek ini bisa langsung dijalankan di komputer mana
 *    pun hanya dengan `node server.js` tanpa proses install paket.
 *  - Untuk pengembangan lanjutan (skala produksi), modul ini bisa
 *    diganti dengan Express/Fastify tanpa mengubah struktur route
 *    karena API-nya sengaja dibuat mirip (app.get/app.post/req/res).
 * -------------------------------------------------------------
 */

const http = require('http');
const { URL } = require('url');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STATIC_TYPES = {
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = decodeURIComponent(pair.slice(idx + 1).trim());
    out[key] = val;
  });
  return out;
}

class Router {
  constructor() {
    this.routes = [];
    this.globalMiddlewares = [];
    this.sessions = new Map(); // sid -> session object (in-memory)
    this.staticDir = null;
  }

  use(fn) {
    this.globalMiddlewares.push(fn);
  }

  static_(dir) {
    this.staticDir = dir;
  }

  _addRoute(method, routePath, handlers) {
    const keys = [];
    const pattern = routePath
      .split('/')
      .map((seg) => {
        if (seg.startsWith(':')) {
          keys.push(seg.slice(1));
          return '([^/]+)';
        }
        return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');
    const regex = new RegExp('^' + pattern + '/?$');
    this.routes.push({ method, regex, keys, handlers });
  }

  get(routePath, ...handlers) {
    this._addRoute('GET', routePath, handlers);
  }

  post(routePath, ...handlers) {
    this._addRoute('POST', routePath, handlers);
  }

  _getOrCreateSession(cookies, res) {
    let sid = cookies['sid'];
    if (!sid || !this.sessions.has(sid)) {
      sid = crypto.randomBytes(16).toString('hex');
      this.sessions.set(sid, {});
      res._setCookie = `sid=${sid}; HttpOnly; Path=/; SameSite=Lax`;
    }
    return { sid, session: this.sessions.get(sid) };
  }

  _serveStatic(req, res) {
    if (!this.staticDir) return false;
    const parsedPath = decodeURIComponent(req._pathname);
    if (!parsedPath.startsWith('/public/')) return false;
    const rel = parsedPath.replace('/public/', '');
    const filePath = path.join(this.staticDir, rel);
    if (!filePath.startsWith(this.staticDir)) return false;
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return false;
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': STATIC_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return true;
  }

  handle(req, res) {
    const fullUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    req._pathname = fullUrl.pathname;
    req.query = Object.fromEntries(fullUrl.searchParams.entries());
    req.cookies = parseCookies(req.headers.cookie);

    // Response helpers
    res.status = function (code) {
      res.statusCode = code;
      return res;
    };
    res.send = function (body) {
      if (res._setCookie) res.setHeader('Set-Cookie', res._setCookie);
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
      res.end(body);
    };
    res.json = function (obj) {
      if (res._setCookie) res.setHeader('Set-Cookie', res._setCookie);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(obj));
    };
    res.redirect = function (location) {
      if (res._setCookie) res.setHeader('Set-Cookie', res._setCookie);
      res.writeHead(302, { Location: location });
      res.end();
    };

    if (this._serveStatic(req, res)) return;

    const { sid, session } = this._getOrCreateSession(req.cookies, res);
    req.session = session;
    req.sessionId = sid;

    const finishRouting = () => {
      const match = this.routes.find(
        (r) => r.method === req.method && r.regex.test(req._pathname)
      );

      if (!match) {
        res.status(404).send(renderNotFound(req._pathname));
        return;
      }

      const groups = match.regex.exec(req._pathname).slice(1);
      req.params = {};
      match.keys.forEach((key, i) => {
        req.params[key] = decodeURIComponent(groups[i]);
      });

      const chain = [...this.globalMiddlewares, ...match.handlers];
      let i = 0;
      const next = (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('<h1>500 - Internal Server Error</h1><pre>' + String(err.stack || err) + '</pre>');
          return;
        }
        const fn = chain[i++];
        if (!fn) return;
        try {
          fn(req, res, next);
        } catch (e) {
          next(e);
        }
      };
      next();
    };

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('application/x-www-form-urlencoded')) {
          req.body = querystring.parse(body);
        } else {
          req.body = {};
        }
        finishRouting();
      });
    } else {
      req.body = {};
      finishRouting();
    }
  }

  listen(port, cb) {
    const server = http.createServer((req, res) => this.handle(req, res));
    server.listen(port, cb);
    return server;
  }
}

function renderNotFound(pathname) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>404</title></head>
  <body style="font-family:sans-serif;padding:40px;">
    <h1>404 - Halaman tidak ditemukan</h1>
    <p>Path: <code>${pathname}</code></p>
    <a href="/">Kembali ke Beranda</a>
  </body></html>`;
}

function createApp() {
  return new Router();
}

module.exports = { createApp };
