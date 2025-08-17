// Main Application Class
class UltraProxy {
    constructor() {
        this.currentUrl = '';
        this.bookmarks = new Map();
        this.isBookmarked = false;
        this.websocket = null;
        this.history = [];
        this.historyIndex = -1;
        
        this.initializeElements();
        this.bindEvents();
        this.loadBookmarks();
        this.initializeWebSocket();
        this.loadTheme();
    }

    // Initialize DOM elements
    initializeElements() {
        this.elements = {
            urlInput: document.getElementById('urlInput'),
            goButton: document.getElementById('goButton'),
            urlSuggestions: document.getElementById('urlSuggestions'),
            proxySection: document.getElementById('proxySection'),
            welcomeSection: document.getElementById('welcomeSection'),
            proxyFrame: document.getElementById('proxyFrame'),
            currentUrl: document.getElementById('currentUrl'),
            backButton: document.getElementById('backButton'),
            forwardButton: document.getElementById('forwardButton'),
            refreshButton: document.getElementById('refreshButton'),
            homeButton: document.getElementById('homeButton'),
            bookmarkBtn: document.getElementById('bookmarkBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            themeToggle: document.getElementById('themeToggle'),
            bookmarksToggle: document.getElementById('bookmarksToggle'),
            bookmarkCount: document.getElementById('bookmarkCount'),
            bookmarksSidebar: document.getElementById('bookmarksSidebar'),
            sidebarOverlay: document.getElementById('sidebarOverlay'),
            closeSidebar: document.getElementById('closeSidebar'),
            bookmarksList: document.getElementById('bookmarksList'),
            clearAllBookmarks: document.getElementById('clearAllBookmarks'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            toastContainer: document.getElementById('toastContainer')
        };

        // Quick access buttons
        this.quickLinks = document.querySelectorAll('.quick-link');
    }

    // Bind event listeners
    bindEvents() {
        // URL input events
        this.elements.urlInput.addEventListener('input', this.handleUrlInput.bind(this));
        this.elements.urlInput.addEventListener('keydown', this.handleUrlKeydown.bind(this));
        this.elements.urlInput.addEventListener('focus', this.handleUrlFocus.bind(this));
        this.elements.urlInput.addEventListener('blur', this.handleUrlBlur.bind(this));

        // Go button
        this.elements.goButton.addEventListener('click', this.navigateToUrl.bind(this));

        // Quick access links
        this.quickLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = link.dataset.url;
                this.elements.urlInput.value = url;
                this.navigateToUrl();
            });
        });

        // Proxy controls
        this.elements.backButton.addEventListener('click', this.goBack.bind(this));
        this.elements.forwardButton.addEventListener('click', this.goForward.bind(this));
        this.elements.refreshButton.addEventListener('click', this.refreshPage.bind(this));
        this.elements.homeButton.addEventListener('click', this.goHome.bind(this));

        // Proxy actions
        this.elements.bookmarkBtn.addEventListener('click', this.toggleBookmark.bind(this));
        this.elements.downloadBtn.addEventListener('click', this.downloadMedia.bind(this));
        this.elements.fullscreenBtn.addEventListener('click', this.toggleFullscreen.bind(this));

        // Theme toggle
        this.elements.themeToggle.addEventListener('click', this.toggleTheme.bind(this));

        // Bookmarks toggle
        this.elements.bookmarksToggle.addEventListener('click', this.toggleBookmarksSidebar.bind(this));

        // Sidebar events
        this.elements.closeSidebar.addEventListener('click', this.closeBookmarksSidebar.bind(this));
        this.elements.sidebarOverlay.addEventListener('click', this.closeBookmarksSidebar.bind(this));
        this.elements.clearAllBookmarks.addEventListener('click', this.clearAllBookmarks.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    // Handle URL input changes
    handleUrlInput(e) {
        const query = e.target.value.trim();
        
        if (query.length >= 2) {
            this.showUrlSuggestions(query);
        } else {
            this.hideUrlSuggestions();
        }
    }

    // Handle URL input keydown
    handleUrlKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.navigateToUrl();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.navigateSuggestions(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.navigateSuggestions(-1);
        }
    }

    // Handle URL input focus
    handleUrlFocus() {
        const query = this.elements.urlInput.value.trim();
        if (query.length >= 2) {
            this.showUrlSuggestions(query);
        }
    }

    // Handle URL input blur
    handleUrlBlur() {
        // Delay hiding suggestions to allow clicking on them
        setTimeout(() => {
            this.hideUrlSuggestions();
        }, 200);
    }

    // Show URL suggestions
    async showUrlSuggestions(query) {
        try {
            const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`);
            const suggestions = await response.json();
            
            if (suggestions.length > 0) {
                this.displaySuggestions(suggestions);
            } else {
                this.hideUrlSuggestions();
            }
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
            this.hideUrlSuggestions();
        }
    }

    // Display URL suggestions
    displaySuggestions(suggestions) {
        this.elements.urlSuggestions.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'url-suggestion';
            div.textContent = suggestion;
            div.addEventListener('click', () => {
                this.elements.urlInput.value = suggestion;
                this.hideUrlSuggestions();
                this.navigateToUrl();
            });
            this.elements.urlSuggestions.appendChild(div);
        });
        
        this.elements.urlSuggestions.style.display = 'block';
    }

    // Hide URL suggestions
    hideUrlSuggestions() {
        this.elements.urlSuggestions.style.display = 'none';
    }

    // Navigate suggestions with arrow keys
    navigateSuggestions(direction) {
        const suggestions = this.elements.urlSuggestions.querySelectorAll('.url-suggestion');
        if (suggestions.length === 0) return;

        const currentIndex = Array.from(suggestions).findIndex(s => s.classList.contains('selected'));
        let newIndex = 0;

        if (currentIndex === -1) {
            newIndex = direction > 0 ? 0 : suggestions.length - 1;
        } else {
            newIndex = (currentIndex + direction + suggestions.length) % suggestions.length;
        }

        suggestions.forEach(s => s.classList.remove('selected'));
        suggestions[newIndex].classList.add('selected');
        suggestions[newIndex].scrollIntoView({ block: 'nearest' });
    }

    // Navigate to URL
    async navigateToUrl() {
        const url = this.elements.urlInput.value.trim();
        
        if (!url) {
            this.showToast('Please enter a URL', 'warning');
            return;
        }

        // Validate URL
        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            targetUrl = 'https://' + url;
        }

        try {
            new URL(targetUrl);
        } catch {
            this.showToast('Invalid URL format', 'error');
            return;
        }

        this.showLoading(true);
        
        try {
            // Add to history
            this.addToHistory(targetUrl);
            
            // Navigate to proxy
            const proxyUrl = `/proxy?url=${encodeURIComponent(targetUrl)}`;
            this.elements.proxyFrame.src = proxyUrl;
            
            this.currentUrl = targetUrl;
            this.elements.currentUrl.textContent = targetUrl;
            
            // Show proxy section
            this.elements.welcomeSection.style.display = 'none';
            this.elements.proxySection.style.display = 'block';
            
            // Update bookmark status
            this.updateBookmarkStatus();
            
            // Update URL input
            this.elements.urlInput.value = targetUrl;
            
            this.showToast('Website loaded successfully', 'success');
            
        } catch (error) {
            console.error('Navigation error:', error);
            this.showToast('Failed to load website', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Add URL to history
    addToHistory(url) {
        // Remove any URLs after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add new URL
        this.history.push(url);
        this.historyIndex = this.history.length - 1;
        
        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
        
        this.updateNavigationButtons();
    }

    // Update navigation buttons state
    updateNavigationButtons() {
        this.elements.backButton.disabled = this.historyIndex <= 0;
        this.elements.forwardButton.disabled = this.historyIndex >= this.history.length - 1;
    }

    // Go back
    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const url = this.history[this.historyIndex];
            this.elements.urlInput.value = url;
            this.navigateToUrl();
        }
    }

    // Go forward
    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const url = this.history[this.historyIndex];
            this.elements.urlInput.value = url;
            this.navigateToUrl();
        }
    }

    // Refresh page
    refreshPage() {
        if (this.currentUrl) {
            this.elements.proxyFrame.src = this.elements.proxyFrame.src;
            this.showToast('Page refreshed', 'success');
        }
    }

    // Go home
    goHome() {
        this.elements.welcomeSection.style.display = 'block';
        this.elements.proxySection.style.display = 'none';
        this.elements.proxyFrame.src = '';
        this.currentUrl = '';
        this.elements.currentUrl.textContent = '';
        this.elements.urlInput.value = '';
        this.hideUrlSuggestions();
    }

    // Toggle bookmark
    async toggleBookmark() {
        if (!this.currentUrl) return;

        if (this.isBookmarked) {
            await this.removeBookmark(this.currentUrl);
        } else {
            await this.addBookmark(this.currentUrl);
        }
    }

    // Add bookmark
    async addBookmark(url) {
        try {
            const title = this.getPageTitle() || new URL(url).hostname;
            
            const response = await fetch('/api/bookmarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, title })
            });

            if (response.ok) {
                this.bookmarks.set(url, { title, timestamp: Date.now() });
                this.isBookmarked = true;
                this.updateBookmarkButton();
                this.updateBookmarkCount();
                this.showToast('Added to bookmarks', 'success');
            } else {
                throw new Error('Failed to add bookmark');
            }
        } catch (error) {
            console.error('Add bookmark error:', error);
            this.showToast('Failed to add bookmark', 'error');
        }
    }

    // Remove bookmark
    async removeBookmark(url) {
        try {
            const response = await fetch(`/api/bookmarks/${encodeURIComponent(url)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.bookmarks.delete(url);
                this.isBookmarked = false;
                this.updateBookmarkButton();
                this.updateBookmarkCount();
                this.showToast('Removed from bookmarks', 'success');
            } else {
                throw new Error('Failed to remove bookmark');
            }
        } catch (error) {
            console.error('Remove bookmark error:', error);
            this.showToast('Failed to remove bookmark', 'error');
        }
    }

    // Get page title from iframe
    getPageTitle() {
        try {
            const iframe = this.elements.proxyFrame;
            if (iframe.contentDocument && iframe.contentDocument.title) {
                return iframe.contentDocument.title;
            }
        } catch (error) {
            // Cross-origin restrictions
        }
        return null;
    }

    // Update bookmark button state
    updateBookmarkButton() {
        if (this.isBookmarked) {
            this.elements.bookmarkBtn.classList.add('active');
            this.elements.bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
        } else {
            this.elements.bookmarkBtn.classList.remove('active');
            this.elements.bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
        }
    }

    // Update bookmark count
    updateBookmarkCount() {
        this.elements.bookmarkCount.textContent = this.bookmarks.size;
    }

    // Update bookmark status for current URL
    updateBookmarkStatus() {
        this.isBookmarked = this.bookmarks.has(this.currentUrl);
        this.updateBookmarkButton();
    }

    // Download media
    downloadMedia() {
        if (!this.currentUrl) {
            this.showToast('No website loaded', 'warning');
            return;
        }

        // Create a temporary link to download the current page
        const link = document.createElement('a');
        link.href = this.currentUrl;
        link.download = 'webpage.html';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Download started', 'success');
    }

    // Toggle fullscreen
    toggleFullscreen() {
        if (!this.currentUrl) {
            this.showToast('No website loaded', 'warning');
            return;
        }

        const iframe = this.elements.proxyFrame;
        
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            iframe.requestFullscreen().catch(err => {
                console.error('Fullscreen error:', err);
                this.showToast('Fullscreen not supported', 'warning');
            });
        }
    }

    // Toggle theme
    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-mode');
        
        if (isDark) {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
            this.elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
            this.elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    // Load saved theme
    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            this.elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    // Toggle bookmarks sidebar
    toggleBookmarksSidebar() {
        this.elements.bookmarksSidebar.classList.toggle('open');
        this.elements.sidebarOverlay.classList.toggle('open');
        this.renderBookmarks();
    }

    // Close bookmarks sidebar
    closeBookmarksSidebar() {
        this.elements.bookmarksSidebar.classList.remove('open');
        this.elements.sidebarOverlay.classList.remove('open');
    }

    // Render bookmarks list
    renderBookmarks() {
        this.elements.bookmarksList.innerHTML = '';
        
        if (this.bookmarks.size === 0) {
            this.elements.bookmarksList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-bookmark" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>No bookmarks yet</p>
                    <p style="font-size: 0.875rem;">Start browsing and add your favorite sites!</p>
                </div>
            `;
            return;
        }

        this.bookmarks.forEach((bookmark, url) => {
            const bookmarkElement = document.createElement('div');
            bookmarkElement.className = 'bookmark-item';
            bookmarkElement.innerHTML = `
                <div class="bookmark-info">
                    <div class="bookmark-title">${bookmark.title}</div>
                    <div class="bookmark-url">${bookmark.url}</div>
                </div>
                <button class="remove-bookmark" data-url="${url}">
                    <i class="fas fa-times"></i>
                </button>
            `;

            // Add click event to navigate to bookmark
            bookmarkElement.querySelector('.bookmark-info').addEventListener('click', () => {
                this.elements.urlInput.value = url;
                this.closeBookmarksSidebar();
                this.navigateToUrl();
            });

            // Add remove event
            bookmarkElement.querySelector('.remove-bookmark').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeBookmark(url);
                this.renderBookmarks();
            });

            this.elements.bookmarksList.appendChild(bookmarkElement);
        });
    }

    // Clear all bookmarks
    async clearAllBookmarks() {
        if (this.bookmarks.size === 0) return;

        if (confirm('Are you sure you want to clear all bookmarks?')) {
            try {
                for (const url of this.bookmarks.keys()) {
                    await this.removeBookmark(url);
                }
                this.renderBookmarks();
                this.showToast('All bookmarks cleared', 'success');
            } catch (error) {
                console.error('Clear bookmarks error:', error);
                this.showToast('Failed to clear bookmarks', 'error');
            }
        }
    }

    // Load bookmarks from API
    async loadBookmarks() {
        try {
            const response = await fetch('/api/bookmarks');
            const bookmarksData = await response.json();
            
            this.bookmarks.clear();
            bookmarksData.forEach(([url, bookmark]) => {
                this.bookmarks.set(url, bookmark);
            });
            
            this.updateBookmarkCount();
            this.updateBookmarkStatus();
        } catch (error) {
            console.error('Load bookmarks error:', error);
        }
    }

    // Initialize WebSocket connection
    initializeWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
            console.log('WebSocket connected');
        };
        
        this.websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'bookmarks') {
                    this.bookmarks.clear();
                    data.bookmarks.forEach(([url, bookmark]) => {
                        this.bookmarks.set(url, bookmark);
                    });
                    this.updateBookmarkCount();
                    this.updateBookmarkStatus();
                    this.renderBookmarks();
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };
        
        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        this.websocket.onclose = () => {
            console.log('WebSocket disconnected');
            // Reconnect after 5 seconds
            setTimeout(() => {
                this.initializeWebSocket();
            }, 5000);
        };
    }

    // Show loading spinner
    showLoading(show) {
        if (show) {
            this.elements.loadingSpinner.classList.add('show');
        } else {
            this.elements.loadingSpinner.classList.remove('show');
        }
    }

    // Show toast notification
    showToast(message, type = 'info', title = '') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    // Get toast icon based on type
    getToastIcon(type) {
        switch (type) {
            case 'success': return 'fas fa-check-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            case 'error': return 'fas fa-times-circle';
            default: return 'fas fa-info-circle';
        }
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + L: Focus URL input
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            this.elements.urlInput.focus();
            this.elements.urlInput.select();
        }
        
        // Ctrl/Cmd + R: Refresh
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.refreshPage();
        }
        
        // Ctrl/Cmd + B: Toggle bookmarks
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            this.toggleBookmarksSidebar();
        }
        
        // Ctrl/Cmd + D: Toggle bookmark
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.toggleBookmark();
        }
        
        // Escape: Close sidebar
        if (e.key === 'Escape') {
            this.closeBookmarksSidebar();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ultraProxy = new UltraProxy();
});

// Handle iframe load events
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'iframe-loaded') {
        // Handle iframe load completion
        console.log('Iframe loaded:', event.data.url);
    }
});
