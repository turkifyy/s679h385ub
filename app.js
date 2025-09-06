// SocialHub v8.0 - Advanced Social Media Management Platform
// Enhanced with modern ES6+ features, comprehensive error handling, and extensive logging

console.log('🚀 SocialHub v8.0 - Application Starting...');

// Application Configuration
const CONFIG = {
    firebase: {
        apiKey: "AIzaSyBKD3QIxJdHw__UG2TEqf0TqyYCnw8wJf8",
        authDomain: "socialhub-1370d.firebaseapp.com",
        projectId: "socialhub-1370d",
        storageBucket: "socialhub-1370d.firebasestorage.app",
        messagingSenderId: "84815590328",
        appId: "1:84815590328:web:2f12340380b37c2562d54d"
    },
    version: "8.0.0",
    debug: true,
    autoSave: true,
    refreshInterval: 30000, // 30 seconds
    demoMode: false // Force demo mode for reliable testing
};

// Application State Management
class AppState {
    constructor() {
        console.log('📊 Initializing Application State...');
        this.state = {
            user: null,
            currentSection: 'dashboard',
            connectedAccounts: [],
            drafts: [],
            scheduledPosts: [],
            analytics: {},
            settings: this.getDefaultSettings(),
            isOnline: navigator.onLine,
            lastSync: null,
            theme: this.getStoredTheme()
        };
        
        this.listeners = new Map();
        this.setupEventListeners();
        console.log('✅ Application State Initialized');
    }

    getDefaultSettings() {
        return {
            defaultVisibility: 'public',
            timezone: 'UTC',
            notifications: {
                email: true,
                push: true,
                dailySummary: false
            },
            autoSave: true,
            theme: 'auto'
        };
    }

    getStoredTheme() {
        try {
            return 'light'; // Default to light theme for demo
        } catch (error) {
            console.warn('⚠️ Could not access localStorage for theme:', error);
            return 'light';
        }
    }

    setupEventListeners() {
        // Online/Offline detection
        window.addEventListener('online', () => {
            console.log('🌐 Application back online');
            this.setState({ isOnline: true });
            this.syncData();
        });

        window.addEventListener('offline', () => {
            console.warn('📴 Application offline');
            this.setState({ isOnline: false });
        });

        // Page visibility for auto-sync
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.state.isOnline) {
                console.log('👀 Page visible - syncing data...');
                this.syncData();
            }
        });
    }

    setState(newState) {
        console.log('🔄 State Update:', newState);
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }

    getState(key) {
        return key ? this.state[key] : this.state;
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
        console.log(`📞 Subscribed to state changes for: ${key}`);
    }

    notifyListeners() {
        this.listeners.forEach((callbacks, key) => {
            callbacks.forEach(callback => {
                try {
                    callback(this.state[key], this.state);
                } catch (error) {
                    console.error(`❌ Error in state listener for ${key}:`, error);
                }
            });
        });
    }

    async syncData() {
        try {
            console.log('🔄 Starting data sync...');
            // Simulate API sync
            await new Promise(resolve => setTimeout(resolve, 500));
            this.setState({ lastSync: new Date().toISOString() });
            console.log('✅ Data sync completed');
        } catch (error) {
            console.error('❌ Data sync failed:', error);
            this.showToast('Sync failed - working offline', 'error');
        }
    }

    showToast(message, type = 'info', title = null) {
        ToastManager.show(message, type, title);
    }
}

// Firebase Service
class FirebaseService {
    constructor() {
        console.log('🔥 Initializing Firebase Service...');
        this.app = null;
        this.auth = null;
        this.firestore = null;
        this.storage = null;
        this.initialized = false;
        this.demoMode = CONFIG.demoMode;
    }

    async initialize() {
        try {
            console.log('🔥 Configuring Firebase...');
            
            if (this.demoMode) {
                console.log('🎭 Demo mode enabled - skipping Firebase initialization');
                this.initializeDemoMode();
                return true;
            }
            
            // Initialize Firebase (using compat SDK for demo)
            if (typeof firebase !== 'undefined') {
                this.app = firebase.initializeApp(CONFIG.firebase);
                this.auth = firebase.auth();
                this.firestore = firebase.firestore();
                this.storage = firebase.storage();

                // Setup auth state listener
                this.auth.onAuthStateChanged(async (user) => {
                    console.log('👤 Auth State Changed:', user ? 'Logged In' : 'Logged Out');
                    if (user) {
                        await this.handleAuthSuccess(user);
                    } else {
                        this.handleAuthFailure();
                    }
                });

                this.initialized = true;
                console.log('✅ Firebase Service Initialized');
                return true;
            } else {
                throw new Error('Firebase SDK not loaded');
            }
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            // Continue with demo mode for reliable testing
            this.initializeDemoMode();
            return true;
        }
    }

    initializeDemoMode() {
        console.log('🎭 Initializing Demo Mode...');
        this.demoMode = true;
        // Don't auto-login in demo mode, wait for user interaction
        console.log('✅ Demo Mode Ready');
    }

