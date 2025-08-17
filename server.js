const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for proxy functionality
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Store active proxy sessions and bookmarks
const activeSessions = new Map();
const bookmarks = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
  const sessionId = uuidv4();
  activeSessions.set(sessionId, ws);
  
  ws.on('close', () => {
    activeSessions.delete(sessionId);
  });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'bookmark') {
        handleBookmark(data, sessionId);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
});

// Bookmark management
function handleBookmark(data, sessionId) {
  if (data.action === 'add') {
    bookmarks.set(data.url, {
      title: data.title,
      timestamp: Date.now(),
      sessionId
    });
  } else if (data.action === 'remove') {
    bookmarks.delete(data.url);
  }
  
  // Broadcast bookmark update to all connected clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'bookmarks',
        bookmarks: Array.from(bookmarks.entries())
      }));
    }
  });
}

// URL validation and sanitization
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Main proxy endpoint
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl || !isValidUrl(targetUrl)) {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }
  
  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });
    
    let html = response.data;
    
    // Parse and modify HTML for proxy functionality
    const $ = cheerio.load(html);
    
    // Add proxy script injection
    $('head').append(`
      <script>
        // Proxy script for enhanced functionality
        window.proxyBase = '${req.protocol}://${req.get('host')}';
        window.originalUrl = '${targetUrl}';
        
        // Override fetch and XMLHttpRequest for better proxy support
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
          if (typeof url === 'string' && url.startsWith('/')) {
            url = window.originalUrl.replace(/\/[^\/]*$/, '') + url;
          }
          return originalFetch(url, options);
        };
        
        // Handle relative URLs
        document.addEventListener('click', function(e) {
          if (e.target.tagName === 'A' && e.target.href) {
            const href = e.target.href;
            if (href.startsWith('/') || href.startsWith(window.originalUrl)) {
              e.preventDefault();
              const proxyUrl = window.proxyBase + '/proxy?url=' + encodeURIComponent(href);
              window.location.href = proxyUrl;
            }
          }
        });
      </script>
    `);
    
    // Modify form actions
    $('form').each((i, form) => {
      const $form = $(form);
      const action = $form.attr('action');
      if (action && action.startsWith('/')) {
        $form.attr('action', `${req.protocol}://${req.get('host')}/proxy?url=${encodeURIComponent(new URL(action, targetUrl).href)}`);
      }
    });
    
    // Modify relative image and media sources
    $('img, video, audio, source').each((i, element) => {
      const $element = $(element);
      const src = $element.attr('src');
      if (src && src.startsWith('/')) {
        $element.attr('src', new URL(src, targetUrl).href);
      }
    });
    
    // Modify CSS background images
    $('[style*="background"]').each((i, element) => {
      const $element = $(element);
      const style = $element.attr('style');
      if (style && style.includes('url(')) {
        const newStyle = style.replace(/url\(['"]?([^'"]+)['"]?\)/g, (match, url) => {
          if (url.startsWith('/')) {
            return `url('${new URL(url, targetUrl).href}')`;
          }
          return match;
        });
        $element.attr('style', newStyle);
      }
    });
    
    res.set('Content-Type', 'text/html');
    res.send($.html());
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy the requested URL' });
  }
});

// Enhanced proxy for media streaming
app.use('/stream', createProxyMiddleware({
  target: 'https://example.com', // This will be dynamically set
  changeOrigin: true,
  pathRewrite: {
    '^/stream': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    const targetUrl = req.query.target;
    if (targetUrl) {
      const url = new URL(targetUrl);
      proxyReq.setHeader('Host', url.host);
      proxyReq.setHeader('Origin', url.origin);
      proxyReq.setHeader('Referer', url.origin);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Handle CORS for streaming
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }
}));

// API endpoints
app.get('/api/bookmarks', (req, res) => {
  res.json(Array.from(bookmarks.entries()));
});

app.post('/api/bookmarks', (req, res) => {
  const { url, title } = req.body;
  if (url && title) {
    bookmarks.set(url, {
      title,
      timestamp: Date.now(),
      sessionId: req.session?.id || 'anonymous'
    });
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'URL and title are required' });
  }
});

app.delete('/api/bookmarks/:url', (req, res) => {
  const url = decodeURIComponent(req.params.url);
  bookmarks.delete(url);
  res.json({ success: true });
});

// URL autocomplete endpoint
app.get('/api/autocomplete', async (req, res) => {
  const query = req.query.q;
  if (!query || query.length < 2) {
    return res.json([]);
  }
  
  try {
    // This would typically integrate with a search API
    // For now, return some common suggestions
    const suggestions = [
      'https://www.google.com',
      'https://www.youtube.com',
      'https://www.github.com',
      'https://www.stackoverflow.com'
    ].filter(url => url.includes(query));
    
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: 'Autocomplete failed' });
  }
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    sessions: activeSessions.size,
    timestamp: new Date().toISOString()
  });
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle 404 for all other routes
app.use('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Ultra Proxy running on port ${PORT}`);
  console.log(`📱 Access at: http://localhost:${PORT}`);
  console.log(`🔗 Proxy endpoint: http://localhost:${PORT}/proxy?url=<target_url>`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
