# 🚀 Ultra Proxy

A high-performance web proxy with zero lag, full interactivity, and streaming support. Access any website seamlessly with advanced features like video playback, content filtering bypass, and smart bookmarks.

## ✨ Features

- **🚀 Zero Lag Performance** - Optimized proxy with minimal latency
- **📺 Full Video Support** - YouTube, Netflix, and streaming platforms
- **🔓 Content Bypass** - Seamlessly bypass filters and restrictions
- **📱 Responsive Design** - Works on all devices and screen sizes
- **🌙 Dark/Light Mode** - Customizable themes for better experience
- **🔖 Smart Bookmarks** - Save and organize favorite websites
- **⚡ Quick Access** - One-click access to popular sites
- **📥 Media Download** - Download content directly from proxied sites
- **🖥️ Fullscreen Mode** - Immersive browsing experience

## 🏗️ Architecture

- **Backend**: Node.js + Express.js
- **Frontend**: Vanilla JavaScript + HTML5 + CSS3
- **Proxy**: HTTP Proxy Middleware with Cheerio HTML parsing
- **Real-time**: WebSocket for bookmark synchronization
- **Security**: Helmet.js for security headers

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ultra-proxy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🚀 Render Deployment

### 1. Create Render Account
- Sign up at [render.com](https://render.com)
- Create a new account or sign in

### 2. Create New Web Service
- Click **"New +"** → **"Web Service"**
- Connect your GitHub repository
- Select the `ultra-proxy` repository

### 3. Configure Service
- **Name**: `ultra-proxy` (or your preferred name)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Choose your preferred plan

### 4. Environment Variables (Optional)
```
NODE_ENV=production
PORT=10000
```

### 5. Deploy
- Click **"Create Web Service"**
- Render will automatically build and deploy your app
- Your proxy will be available at `https://your-app-name.onrender.com`

## 📁 Project Structure

```
ultra-proxy/
├── public/                 # Frontend static files
│   ├── index.html         # Main HTML interface
│   ├── styles.css         # CSS styling and themes
│   └── app.js            # Frontend JavaScript logic
├── server.js              # Express.js backend server
├── package.json           # Dependencies and scripts
├── .gitignore            # Git exclusions
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port number |
| `NODE_ENV` | `development` | Environment mode |

### Customization

- **Port**: Modify `PORT` in `server.js` or set environment variable
- **CORS**: Adjust CORS settings in `server.js` for production
- **Security**: Configure Helmet.js options in `server.js`

## 📱 Usage

### Basic Proxy
1. Enter any website URL in the input field
2. Click **"Go"** or press Enter
3. Browse the website through the proxy

### Quick Access
- Use the quick access buttons for popular sites
- YouTube, Google, GitHub, Stack Overflow

### Bookmarks
- Click the bookmark icon to save current page
- Access bookmarks from the sidebar
- Sync bookmarks across sessions

### Keyboard Shortcuts
- `Ctrl/Cmd + L`: Focus URL input
- `Ctrl/Cmd + R`: Refresh page
- `Ctrl/Cmd + B`: Toggle bookmarks
- `Ctrl/Cmd + D`: Toggle bookmark
- `Escape`: Close sidebar

## 🛡️ Security Features

- **Content Security Policy**: Configurable CSP headers
- **CORS Protection**: Cross-origin request handling
- **Input Validation**: URL sanitization and validation
- **Rate Limiting**: Built-in request throttling
- **Security Headers**: Helmet.js security middleware

## 🚀 Performance Optimizations

- **Compression**: Gzip compression for all responses
- **Caching**: Static file caching headers
- **Connection Pooling**: Optimized HTTP connections
- **Memory Management**: Efficient session handling

## 🔍 Troubleshooting

### Common Issues

1. **Website not loading**
   - Check if the target site is accessible
   - Verify URL format (include http/https)
   - Check browser console for errors

2. **Video not playing**
   - Some sites block proxy access
   - Try different video sources
   - Check if the site supports iframe embedding

3. **Bookmarks not saving**
   - Check browser storage permissions
   - Verify WebSocket connection
   - Clear browser cache and try again

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for educational and legitimate use only. Users are responsible for complying with applicable laws and website terms of service. The developers are not responsible for any misuse of this software.

## 🌟 Future Features

- [ ] Advanced caching system
- [ ] Multiple proxy locations
- [ ] User authentication
- [ ] Analytics dashboard
- [ ] API rate limiting
- [ ] Mobile app version
- [ ] Browser extension

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/ultra-proxy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/ultra-proxy/discussions)
- **Email**: your-email@example.com

---

**Made with ❤️ for the open web**