    async signInWithGoogle() {
        try {
            console.log('🔐 Starting Google Sign-In...');
            
            if (!this.demoMode && this.initialized && this.auth) {
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.addScope('profile');
                provider.addScope('email');
                
                const result = await this.auth.signInWithPopup(provider);
                console.log('✅ Google Sign-In Successful');
                return result.user;
            } else {
                // Demo mode - simulate successful login
                console.log('🎭 Demo mode - simulating Google Sign-In...');
                
                // Show loading state
                const signInBtn = document.getElementById('googleSignIn');
                if (signInBtn) {
                    signInBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
                    signInBtn.disabled = true;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const demoUser = {
                    uid: 'demo-user',
                    displayName: 'Demo User',
                    email: 'demo@socialhub.app',
                    photoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=4F46E5&color=fff'
                };
                
                await this.handleAuthSuccess(demoUser);
                return demoUser;
            }
        } catch (error) {
            console.error('❌ Google Sign-In failed:', error);
            
            // Reset button state
            const signInBtn = document.getElementById('googleSignIn');
            if (signInBtn) {
                signInBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
                signInBtn.disabled = false;
            }
            
            throw error;
        }
    }

    async signOut() {
        try {
            console.log('🔐 Starting Sign Out...');
            if (!this.demoMode && this.initialized && this.auth) {
                await this.auth.signOut();
            } else {
                // Demo mode sign out
                console.log('🎭 Demo mode sign out');
            }
            this.handleAuthFailure();
            console.log('✅ Sign Out Successful');
        } catch (error) {
            console.error('❌ Sign Out failed:', error);
            throw error;
        }
    }

    async handleAuthSuccess(user) {
        console.log('🎉 Authentication Successful:', user.displayName);
        appState.setState({ user });
        await this.loadUserData(user.uid);
        uiManager.showMainApp();
        this.startPeriodicSync();
        ToastManager.show(`Welcome back, ${user.displayName}!`, 'success', 'Signed In');
    }

    handleAuthFailure() {
        console.log('👋 User Signed Out');
        appState.setState({ user: null });
        uiManager.showLoginScreen();
        this.stopPeriodicSync();
    }

    async loadUserData(userId) {
        try {
            console.log('📥 Loading user data...');
            
            // Load sample data for demo
            const sampleData = this.getSampleData();
            appState.setState({
                connectedAccounts: sampleData.connectedAccounts,
                drafts: sampleData.drafts,
                scheduledPosts: sampleData.scheduledPosts,
                analytics: sampleData.analytics
            });
            
            console.log('✅ User data loaded');
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
        }
    }

    getSampleData() {
        return {
            connectedAccounts: [
                {
                    id: 'fb1',
                    platform: 'facebook',
                    name: 'My Facebook Page',
                    username: '@myfacebookpage',
                    isConnected: true,
                    followerCount: 1250,
                    avatar: 'https://ui-avatars.com/api/?name=FB&background=1877F2&color=fff'
                },
                {
                    id: 'ig1',
                    platform: 'instagram',
                    name: 'My Instagram',
                    username: '@myinstagram',
                    isConnected: true,
                    followerCount: 850,
                    avatar: 'https://ui-avatars.com/api/?name=IG&background=E4405F&color=fff'
                }
            ],
            drafts: [
                {
                    id: 'draft1',
                    content: 'Check out our latest product update! 🚀 #innovation #tech',
                    platforms: ['facebook', 'twitter'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    mediaUrls: []
                }
            ],
            scheduledPosts: [
                {
                    id: 'scheduled1',
                    content: 'Behind the scenes at our office today 📸',
                    platforms: ['instagram'],
                    scheduledFor: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                    status: 'scheduled'
                }
            ],
            analytics: {
                totalPosts: 45,
                totalEngagement: 2834,
                totalReach: 12450,
                engagementRate: 5.2,
                topPerformingPost: 'Post about product launch',
                weeklyData: [
                    { date: '2025-01-01', posts: 3, engagement: 245, reach: 1200 },
                    { date: '2025-01-02', posts: 2, engagement: 180, reach: 950 },
                    { date: '2025-01-03', posts: 4, engagement: 320, reach: 1400 },
                    { date: '2025-01-04', posts: 1, engagement: 95, reach: 600 },
                    { date: '2025-01-05', posts: 3, engagement: 275, reach: 1100 },
                    { date: '2025-01-06', posts: 2, engagement: 160, reach: 800 },
                    { date: '2025-01-07', posts: 1, engagement: 85, reach: 450 }
                ]
            }
        };
    }

    startPeriodicSync() {
        console.log('⏰ Starting periodic sync...');
        this.syncInterval = setInterval(() => {
            if (appState.getState('isOnline')) {
                appState.syncData();
            }
        }, CONFIG.refreshInterval);
    }

    stopPeriodicSync() {
        if (this.syncInterval) {
            console.log('⏰ Stopping periodic sync...');
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
}

// Toast Notification Manager
class ToastManager {
    static show(message, type = 'info', title = null, duration = 5000) {
        console.log(`📢 Toast: [${type.toUpperCase()}] ${title || 'Notification'}: ${message}`);
        
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getIcon(type);
        toast.innerHTML = `
            <i class="${icon}"></i>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add click to dismiss
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.remove(toast);
        });

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            if (toast.parentNode) {
                this.remove(toast);
            }
        }, duration);
    }

    static getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    static remove(toast) {
        toast.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// UI Manager
class UIManager {
    constructor() {
        console.log('🎨 Initializing UI Manager...');
        this.currentSection = 'dashboard';
        this.sidebarCollapsed = false;
        this.isMobile = window.innerWidth <= 768;
        this.setupEventListeners();
        this.setupThemeToggle();
        console.log('✅ UI Manager Initialized');
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Modal controls
        document.querySelectorAll('.modal-close, .modal-backdrop').forEach(element => {
            element.addEventListener('click', (e) => {
                if (e.target === element) {
                    this.closeModal(element.closest('.modal'));
                }
            });
        });

        // Settings tabs
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                this.showSettingsTab(tabName);
            });
        });

        // Responsive handling
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            if (wasMobile !== this.isMobile) {
                console.log(`📱 Device type changed: ${this.isMobile ? 'Mobile' : 'Desktop'}`);
                this.handleResponsiveChange();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.showSection('composer');
                        console.log('⌨️ Keyboard shortcut: New Post');
                        break;
                    case 'd':
                        e.preventDefault();
                        this.showSection('dashboard');
                        console.log('⌨️ Keyboard shortcut: Dashboard');
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Apply stored theme
        this.applyTheme(appState.getState('theme'));
    }

    toggleTheme() {
        const currentTheme = appState.getState('theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log(`🎨 Theme changed: ${currentTheme} → ${newTheme}`);
        
        appState.setState({ theme: newTheme });
        this.applyTheme(newTheme);
        
        // Update toggle icon
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }

        ToastManager.show(`${newTheme === 'dark' ? 'Dark' : 'Light'} theme activated`, 'success');
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-color-scheme', theme);
    }

    showLoadingScreen() {
        console.log('⏳ Showing loading screen...');
        document.getElementById('loadingScreen').style.display = 'flex';
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'none';
    }

    showLoginScreen() {
        console.log('🔐 Showing login screen...');
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        console.log('🏠 Showing main application...');
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'grid';
        
        // Update user info
        this.updateUserProfile();
        this.showSection('dashboard');
        this.updateStats();
    }

    updateUserProfile() {
        const user = appState.getState('user');
        if (!user) return;

        console.log('👤 Updating user profile in UI...');
        
        const avatar = document.getElementById('userAvatar');
        const name = document.getElementById('userName');
        const email = document.getElementById('userEmail');

        if (avatar) avatar.src = user.photoURL || '';
        if (name) name.textContent = user.displayName || 'Unknown User';
        if (email) email.textContent = user.email || '';
    }

    showSection(sectionName) {
        console.log(`📄 Showing section: ${sectionName}`);
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-section') === sectionName);
        });

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.toggle('active', section.id === `${sectionName}Section`);
        });

        // Update header title
        const titleMap = {
            dashboard: 'Dashboard',
            accounts: 'Connected Accounts',
            composer: 'Post Composer',
            scheduler: 'Content Scheduler',
            analytics: 'Analytics',
            drafts: 'Draft Posts',
            settings: 'Settings'
        };
        
        const sectionTitle = document.getElementById('sectionTitle');
        if (sectionTitle) {
            sectionTitle.textContent = titleMap[sectionName] || 'SocialHub';
        }

        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);

        // Close mobile sidebar after navigation
        if (this.isMobile) {
            this.closeSidebar();
        }
    }

    loadSectionData(sectionName) {
        console.log(`📊 Loading data for section: ${sectionName}`);
        
        switch (sectionName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'accounts':
                this.updateAccountsList();
                break;
            case 'analytics':
                this.updateAnalytics();
                break;
            case 'drafts':
                this.updateDraftsList();
                break;
            case 'scheduler':
                this.updateCalendar();
                break;
        }
    }

    updateStats() {
        const analytics = appState.getState('analytics');
        if (!analytics) return;

        console.log('📊 Updating statistics...');
        
        document.getElementById('totalPosts').textContent = analytics.totalPosts || 0;
        document.getElementById('totalEngagement').textContent = analytics.totalEngagement || 0;
        document.getElementById('totalReach').textContent = analytics.totalReach || 0;
        document.getElementById('scheduledPosts').textContent = appState.getState('scheduledPosts').length || 0;
    }

    updateDashboard() {
        this.updateStats();
        this.updateRecentActivity();
        this.updateEngagementChart();
    }

    updateRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        console.log('📝 Updating recent activity...');
        
        const activities = [
            {
                icon: 'fas fa-share',
                title: 'Post published to Facebook',
                meta: '2 minutes ago',
                color: '#1877F2'
            },
            {
                icon: 'fas fa-heart',
                title: 'New likes on Instagram post',
                meta: '15 minutes ago',
                color: '#E4405F'
            },
            {
                icon: 'fas fa-calendar-plus',
                title: 'Post scheduled for tomorrow',
                meta: '1 hour ago',
                color: '#4F46E5'
            }
        ];

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${activity.color};">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-meta">${activity.meta}</div>
                </div>
            </div>
        `).join('');
    }

    updateEngagementChart() {
        const canvas = document.getElementById('engagementChart');
        if (!canvas) return;

        console.log('📈 Updating engagement chart...');
        
        const ctx = canvas.getContext('2d');
        const analytics = appState.getState('analytics');
        
        if (this.engagementChart) {
            this.engagementChart.destroy();
        }

        this.engagementChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: analytics.weeklyData?.map(d => new Date(d.date).toLocaleDateString()) || [],
                datasets: [{
                    label: 'Engagement',
                    data: analytics.weeklyData?.map(d => d.engagement) || [],
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateAccountsList() {
        const container = document.getElementById('accountsList');
        if (!container) return;

        console.log('🔗 Updating accounts list...');
        
        const accounts = appState.getState('connectedAccounts');
        const platformColors = {
            facebook: '#1877F2',
            instagram: '#E4405F',
            twitter: '#1DA1F2',
            linkedin: '#0A66C2'
        };

        container.innerHTML = accounts.map(account => `
            <div class="account-card">
                <div class="account-icon" style="background: ${platformColors[account.platform]};">
                    <i class="fab fa-${account.platform}"></i>
                </div>
                <div class="account-info">
                    <h4 class="account-name">${account.name}</h4>
                    <p class="account-username">${account.username}</p>
                    <div class="account-stats">
                        <span class="account-stat">
                            <i class="fas fa-users"></i>
                            ${account.followerCount.toLocaleString()} followers
                        </span>
                    </div>
                </div>
                <div class="account-actions">
                    <span class="status status--success">Connected</span>
                    <button class="btn btn--outline btn--sm">Manage</button>
                </div>
            </div>
        `).join('');
    }

    updateAnalytics() {
        this.updatePostPerformanceChart();
        this.updatePlatformChart();
        this.updateDetailedMetrics();
    }

    updatePostPerformanceChart() {
        const canvas = document.getElementById('postPerformanceChart');
        if (!canvas) return;

        console.log('📊 Updating post performance chart...');
        
        const ctx = canvas.getContext('2d');
        const analytics = appState.getState('analytics');

        if (this.postPerformanceChart) {
            this.postPerformanceChart.destroy();
        }

        this.postPerformanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: analytics.weeklyData?.map(d => new Date(d.date).toLocaleDateString()) || [],
                datasets: [{
                    label: 'Posts',
                    data: analytics.weeklyData?.map(d => d.posts) || [],
                    backgroundColor: '#FFC185',
                    borderColor: '#F59E0B',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updatePlatformChart() {
        const canvas = document.getElementById('platformChart');
        if (!canvas) return;

        console.log('🎯 Updating platform chart...');
        
        const ctx = canvas.getContext('2d');

        if (this.platformChart) {
            this.platformChart.destroy();
        }

        this.platformChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn'],
                datasets: [{
                    data: [30, 25, 20, 15],
                    backgroundColor: ['#1877F2', '#E4405F', '#1DA1F2', '#0A66C2'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateDetailedMetrics() {
        const container = document.getElementById('detailedMetrics');
        if (!container) return;

        console.log('📋 Updating detailed metrics...');
        
        const metrics = [
            { platform: 'Facebook', posts: 15, engagement: 1250, reach: 5200 },
            { platform: 'Instagram', posts: 12, engagement: 980, reach: 4100 },
            { platform: 'Twitter', posts: 18, engagement: 504, reach: 2800 },
            { platform: 'LinkedIn', posts: 8, engagement: 340, reach: 1650 }
        ];

        container.innerHTML = `
            <div class="table-responsive">
                <table class="metrics-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--color-secondary);">
                            <th style="padding: var(--space-12); text-align: left; border-bottom: 1px solid var(--color-border);">Platform</th>
                            <th style="padding: var(--space-12); text-align: left; border-bottom: 1px solid var(--color-border);">Posts</th>
                            <th style="padding: var(--space-12); text-align: left; border-bottom: 1px solid var(--color-border);">Engagement</th>
                            <th style="padding: var(--space-12); text-align: left; border-bottom: 1px solid var(--color-border);">Reach</th>
                            <th style="padding: var(--space-12); text-align: left; border-bottom: 1px solid var(--color-border);">Avg. Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${metrics.map(metric => `
                            <tr>
                                <td style="padding: var(--space-12); border-bottom: 1px solid var(--color-card-border-inner);"><i class="fab fa-${metric.platform.toLowerCase()}"></i> ${metric.platform}</td>
                                <td style="padding: var(--space-12); border-bottom: 1px solid var(--color-card-border-inner);">${metric.posts}</td>
                                <td style="padding: var(--space-12); border-bottom: 1px solid var(--color-card-border-inner);">${metric.engagement.toLocaleString()}</td>
                                <td style="padding: var(--space-12); border-bottom: 1px solid var(--color-card-border-inner);">${metric.reach.toLocaleString()}</td>
                                <td style="padding: var(--space-12); border-bottom: 1px solid var(--color-card-border-inner);">${((metric.engagement / metric.reach) * 100).toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    updateDraftsList() {
        const container = document.getElementById('draftsList');
        if (!container) return;

        console.log('📄 Updating drafts list...');
        
        const drafts = appState.getState('drafts');
        const platformColors = {
            facebook: '#1877F2',
            instagram: '#E4405F',
            twitter: '#1DA1F2',
            linkedin: '#0A66C2'
        };

        if (drafts.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: var(--space-32); color: var(--color-text-secondary);">
                    <i class="fas fa-file-alt" style="font-size: var(--font-size-4xl); margin-bottom: var(--space-16);"></i>
                    <h4>No drafts yet</h4>
                    <p>Create your first draft post to get started.</p>
                    <button class="btn btn--primary" onclick="uiManager.showSection('composer')">
                        <i class="fas fa-plus"></i>
                        Create Draft
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = drafts.map(draft => `
            <div class="draft-item">
                <div class="draft-checkbox">
                    <input type="checkbox" data-draft-id="${draft.id}">
                </div>
                <div class="draft-content">
                    <div class="draft-header">
                        <div class="draft-platforms">
                            ${draft.platforms.map(platform => `
                                <span class="draft-platform" style="background: ${platformColors[platform]};">
                                    <i class="fab fa-${platform}"></i>
                                </span>
                            `).join('')}
                        </div>
                        <div class="draft-actions">
                            <button class="btn btn--outline btn--sm" onclick="postComposer.editDraft('${draft.id}')">
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>
                            <button class="btn btn--secondary btn--sm" onclick="postComposer.scheduleDraft('${draft.id}')">
                                <i class="fas fa-calendar-plus"></i>
                                Schedule
                            </button>
                        </div>
                    </div>
                    <div class="draft-text">${draft.content}</div>
                    <div class="draft-meta">
                        <span><i class="fas fa-clock"></i> ${new Date(draft.updatedAt).toLocaleDateString()}</span>
                        <span><i class="fas fa-file-alt"></i> ${draft.content.length} characters</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateCalendar() {
        console.log('📅 Updating calendar...');
        this.renderCalendar();
    }

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const monthDisplay = document.getElementById('currentMonth');
        if (monthDisplay) {
            monthDisplay.textContent = `${monthNames[month]} ${year}`;
        }

        // Get scheduled posts
        const scheduledPosts = appState.getState('scheduledPosts');
        
        // Generate calendar HTML
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let calendarHTML = '<div class="calendar-header">';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            calendarHTML += `<div class="calendar-day-header">${day}</div>`;
        });
        calendarHTML += '</div><div class="calendar-body">';

        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += '<div class="calendar-day other-month"></div>';
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === new Date().toDateString();
            const dayPosts = scheduledPosts.filter(post => {
                const postDate = new Date(post.scheduledFor);
                return postDate.toDateString() === date.toDateString();
            });

            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''}">
                    <div class="day-number">${day}</div>
                    <div class="scheduled-posts">
                        ${dayPosts.map(post => `
                            <div class="scheduled-post" onclick="postComposer.viewScheduledPost('${post.id}')">
                                ${post.content.substring(0, 30)}...
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        calendarHTML += '</div>';
        calendar.innerHTML = calendarHTML;
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainApp = document.querySelector('.main-app');
        
        if (this.isMobile) {
            sidebar.classList.toggle('open');
            console.log('📱 Mobile sidebar toggled');
        } else {
            this.sidebarCollapsed = !this.sidebarCollapsed;
            mainApp.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
            console.log(`🔧 Desktop sidebar ${this.sidebarCollapsed ? 'collapsed' : 'expanded'}`);
        }
    }

    closeSidebar() {
        if (this.isMobile) {
            document.querySelector('.sidebar').classList.remove('open');
        }
    }

    handleResponsiveChange() {
        // Reset sidebar state on responsive change
        if (!this.isMobile) {
            document.querySelector('.sidebar').classList.remove('open');
        } else {
            document.querySelector('.main-app').classList.remove('sidebar-collapsed');
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            console.log(`🔧 Showing modal: ${modalId}`);
            modal.classList.remove('hidden');
        }
    }

    closeModal(modal) {
        if (modal) {
            console.log('🔧 Closing modal');
            modal.classList.add('hidden');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
            this.closeModal(modal);
        });
    }

    showSettingsTab(tabName) {
        console.log(`⚙️ Showing settings tab: ${tabName}`);
        
        // Update tab navigation
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
        });

        // Update tab content
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}Settings`);
        });
    }
}

// Post Composer
class PostComposer {
    constructor() {
        console.log('✍️ Initializing Post Composer...');
        this.selectedPlatforms = [];
        this.mediaFiles = [];
        this.currentDraft = null;
        this.autoSaveTimeout = null;
        this.setupEventListeners();
        this.setupPlatformSelector();
        console.log('✅ Post Composer Initialized');
    }

    setupEventListeners() {
        // Content textarea
        const contentTextarea = document.getElementById('postContent');
        if (contentTextarea) {
            contentTextarea.addEventListener('input', () => {
                this.updateCharacterCount();
                this.updatePreview();
                this.scheduleAutoSave();
            });
        }

        // Media upload
        const mediaInput = document.getElementById('mediaInput');
        const dropzone = document.getElementById('mediaDropzone');

        if (mediaInput) {
            mediaInput.addEventListener('change', (e) => {
                this.handleMediaFiles(e.target.files);
            });
        }

        if (dropzone) {
            dropzone.addEventListener('click', () => {
                mediaInput?.click();
            });

            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                this.handleMediaFiles(e.dataTransfer.files);
            });
        }

        // Action buttons
        document.getElementById('saveDraftBtn')?.addEventListener('click', () => {
            this.saveDraft();
        });

        document.getElementById('schedulePostBtn')?.addEventListener('click', () => {
            this.showScheduleModal();
        });

        document.getElementById('publishNowBtn')?.addEventListener('click', () => {
            this.publishNow();
        });
    }

    setupPlatformSelector() {
        const container = document.getElementById('platformCheckboxes');
        if (!container) return;

        console.log('🎯 Setting up platform selector...');
        
        const platforms = [
            { id: 'facebook', name: 'Facebook', icon: 'fab fa-facebook', color: '#1877F2' },
            { id: 'instagram', name: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F' },
            { id: 'twitter', name: 'Twitter', icon: 'fab fa-twitter', color: '#1DA1F2' },
            { id: 'linkedin', name: 'LinkedIn', icon: 'fab fa-linkedin', color: '#0A66C2' }
        ];

        container.innerHTML = platforms.map(platform => `
            <label class="platform-checkbox" data-platform="${platform.id}" style="border-color: ${platform.color};">
                <input type="checkbox" value="${platform.id}">
                <i class="${platform.icon}"></i>
                <span>${platform.name}</span>
            </label>
        `).join('');

        // Add event listeners
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const platform = e.target.value;
                const label = e.target.closest('.platform-checkbox');
                
                if (e.target.checked) {
                    this.selectedPlatforms.push(platform);
                    label.classList.add('selected');
                } else {
                    this.selectedPlatforms = this.selectedPlatforms.filter(p => p !== platform);
                    label.classList.remove('selected');
                }
                
                console.log('🎯 Selected platforms:', this.selectedPlatforms);
                this.updateCharacterCount();
                this.updatePreview();
            });
        });
    }

    updateCharacterCount() {
        const content = document.getElementById('postContent')?.value || '';
        const counter = document.getElementById('characterCount');
        const limit = document.getElementById('characterLimit');
        
        if (!counter) return;

        // Get the most restrictive character limit for selected platforms
        const limits = {
            twitter: 280,
            facebook: 2200,
            instagram: 2200,
            linkedin: 1300
        };

        const currentLimit = this.selectedPlatforms.length > 0 
            ? Math.min(...this.selectedPlatforms.map(p => limits[p] || 280))
            : 280;

        counter.textContent = content.length;
        if (limit) limit.textContent = currentLimit;

        // Update styling based on character count
        const counterElement = counter.parentElement;
        counterElement.classList.remove('warning', 'error');
        
        if (content.length > currentLimit * 0.9) {
            counterElement.classList.add('warning');
        }
        if (content.length > currentLimit) {
            counterElement.classList.add('error');
        }
    }

    updatePreview() {
        const content = document.getElementById('postContent')?.value || 'Your post content will appear here...';
        const previewContainer = document.getElementById('postPreview');
        
        if (!previewContainer) return;

        console.log('👀 Updating post preview...');
        
        const platformColors = {
            facebook: '#1877F2',
            instagram: '#E4405F',
            twitter: '#1DA1F2',
            linkedin: '#0A66C2'
        };

        const platformsToShow = this.selectedPlatforms.length > 0 ? this.selectedPlatforms : ['facebook'];
        
        previewContainer.innerHTML = platformsToShow.map(platform => `
            <div class="preview-platform ${platform}">
                <div class="platform-header" style="color: ${platformColors[platform]};">
                    <i class="fab fa-${platform}"></i>
                    <span>${platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                </div>
                <div class="preview-post">
                    <div class="preview-text">${content}</div>
                    ${this.mediaFiles.length > 0 ? `
                        <div class="preview-media">
                            <i class="fas fa-image"></i>
                            ${this.mediaFiles.length} media file(s)
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    handleMediaFiles(files) {
        console.log(`📸 Processing ${files.length} media files...`);
        
        Array.from(files).forEach(file => {
            if (this.validateMediaFile(file)) {
                this.addMediaFile(file);
            }
        });
    }

    validateMediaFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mov'];
        
        if (!allowedTypes.includes(file.type)) {
            ToastManager.show('Invalid file type. Please upload images or videos.', 'error');
            return false;
        }
        
        if (file.size > maxSize) {
            ToastManager.show('File is too large. Maximum size is 50MB.', 'error');
            return false;
        }
        
        return true;
    }

    addMediaFile(file) {
        const mediaPreview = document.getElementById('mediaPreview');
        if (!mediaPreview) return;

        console.log(`📎 Adding media file: ${file.name}`);
        
        this.mediaFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const mediaItem = document.createElement('div');
            mediaItem.className = 'media-item';
            mediaItem.innerHTML = `
                ${file.type.startsWith('image/') 
                    ? `<img src="${e.target.result}" alt="Preview">`
                    : `<video src="${e.target.result}" controls></video>`
                }
                <button class="media-remove" onclick="postComposer.removeMediaFile(${this.mediaFiles.length - 1})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            mediaPreview.appendChild(mediaItem);
        };
        reader.readAsDataURL(file);
        
        this.updatePreview();
        ToastManager.show(`Added ${file.name}`, 'success');
    }

    removeMediaFile(index) {
        console.log(`🗑️ Removing media file at index: ${index}`);
        
        this.mediaFiles.splice(index, 1);
        
        // Update preview
        const mediaPreview = document.getElementById('mediaPreview');
        if (mediaPreview) {
            const items = mediaPreview.querySelectorAll('.media-item');
            if (items[index]) {
                items[index].remove();
            }
        }
        
        this.updatePreview();
        ToastManager.show('Media file removed', 'info');
    }

    saveDraft() {
        const content = document.getElementById('postContent')?.value;
        
        if (!content?.trim()) {
            ToastManager.show('Please enter some content before saving', 'warning');
            return;
        }

        if (this.selectedPlatforms.length === 0) {
            ToastManager.show('Please select at least one platform', 'warning');
            return;
        }

        console.log('💾 Saving draft...');
        
        const draft = {
            id: this.currentDraft?.id || `draft_${Date.now()}`,
            content: content.trim(),
            platforms: [...this.selectedPlatforms],
            mediaUrls: this.mediaFiles.map(f => f.name), // In real app, these would be uploaded URLs
            createdAt: this.currentDraft?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Update drafts in state
        const drafts = appState.getState('drafts');
        const existingIndex = drafts.findIndex(d => d.id === draft.id);
        
        if (existingIndex >= 0) {
            drafts[existingIndex] = draft;
        } else {
            drafts.push(draft);
        }
        
        appState.setState({ drafts });
        
        this.currentDraft = draft;
        ToastManager.show('Draft saved successfully', 'success');
    }

    scheduleAutoSave() {
        if (!CONFIG.autoSave) return;
        
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            const content = document.getElementById('postContent')?.value;
            if (content?.trim() && this.selectedPlatforms.length > 0) {
                console.log('💾 Auto-saving draft...');
                this.saveDraft();
            }
        }, 5000); // Auto-save after 5 seconds of inactivity
    }

    showScheduleModal() {
        const content = document.getElementById('postContent')?.value;
        
        if (!content?.trim()) {
            ToastManager.show('Please enter some content before scheduling', 'warning');
            return;
        }

        if (this.selectedPlatforms.length === 0) {
            ToastManager.show('Please select at least one platform', 'warning');
            return;
        }

        console.log('📅 Showing schedule modal...');
        
        // Set default date and time (tomorrow at current time)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        document.getElementById('scheduleDate').value = tomorrow.toISOString().split('T')[0];
        document.getElementById('scheduleTime').value = tomorrow.toTimeString().split(' ')[0].substring(0, 5);
        
        uiManager.showModal('scheduleModal');
    }

    publishNow() {
        const content = document.getElementById('postContent')?.value;
        
        if (!content?.trim()) {
            ToastManager.show('Please enter some content before publishing', 'warning');
            return;
        }

        if (this.selectedPlatforms.length === 0) {
            ToastManager.show('Please select at least one platform', 'warning');
            return;
        }

        console.log('🚀 Publishing post now...');
        
        // Simulate publishing
        ToastManager.show('Publishing post...', 'info', 'Publishing');
        
        setTimeout(() => {
            const post = {
                id: `post_${Date.now()}`,
                content: content.trim(),
                platforms: [...this.selectedPlatforms],
                publishedAt: new Date().toISOString(),
                status: 'published',
                engagement: { likes: 0, comments: 0, shares: 0 }
            };
            
            // Clear the form
            this.clearForm();
            
            // Update analytics
            const analytics = appState.getState('analytics');
            analytics.totalPosts = (analytics.totalPosts || 0) + 1;
            appState.setState({ analytics });
            
            ToastManager.show(`Post published to ${this.selectedPlatforms.join(', ')}!`, 'success', 'Published');
            console.log('✅ Post published successfully');
        }, 2000);
    }

    clearForm() {
        console.log('🧹 Clearing composer form...');
        
        document.getElementById('postContent').value = '';
        document.getElementById('mediaPreview').innerHTML = '';
        
        // Uncheck all platforms
        document.querySelectorAll('#platformCheckboxes input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.closest('.platform-checkbox').classList.remove('selected');
        });
        
        this.selectedPlatforms = [];
        this.mediaFiles = [];
        this.currentDraft = null;
        
        this.updateCharacterCount();
        this.updatePreview();
    }

    editDraft(draftId) {
        console.log(`✏️ Editing draft: ${draftId}`);
        
        const drafts = appState.getState('drafts');
        const draft = drafts.find(d => d.id === draftId);
        
        if (!draft) return;
        
        // Switch to composer
        uiManager.showSection('composer');
        
        // Load draft data
        document.getElementById('postContent').value = draft.content;
        
        // Select platforms
        this.selectedPlatforms = [...draft.platforms];
        draft.platforms.forEach(platform => {
            const checkbox = document.querySelector(`#platformCheckboxes input[value="${platform}"]`);
            if (checkbox) {
                checkbox.checked = true;
                checkbox.closest('.platform-checkbox').classList.add('selected');
            }
        });
        
        this.currentDraft = draft;
        this.updateCharacterCount();
        this.updatePreview();
        
        ToastManager.show('Draft loaded for editing', 'info');
    }

    scheduleDraft(draftId) {
        console.log(`📅 Scheduling draft: ${draftId}`);
        
        const drafts = appState.getState('drafts');
        const draft = drafts.find(d => d.id === draftId);
        
        if (!draft) return;
        
        // Load draft data into composer
        this.editDraft(draftId);
        
        // Show schedule modal
        setTimeout(() => {
            this.showScheduleModal();
        }, 100);
    }

    viewScheduledPost(postId) {
        console.log(`👀 Viewing scheduled post: ${postId}`);
        ToastManager.show('Scheduled post details', 'info');
    }
}

// Initialize Global Instances
console.log('🔧 Initializing global instances...');

const appState = new AppState();
const firebaseService = new FirebaseService();
const uiManager = new UIManager();
const postComposer = new PostComposer();

// Application Initialization
async function initializeApp() {
    try {
        console.log('🚀 Starting SocialHub v8.0 Application...');
        
        // Show loading screen properly
        uiManager.showLoadingScreen();
        
        // Wait for 2 seconds to show loading screen
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Initialize Firebase
        await firebaseService.initialize();
        
        // Setup additional event listeners
        setupGlobalEventListeners();
        
        // Register service worker for PWA
        registerServiceWorker();
        
        // Show login screen after loading
        uiManager.showLoginScreen();
        
        console.log('✅ Application initialization completed');
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        ToastManager.show('Application failed to start', 'error', 'Error');
        
        // Show login screen anyway for demo
        setTimeout(() => {
            uiManager.showLoginScreen();
        }, 1000);
    }
}

function setupGlobalEventListeners() {
    console.log('🔧 Setting up global event listeners...');
    
    // Google Sign In
    document.getElementById('googleSignIn')?.addEventListener('click', async () => {
        try {
            console.log('🔐 Attempting Google Sign-In...');
            await firebaseService.signInWithGoogle();
        } catch (error) {
            console.error('❌ Google Sign-In error:', error);
            ToastManager.show('Sign-in failed. Please try again.', 'error', 'Authentication Error');
        }
    });
    
    // Sign Out
    document.getElementById('signOut')?.addEventListener('click', async () => {
        try {
            console.log('🔐 Signing out...');
            await firebaseService.signOut();
            ToastManager.show('Signed out successfully', 'info');
        } catch (error) {
            console.error('❌ Sign-out error:', error);
            ToastManager.show('Sign-out failed', 'error');
        }
    });
    
    // Add Account
    document.getElementById('addAccountBtn')?.addEventListener('click', () => {
        console.log('➕ Opening account connection modal...');
        uiManager.showModal('accountModal');
    });
    
    // Quick Post Button
    document.getElementById('quickPostBtn')?.addEventListener('click', () => {
        console.log('⚡ Quick post clicked');
        uiManager.showSection('composer');
    });
    
    // Refresh Button
    document.getElementById('refreshBtn')?.addEventListener('click', async () => {
        console.log('🔄 Manual refresh triggered');
        const btn = document.getElementById('refreshBtn');
        const icon = btn.querySelector('i');
        
        icon.classList.add('fa-spin');
        
        try {
            await appState.syncData();
            uiManager.loadSectionData(uiManager.currentSection);
            ToastManager.show('Data refreshed', 'success');
        } catch (error) {
            console.error('❌ Refresh failed:', error);
            ToastManager.show('Refresh failed', 'error');
        } finally {
            setTimeout(() => {
                icon.classList.remove('fa-spin');
            }, 1000);
        }
    });
    
    // Calendar Navigation
    document.getElementById('prevMonth')?.addEventListener('click', () => {
        console.log('📅 Previous month clicked');
        ToastManager.show('Previous month navigation', 'info');
    });
    
    document.getElementById('nextMonth')?.addEventListener('click', () => {
        console.log('📅 Next month clicked');
        ToastManager.show('Next month navigation', 'info');
    });
    
    document.getElementById('todayBtn')?.addEventListener('click', () => {
        console.log('📅 Today button clicked');
        uiManager.renderCalendar();
        ToastManager.show('Calendar updated to current month', 'success');
    });
    
    // Schedule Modal Actions
    document.getElementById('confirmSchedule')?.addEventListener('click', () => {
        const date = document.getElementById('scheduleDate').value;
        const time = document.getElementById('scheduleTime').value;
        
        if (!date || !time) {
            ToastManager.show('Please select date and time', 'warning');
            return;
        }
        
        console.log(`📅 Scheduling post for ${date} at ${time}`);
        
        const scheduledFor = new Date(`${date}T${time}`);
        const content = document.getElementById('postContent')?.value;
        
        const scheduledPost = {
            id: `scheduled_${Date.now()}`,
            content: content.trim(),
            platforms: [...postComposer.selectedPlatforms],
            scheduledFor: scheduledFor.toISOString(),
            status: 'scheduled',
            createdAt: new Date().toISOString()
        };
        
        // Add to scheduled posts
        const scheduledPosts = appState.getState('scheduledPosts');
        scheduledPosts.push(scheduledPost);
        appState.setState({ scheduledPosts });
        
        // Clear form and close modal
        postComposer.clearForm();
        uiManager.closeModal(document.getElementById('scheduleModal'));
        
        ToastManager.show(`Post scheduled for ${scheduledFor.toLocaleDateString()} at ${scheduledFor.toLocaleTimeString()}`, 'success', 'Scheduled');
    });
    
    document.getElementById('cancelSchedule')?.addEventListener('click', () => {
        uiManager.closeModal(document.getElementById('scheduleModal'));
    });
    
    // Platform Connection (Demo)
    document.querySelectorAll('.platform-option button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const platform = e.target.closest('.platform-option').getAttribute('data-platform');
            console.log(`🔗 Connecting to ${platform}...`);
            
            // Simulate connection
            btn.textContent = 'Connecting...';
            btn.disabled = true;
            
            setTimeout(() => {
                btn.textContent = 'Connected';
                btn.classList.remove('btn--outline');
                btn.classList.add('btn--success');
                
                ToastManager.show(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`, 'success', 'Connected');
                
                setTimeout(() => {
                    uiManager.closeModal(document.getElementById('accountModal'));
                    uiManager.updateAccountsList();
                }, 1000);
            }, 2000);
        });
    });

    // FAB
    document.getElementById('fab')?.addEventListener('click', () => {
        console.log('⚡ FAB clicked');
        uiManager.showSection('composer');
    });
}

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            console.log('📱 Registering service worker...');
            
            // Create a simple service worker inline
            const swCode = `
                const CACHE_NAME = 'socialhub-v8.0';
                const urlsToCache = [
                    '/',
                    '/style.css',
                    '/app.js',
                    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
                    'https://cdn.jsdelivr.net/npm/chart.js'
                ];

                self.addEventListener('install', (event) => {
                    event.waitUntil(
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                return cache.addAll(urlsToCache);
                            })
                    );
                });

                self.addEventListener('fetch', (event) => {
                    event.respondWith(
                        caches.match(event.request)
                            .then((response) => {
                                return response || fetch(event.request);
                            })
                    );
                });
            `;
            
            const blob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(blob);
            
            const registration = await navigator.serviceWorker.register(swUrl);
            console.log('✅ Service Worker registered:', registration.scope);
            
        } catch (error) {
            console.warn('⚠️ Service Worker registration failed:', error);
        }
    }
}

// Error Handling
window.addEventListener('error', (event) => {
    console.error('❌ Global Error:', event.error);
    ToastManager.show('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled Promise Rejection:', event.reason);
    ToastManager.show('An unexpected error occurred', 'error');
});

// Performance Monitoring
if (CONFIG.debug) {
    // Log performance metrics
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('📊 Performance Metrics:', {
                loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                domReady: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
                networkTime: Math.round(perfData.responseEnd - perfData.fetchStart)
            });
        }, 100);
    });
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for global access
window.SocialHub = {
    appState,
    firebaseService,
    uiManager,
    postComposer,
    ToastManager,
    version: CONFIG.version
};

console.log('✅ SocialHub v8.0 JavaScript loaded successfully');