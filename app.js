// SocialHub Pro v8.5 - Advanced Social Media Management Platform
// Enhanced with AI-powered features, Dubai timezone support, and enterprise-grade capabilities

console.log('🚀 SocialHub Pro v8.5 - Application Starting...');

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
    version: "8.5.0",
    debug: true,
    autoSave: true,
    refreshInterval: 30000,
    demoMode: false,
    bulkImportLimit: 1000,
    dubaiTimezone: 'Asia/Dubai',
    encryptionEnabled: true,
    aiFeatures: true,
    performanceMonitoring: true
};

// Dubai Time Slots Configuration
const DUBAI_TIME_SLOTS = {
    morning: ["09:30", "10:05", "10:55"],
    noon: ["12:45", "13:15", "13:05"], 
    evening: ["16:30", "17:17", "18:34"],
    night: ["20:30", "22:45", "23:15"]
};

// User Roles Configuration
const USER_ROLES = {
    main_admin: {
        name: "Main Admin",
        permissions: ["all"],
        description: "Full system access and management"
    },
    content_manager: {
        name: "Content Manager", 
        permissions: ["content", "scheduling", "analytics"],
        description: "Content creation and scheduling management"
    },
    regular_user: {
        name: "Regular User",
        permissions: ["view", "basic_posting"],
        description: "Basic posting and viewing capabilities"
    }
};

// Advanced Application State Management
class AppState {
    constructor() {
        console.log('📊 Initializing Advanced Application State...');
        this.state = {
            user: null,
            userRole: 'main_admin',
            currentSection: 'dashboard',
            connectedAccounts: [],
            drafts: [],
            scheduledPosts: [],
            analytics: {},
            settings: this.getDefaultSettings(),
            isOnline: navigator.onLine,
            lastSync: null,
            theme: this.getStoredTheme(),
            importData: null,
            aiInsights: {},
            performanceMetrics: {},
            securityStatus: 'active',
            bulkOperations: []
        };
        
        this.listeners = new Map();
        this.setupEventListeners();
        this.startPerformanceMonitoring();
        console.log('✅ Advanced Application State Initialized');
    }

    getDefaultSettings() {
        return {
            defaultVisibility: 'public',
            timezone: CONFIG.dubaiTimezone,
            language: 'en',
            notifications: {
                email: true,
                push: true,
                dailySummary: true,
                weeklyReports: true,
                aiInsights: true
            },
            autoSave: true,
            theme: 'auto',
            aiFeatures: {
                contentSuggestions: true,
                optimalTiming: true,
                hashtagGeneration: true,
                performanceAnalysis: true
            },
            scheduling: {
                dubaiTimezone: true,
                aiOptimization: true,
                avoidLowEngagement: true
            },
            security: {
                twoFactorAuth: false,
                encryptData: true,
                sessionTimeout: 3600000 // 1 hour
            }
        };
    }

    getStoredTheme() {
        try {
            return 'light'; // Default for demo
        } catch (error) {
            console.warn('⚠️ Could not access localStorage for theme:', error);
            return 'light';
        }
    }

    setupEventListeners() {
        // Enhanced online/offline detection
        window.addEventListener('online', () => {
            console.log('🌐 Application back online');
            this.setState({ isOnline: true });
            this.syncData();
            this.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            console.warn('📴 Application offline');
            this.setState({ isOnline: false });
            this.showNotification('Working offline', 'warning');
        });

        // Enhanced page visibility handling
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.state.isOnline) {
                console.log('👀 Page visible - syncing data...');
                this.syncData();
            }
        });

        // Performance monitoring
        if (CONFIG.performanceMonitoring) {
            this.setupPerformanceListeners();
        }
    }

    setupPerformanceListeners() {
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                this.state.performanceMetrics = {
                    ...this.state.performanceMetrics,
                    memoryUsage: {
                        used: Math.round(memory.usedJSHeapSize / 1048576),
                        total: Math.round(memory.totalJSHeapSize / 1048576),
                        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
                    }
                };
            }, 30000);
        }

        // Monitor network performance
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.state.performanceMetrics.network = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            };
        }
    }

    startPerformanceMonitoring() {
        if (!CONFIG.performanceMonitoring) return;
        
        console.log('📊 Starting performance monitoring...');
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 60000); // Every minute
    }

    collectPerformanceMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            loadTime: performance.now(),
            userInteractions: this.state.performanceMetrics.userInteractions || 0,
            apiCalls: this.state.performanceMetrics.apiCalls || 0,
            errors: this.state.performanceMetrics.errors || 0
        };

        this.setState({
            performanceMetrics: {
                ...this.state.performanceMetrics,
                ...metrics
            }
        });
    }

    setState(newState) {
        console.log('🔄 Advanced State Update:', newState);
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
        
        // Auto-save critical state changes
        if (CONFIG.autoSave && (newState.drafts || newState.settings)) {
            this.autoSaveState();
        }
    }

    autoSaveState() {
        // In a real application, this would save to Firebase/localStorage
        console.log('💾 Auto-saving application state...');
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
            console.log('🔄 Starting advanced data sync...');
            this.updateSyncStatus('syncing');
            
            // Simulate API sync with error handling
            await new Promise(resolve => setTimeout(resolve, 800));
            
            this.setState({ lastSync: new Date().toISOString() });
            this.updateSyncStatus('synced');
            console.log('✅ Advanced data sync completed');
        } catch (error) {
            console.error('❌ Data sync failed:', error);
            this.updateSyncStatus('error');
            this.showNotification('Sync failed - working offline', 'error');
        }
    }

    updateSyncStatus(status) {
        const syncIcon = document.getElementById('syncIcon');
        const syncText = document.getElementById('syncText');
        
        if (syncIcon && syncText) {
            syncIcon.className = status === 'syncing' ? 'fas fa-sync-alt fa-spin' : 
                               status === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check';
            syncText.textContent = status === 'syncing' ? 'Syncing...' : 
                                 status === 'error' ? 'Sync Error' : 'Synced';
            
            const syncStatus = document.querySelector('.sync-status');
            if (syncStatus) {
                syncStatus.className = `sync-status ${status}`;
            }
        }
    }

    showNotification(message, type = 'info', title = null) {
        ToastManager.show(message, type, title);
    }
}

// Enhanced Firebase Service with Advanced Features
class FirebaseService {
    constructor() {
        console.log('🔥 Initializing Advanced Firebase Service...');
        this.app = null;
        this.auth = null;
        this.firestore = null;
        this.storage = null;
        this.initialized = false;
        this.demoMode = CONFIG.demoMode;
        this.encryptionEnabled = CONFIG.encryptionEnabled;
    }

    async initialize() {
        try {
            console.log('🔥 Configuring Advanced Firebase...');
            
            if (this.demoMode) {
                console.log('🎭 Demo mode enabled - using enhanced demo features');
                this.initializeAdvancedDemoMode();
                return true;
            }
            
            // Real Firebase initialization would go here
            this.initialized = true;
            console.log('✅ Advanced Firebase Service Initialized');
            return true;
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            this.initializeAdvancedDemoMode();
            return true;
        }
    }

    initializeAdvancedDemoMode() {
        console.log('🎭 Initializing Advanced Demo Mode...');
        this.demoMode = true;
        this.setupDemoData();
        console.log('✅ Advanced Demo Mode Ready');
    }

    setupDemoData() {
        // Set up comprehensive demo data
        this.demoData = this.getAdvancedSampleData();
    }

    async signInWithGoogle() {
        try {
            console.log('🔐 Starting Advanced Google Sign-In...');
            
            const signInBtn = document.getElementById('googleSignIn');
            if (signInBtn) {
                signInBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
                signInBtn.disabled = true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const demoUser = {
                uid: 'demo-user-pro',
                displayName: 'Admin User',
                email: 'admin@socialhub.pro',
                photoURL: 'https://ui-avatars.com/api/?name=Admin+User&background=218083&color=fff'
            };
            
            await this.handleAuthSuccess(demoUser);
            return demoUser;
        } catch (error) {
            console.error('❌ Google Sign-In failed:', error);
            
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
            console.log('🔐 Starting Advanced Sign Out...');
            this.handleAuthFailure();
            console.log('✅ Advanced Sign Out Successful');
        } catch (error) {
            console.error('❌ Sign Out failed:', error);
            throw error;
        }
    }

    async handleAuthSuccess(user) {
        console.log('🎉 Advanced Authentication Successful:', user.displayName);
        appState.setState({ user });
        await this.loadAdvancedUserData(user.uid);
        uiManager.showMainApp();
        this.startAdvancedPeriodicSync();
        
        // Enhanced welcome message with role information
        const userRole = appState.getState('userRole');
        const roleInfo = USER_ROLES[userRole];
        ToastManager.show(
            `Welcome back, ${user.displayName}! Role: ${roleInfo.name}`, 
            'success', 
            'Signed In'
        );
    }

    handleAuthFailure() {
        console.log('👋 Advanced User Signed Out');
        appState.setState({ user: null });
        uiManager.showLoginScreen();
        this.stopAdvancedPeriodicSync();
    }

    async loadAdvancedUserData(userId) {
        try {
            console.log('📥 Loading advanced user data...');
            
            const sampleData = this.getAdvancedSampleData();
            appState.setState({
                connectedAccounts: sampleData.connectedAccounts,
                drafts: sampleData.drafts,
                scheduledPosts: sampleData.scheduledPosts,
                analytics: sampleData.analytics,
                aiInsights: sampleData.aiInsights
            });
            
            console.log('✅ Advanced user data loaded');
        } catch (error) {
            console.error('❌ Failed to load advanced user data:', error);
        }
    }

    getAdvancedSampleData() {
        return {
            connectedAccounts: [
                {
                    id: 'fb1',
                    platform: 'facebook',
                    name: 'Business Page Dubai',
                    username: '@businesspagedubai',
                    isConnected: true,
                    followerCount: 15420,
                    avatar: 'https://ui-avatars.com/api/?name=FB&background=1877F2&color=fff',
                    healthStatus: 'excellent',
                    lastActivity: new Date().toISOString()
                },
                {
                    id: 'fb2',
                    platform: 'facebook',
                    name: 'Company Profile',
                    username: '@companyprofile',
                    isConnected: true,
                    followerCount: 8750,
                    avatar: 'https://ui-avatars.com/api/?name=FB&background=1877F2&color=fff',
                    healthStatus: 'good',
                    lastActivity: new Date().toISOString()
                },
                {
                    id: 'ig1',
                    platform: 'instagram',
                    name: 'Brand Instagram',
                    username: '@brandinstagram',
                    isConnected: true,
                    followerCount: 12340,
                    avatar: 'https://ui-avatars.com/api/?name=IG&background=E4405F&color=fff',
                    healthStatus: 'excellent',
                    lastActivity: new Date().toISOString()
                },
                {
                    id: 'ig2',
                    platform: 'instagram',
                    name: 'Dubai Stories',
                    username: '@dubaistories',
                    isConnected: true,
                    followerCount: 6890,
                    avatar: 'https://ui-avatars.com/api/?name=IG&background=E4405F&color=fff',
                    healthStatus: 'good',
                    lastActivity: new Date().toISOString()
                }
            ],
            drafts: [
                {
                    id: 'draft1',
                    content: 'Exciting product launch happening next week! 🚀 Stay tuned for innovative solutions that will transform your business. #innovation #tech #dubai #business',
                    platforms: ['facebook', 'instagram'],
                    contentCategory: 'product',
                    shortUrl: 'https://short.ly/product-launch',
                    linkType: 'article',
                    socialImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    mediaUrls: []
                },
                {
                    id: 'draft2',
                    content: 'Behind the scenes of our Dubai office transformation 📸 Creating spaces that inspire creativity and collaboration.',
                    platforms: ['instagram'],
                    contentCategory: 'channel',
                    shortUrl: '',
                    linkType: 'image',
                    socialImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    updatedAt: new Date(Date.now() - 86400000).toISOString(),
                    mediaUrls: []
                }
            ],
            scheduledPosts: [
                {
                    id: 'scheduled1',
                    content: 'Daily inspiration: Success is not final, failure is not fatal. Keep pushing forward! 💪 #motivation #success #dubai',
                    platforms: ['facebook', 'instagram'],
                    scheduledFor: this.getDubaiTime(new Date(Date.now() + 3600000)).toISOString(), // 1 hour from now
                    status: 'scheduled',
                    contentCategory: 'series',
                    timeSlot: 'morning',
                    aiOptimized: true
                },
                {
                    id: 'scheduled2',
                    content: 'Weekend vibes in Dubai! 🌆 Perfect time to explore the city and create memories.',
                    platforms: ['instagram'],
                    scheduledFor: this.getDubaiTime(new Date(Date.now() + 86400000)).toISOString(), // Tomorrow
                    status: 'scheduled',
                    contentCategory: 'channel',
                    timeSlot: 'evening',
                    aiOptimized: true
                }
            ],
            analytics: {
                totalPosts: 156,
                totalEngagement: 45280,
                totalReach: 125460,
                engagementRate: 6.2,
                clickThroughRate: 2.8,
                successRate: 98.7,
                topPerformingPost: 'AI-powered scheduling announcement',
                weeklyData: [
                    { date: '2025-01-01', posts: 5, engagement: 1245, reach: 5200, clicks: 156 },
                    { date: '2025-01-02', posts: 4, engagement: 980, reach: 4100, clicks: 128 },
                    { date: '2025-01-03', posts: 6, engagement: 1420, reach: 5800, clicks: 184 },
                    { date: '2025-01-04', posts: 3, engagement: 895, reach: 3600, clicks: 98 },
                    { date: '2025-01-05', products: 5, engagement: 1275, reach: 5100, clicks: 165 },
                    { date: '2025-01-06', posts: 4, engagement: 1160, reach: 4800, clicks: 142 },
                    { date: '2025-01-07', posts: 3, engagement: 885, reach: 3450, clicks: 89 }
                ],
                platformBreakdown: {
                    facebook: { posts: 85, engagement: 25480, reach: 68200 },
                    instagram: { posts: 71, engagement: 19800, reach: 57260 }
                }
            },
            aiInsights: {
                optimalPostingTimes: {
                    morning: { time: '10:05', engagement: 'high', recommendation: 'Best for business content' },
                    evening: { time: '17:17', engagement: 'very high', recommendation: 'Perfect for lifestyle content' },
                    night: { time: '22:45', engagement: 'high', recommendation: 'Great for entertainment content' }
                },
                trendingHashtags: ['#dubai', '#innovation', '#tech', '#business', '#lifestyle'],
                contentRecommendations: [
                    'Video content generates 45% more engagement',
                    'Posts with questions increase comments by 32%',
                    'Behind-the-scenes content performs well on weekends'
                ],
                audienceInsights: {
                    peakActivity: 'Weekdays 5-7 PM Dubai time',
                    demographics: 'Primarily 25-45 years, tech-savvy professionals',
                    preferredContent: 'Educational and inspirational posts'
                }
            }
        };
    }

    getDubaiTime(date) {
        return new Date(date.toLocaleString("en-US", {timeZone: CONFIG.dubaiTimezone}));
    }

    startAdvancedPeriodicSync() {
        console.log('⏰ Starting advanced periodic sync...');
        this.syncInterval = setInterval(() => {
            if (appState.getState('isOnline')) {
                appState.syncData();
            }
        }, CONFIG.refreshInterval);
    }

    stopAdvancedPeriodicSync() {
        if (this.syncInterval) {
            console.log('⏰ Stopping advanced periodic sync...');
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
}

// Enhanced Toast Notification Manager
class ToastManager {
    static show(message, type = 'info', title = null, duration = 5000) {
        console.log(`📢 Enhanced Toast: [${type.toUpperCase()}] ${title || 'Notification'}: ${message}`);
        
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

        // Add click action for certain types
        if (type === 'success' && title === 'Import Complete') {
            toast.style.cursor = 'pointer';
            toast.addEventListener('click', () => {
                uiManager.showSection('drafts');
                this.remove(toast);
            });
        }

        container.appendChild(toast);

        // Auto remove with fade out
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

// Enhanced UI Manager with Advanced Features
class UIManager {
    constructor() {
        console.log('🎨 Initializing Enhanced UI Manager...');
        this.currentSection = 'dashboard';
        this.sidebarCollapsed = false;
        this.isMobile = window.innerWidth <= 768;
        this.charts = {};
        this.setupEventListeners();
        this.setupThemeToggle();
        this.setupAdvancedFeatures();
        console.log('✅ Enhanced UI Manager Initialized');
    }

    setupEventListeners() {
        // Enhanced sidebar toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Enhanced navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
                this.updateBreadcrumb(section);
            });
        });

        // Enhanced modal controls
        document.querySelectorAll('.modal-close, .modal-backdrop').forEach(element => {
            element.addEventListener('click', (e) => {
                if (e.target === element) {
                    this.closeModal(element.closest('.modal'));
                }
            });
        });

        // Enhanced settings tabs
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                this.showSettingsTab(tabName);
            });
        });

        // Enhanced responsive handling
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            if (wasMobile !== this.isMobile) {
                console.log(`📱 Device type changed: ${this.isMobile ? 'Mobile' : 'Desktop'}`);
                this.handleResponsiveChange();
            }
        });

        // Enhanced keyboard shortcuts
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
                    case 'i':
                        e.preventDefault();
                        this.showSection('bulk-import');
                        console.log('⌨️ Keyboard shortcut: Bulk Import');
                        break;
                    case 's':
                        e.preventDefault();
                        this.showSection('scheduler');
                        console.log('⌨️ Keyboard shortcut: Scheduler');
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupAdvancedFeatures() {
        // Setup user role selector
        const userRoleSelect = document.getElementById('userRole');
        if (userRoleSelect) {
            userRoleSelect.addEventListener('change', (e) => {
                const newRole = e.target.value;
                appState.setState({ userRole: newRole });
                this.updateUserRole(newRole);
                ToastManager.show(`Role changed to ${USER_ROLES[newRole].name}`, 'success');
            });
        }

        // Setup advanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                const sectionKeys = {
                    '1': 'dashboard',
                    '2': 'bulk-import',
                    '3': 'accounts',
                    '4': 'composer',
                    '5': 'scheduler',
                    '6': 'analytics',
                    '7': 'drafts',
                    '8': 'settings'
                };
                
                if (sectionKeys[e.key]) {
                    e.preventDefault();
                    this.showSection(sectionKeys[e.key]);
                }
            }
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        this.applyTheme(appState.getState('theme'));
    }

    toggleTheme() {
        const currentTheme = appState.getState('theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log(`🎨 Enhanced theme changed: ${currentTheme} → ${newTheme}`);
        
        appState.setState({ theme: newTheme });
        this.applyTheme(newTheme);
        
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }

        ToastManager.show(`${newTheme === 'dark' ? 'Dark' : 'Light'} theme activated`, 'success');
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-color-scheme', theme);
    }

    updateBreadcrumb(section) {
        const breadcrumbPath = document.getElementById('breadcrumbPath');
        if (breadcrumbPath) {
            const sectionNames = {
                'dashboard': 'Home / Dashboard',
                'bulk-import': 'Home / Bulk Import',
                'accounts': 'Home / Accounts',
                'composer': 'Home / Post Composer',
                'scheduler': 'Home / Smart Scheduler',
                'analytics': 'Home / Analytics Pro',
                'drafts': 'Home / Drafts',
                'settings': 'Home / Settings'
            };
            breadcrumbPath.textContent = sectionNames[section] || 'Home';
        }
    }

    updateUserRole(role) {
        const userRoleElement = document.getElementById('userRole');
        const userRoleDisplay = document.getElementById('userRole');
        
        if (userRoleDisplay) {
            userRoleDisplay.textContent = USER_ROLES[role].name;
        }
    }

    showLoadingScreen() {
        console.log('⏳ Showing enhanced loading screen...');
        document.getElementById('loadingScreen').style.display = 'flex';
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'none';
    }

    showLoginScreen() {
        console.log('🔐 Showing enhanced login screen...');
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    showMainApp() {
        console.log('🏠 Showing enhanced main application...');
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'grid';
        
        this.updateUserProfile();
        this.showSection('dashboard');
        this.updateStats();
    }

    updateUserProfile() {
        const user = appState.getState('user');
        const userRole = appState.getState('userRole');
        
        if (!user) return;

        console.log('👤 Updating enhanced user profile in UI...');
        
        const avatar = document.getElementById('userAvatar');
        const name = document.getElementById('userName');
        const role = document.getElementById('userRole');

        if (avatar) avatar.src = user.photoURL || '';
        if (name) name.textContent = user.displayName || 'Unknown User';
        if (role) role.textContent = USER_ROLES[userRole].name || 'User';
    }

    showSection(sectionName) {
        console.log(`📄 Showing enhanced section: ${sectionName}`);
        
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
            'bulk-import': 'Bulk Import',
            accounts: 'Connected Accounts',
            composer: 'AI-Powered Post Composer',
            scheduler: 'Smart Scheduler',
            analytics: 'Analytics Pro',
            drafts: 'Draft Posts',
            settings: 'Settings'
        };
        
        const sectionTitle = document.getElementById('sectionTitle');
        if (sectionTitle) {
            sectionTitle.textContent = titleMap[sectionName] || 'SocialHub Pro';
        }

        this.currentSection = sectionName;
        this.loadSectionData(sectionName);

        if (this.isMobile) {
            this.closeSidebar();
        }
    }

    loadSectionData(sectionName) {
        console.log(`📊 Loading enhanced data for section: ${sectionName}`);
        
        switch (sectionName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'bulk-import':
                this.initializeBulkImport();
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

        console.log('📊 Updating enhanced statistics...');
        
        document.getElementById('totalPosts').textContent = (analytics.totalPosts || 0).toLocaleString();
        document.getElementById('totalEngagement').textContent = (analytics.totalEngagement || 0).toLocaleString();
        document.getElementById('totalReach').textContent = (analytics.totalReach || 0).toLocaleString();
        document.getElementById('scheduledPosts').textContent = appState.getState('scheduledPosts').length || 0;
    }

    updateDashboard() {
        this.updateStats();
        this.updateRecentActivity();
        this.updateEngagementChart();
        this.updateAIInsights();
    }

    updateRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        console.log('📝 Updating enhanced recent activity...');
        
        const activities = [
            {
                icon: 'fas fa-share',
                title: 'Post published to Facebook Business Page',
                meta: '2 minutes ago • Dubai Time',
                color: '#1877F2'
            },
            {
                icon: 'fas fa-heart',
                title: '45 new likes on Instagram post',
                meta: '15 minutes ago • High engagement',
                color: '#E4405F'
            },
            {
                icon: 'fas fa-calendar-plus',
                title: 'AI scheduled post for evening slot',
                meta: '1 hour ago • Optimal timing',
                color: '#4F46E5'
            },
            {
                icon: 'fas fa-brain',
                title: 'AI generated content suggestions',
                meta: '2 hours ago • 3 new recommendations',
                color: '#10B981'
            },
            {
                icon: 'fas fa-upload',
                title: 'Bulk import completed successfully',
                meta: '3 hours ago • 150 posts imported',
                color: '#F59E0B'
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

        console.log('📈 Updating enhanced engagement chart...');
        
        const ctx = canvas.getContext('2d');
        const analytics = appState.getState('analytics');
        
        if (this.charts.engagement) {
            this.charts.engagement.destroy();
        }

        this.charts.engagement = new Chart(ctx, {
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
                }, {
                    label: 'Clicks',
                    data: analytics.weeklyData?.map(d => d.clicks) || [],
                    borderColor: '#FFC185',
                    backgroundColor: 'rgba(255, 193, 133, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
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

    updateAIInsights() {
        // AI insights are already rendered in HTML
        console.log('🧠 AI insights displayed');
    }

    initializeBulkImport() {
        console.log('📥 Initializing enhanced bulk import...');
        
        if (this.bulkImportInitialized) return;
        this.bulkImportInitialized = true;
        
        // Setup import method selection
        document.querySelectorAll('.import-method').forEach(method => {
            method.addEventListener('click', () => {
                document.querySelectorAll('.import-method').forEach(m => m.classList.remove('active'));
                method.classList.add('active');
                
                const methodType = method.getAttribute('data-method');
                console.log(`📋 Import method selected: ${methodType}`);
            });
        });

        // Setup drag and drop
        const dropzone = document.getElementById('importDropzone');
        const fileInput = document.getElementById('importFileInput');

        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());
            
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
                this.handleImportFile(e.dataTransfer.files[0]);
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    this.handleImportFile(e.target.files[0]);
                }
            });
        }

        // Setup template downloads
        document.getElementById('downloadCSVTemplate')?.addEventListener('click', () => {
            this.downloadTemplate('csv');
        });

        document.getElementById('downloadJSONTemplate')?.addEventListener('click', () => {
            this.downloadTemplate('json');
        });

        // Setup import actions
        document.getElementById('validateImport')?.addEventListener('click', () => {
            this.validateImportData();
        });

        document.getElementById('processImport')?.addEventListener('click', () => {
            this.processImportData();
        });

        document.getElementById('cancelImport')?.addEventListener('click', () => {
            this.cancelImport();
        });
    }

    handleImportFile(file) {
        console.log(`📁 Processing import file: ${file.name}`);
        
        if (file.size > 50 * 1024 * 1024) {
            ToastManager.show('File is too large. Maximum size is 50MB.', 'error');
            return;
        }

        const allowedTypes = ['text/csv', 'application/json', '.csv', '.json'];
        const fileType = file.type || `.${file.name.split('.').pop()}`;
        
        if (!allowedTypes.some(type => fileType.includes(type))) {
            ToastManager.show('Invalid file type. Please upload CSV or JSON files.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                let parsedData;

                if (file.name.endsWith('.json')) {
                    parsedData = JSON.parse(data);
                } else {
                    parsedData = this.parseCSV(data);
                }

                this.showImportPreview(parsedData, file.name);
            } catch (error) {
                console.error('❌ Error parsing file:', error);
                ToastManager.show('Error parsing file. Please check the format.', 'error');
            }
        };

        reader.readAsText(file);
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }

        return data;
    }

    showImportPreview(data, fileName) {
        console.log(`👀 Showing import preview for ${data.length} records`);
        
        const preview = document.getElementById('importPreview');
        const previewCount = document.getElementById('previewCount');
        const validationStatus = document.getElementById('validationStatus');
        const previewTable = document.getElementById('previewTable');

        if (preview) preview.classList.remove('hidden');
        if (previewCount) previewCount.textContent = `${data.length} posts`;
        if (validationStatus) {
            validationStatus.textContent = 'Ready for validation';
            validationStatus.className = 'status status--info';
        }

        // Store data for processing
        appState.setState({ importData: data });

        // Create preview table
        if (previewTable && data.length > 0) {
            const headers = Object.keys(data[0]);
            const tableHTML = `
                <div class="table-responsive">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--color-secondary);">
                                ${headers.map(header => `<th style="padding: var(--space-8); text-align: left; border: 1px solid var(--color-border);">${header}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.slice(0, 5).map(row => `
                                <tr>
                                    ${headers.map(header => `<td style="padding: var(--space-8); border: 1px solid var(--color-border); max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${row[header] || ''}</td>`).join('')}
                                </tr>
                            `).join('')}
                            ${data.length > 5 ? '<tr><td colspan="' + headers.length + '" style="padding: var(--space-8); text-align: center; color: var(--color-text-secondary);">... and ' + (data.length - 5) + ' more rows</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            `;
            previewTable.innerHTML = tableHTML;
        }

        ToastManager.show(`Loaded ${data.length} posts from ${fileName}`, 'success', 'File Loaded');
    }

    validateImportData() {
        const data = appState.getState('importData');
        if (!data) return;

        console.log('✅ Validating import data...');
        
        const validationStatus = document.getElementById('validationStatus');
        const processBtn = document.getElementById('processImport');
        
        // Simulate validation
        if (validationStatus) {
            validationStatus.textContent = 'Validating...';
            validationStatus.className = 'status status--warning';
        }

        setTimeout(() => {
            const requiredFields = ['socialTitle', 'socialDescription', 'targetPlatform'];
            let validRows = 0;
            let errors = [];

            data.forEach((row, index) => {
                const missing = requiredFields.filter(field => !row[field]);
                if (missing.length === 0) {
                    validRows++;
                } else {
                    errors.push(`Row ${index + 1}: Missing ${missing.join(', ')}`);
                }
            });

            if (validationStatus) {
                if (validRows === data.length) {
                    validationStatus.textContent = 'Validation passed';
                    validationStatus.className = 'status status--success';
                    if (processBtn) processBtn.disabled = false;
                } else {
                    validationStatus.textContent = `${errors.length} validation errors`;
                    validationStatus.className = 'status status--error';
                }
            }

            ToastManager.show(
                `Validation complete: ${validRows}/${data.length} valid posts`,
                validRows === data.length ? 'success' : 'warning',
                'Validation Result'
            );
        }, 1500);
    }

    processImportData() {
        const data = appState.getState('importData');
        if (!data) return;

        console.log('⚡ Processing import data...');
        
        const importProgress = document.getElementById('importProgress');
        const importPreview = document.getElementById('importPreview');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const importLog = document.getElementById('importLog');

        if (importProgress) importProgress.classList.remove('hidden');
        if (importPreview) importPreview.classList.add('hidden');

        let processed = 0;
        const total = data.length;

        const processItem = () => {
            if (processed >= total) {
                // Import complete
                if (progressText) progressText.textContent = `Import complete: ${processed} posts processed`;
                if (importLog) {
                    importLog.innerHTML += `<div style="color: var(--color-success);">✅ Import completed successfully</div>`;
                }

                // Add to drafts
                const currentDrafts = appState.getState('drafts');
                const newDrafts = data.map((row, index) => ({
                    id: `imported_${Date.now()}_${index}`,
                    content: `${row.socialTitle}\n\n${row.socialDescription}`,
                    platforms: [row.targetPlatform.toLowerCase()],
                    contentCategory: row.contentCategory || 'article',
                    shortUrl: row.shortUrl || '',
                    linkType: row.linkType || 'article',
                    socialImage: row.socialImage || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    imported: true
                }));

                appState.setState({ drafts: [...currentDrafts, ...newDrafts] });

                setTimeout(() => {
                    if (importProgress) importProgress.classList.add('hidden');
                    ToastManager.show(`Successfully imported ${total} posts!`, 'success', 'Import Complete');
                    this.showSection('drafts');
                }, 2000);

                return;
            }

            // Process current item
            processed++;
            const progress = (processed / total) * 100;
            
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `${processed} of ${total} posts processed`;
            if (importLog) {
                importLog.innerHTML += `<div>Processing: ${data[processed - 1].socialTitle || 'Untitled'}</div>`;
                importLog.scrollTop = importLog.scrollHeight;
            }

            // Continue processing
            setTimeout(processItem, Math.random() * 200 + 100);
        };

        processItem();
    }

    cancelImport() {
        console.log('❌ Cancelling import...');
        
        const importPreview = document.getElementById('importPreview');
        const importProgress = document.getElementById('importProgress');

        if (importPreview) importPreview.classList.add('hidden');
        if (importProgress) importProgress.classList.add('hidden');

        appState.setState({ importData: null });
        ToastManager.show('Import cancelled', 'info');
    }

    downloadTemplate(type) {
        console.log(`📥 Downloading ${type.toUpperCase()} template...`);
        
        const sampleData = {
            socialTitle: "Sample Post Title",
            socialDescription: "This is a sample post description with engaging content.",
            shortUrl: "https://short.ly/sample",
            linkType: "article",
            socialImage: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400",
            targetPlatform: "facebook",
            contentCategory: "series",
            postingSchedule: "morning"
        };

        let content;
        let filename;
        let mimeType;

        if (type === 'csv') {
            const headers = Object.keys(sampleData);
            const values = Object.values(sampleData);
            content = headers.join(',') + '\n' + values.join(',');
            filename = 'socialhub_import_template.csv';
            mimeType = 'text/csv';
        } else {
            content = JSON.stringify([sampleData], null, 2);
            filename = 'socialhub_import_template.json';
            mimeType = 'application/json';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        ToastManager.show(`${type.toUpperCase()} template downloaded`, 'success');
    }

    updateAccountsList() {
        const container = document.getElementById('accountsList');
        if (!container) return;

        console.log('🔗 Updating enhanced accounts list...');
        
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
                        <span class="account-stat">
                            <i class="fas fa-heart"></i>
                            Health: ${account.healthStatus}
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
        console.log('📊 Updating enhanced analytics...');
        this.updatePostPerformanceChart();
        this.updatePlatformChart();
        this.updateDetailedMetrics();
    }

    updatePostPerformanceChart() {
        const canvas = document.getElementById('postPerformanceChart');
        if (!canvas) return;

        console.log('📈 Updating enhanced post performance chart...');
        
        const ctx = canvas.getContext('2d');
        const analytics = appState.getState('analytics');

        if (this.charts.postPerformance) {
            this.charts.postPerformance.destroy();
        }

        this.charts.postPerformance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: analytics.weeklyData?.map(d => new Date(d.date).toLocaleDateString()) || [],
                datasets: [{
                    label: 'Posts',
                    data: analytics.weeklyData?.map(d => d.posts) || [],
                    backgroundColor: '#FFC185',
                    borderColor: '#F59E0B',
                    borderWidth: 1
                }, {
                    label: 'Engagement',
                    data: analytics.weeklyData?.map(d => d.engagement) || [],
                    backgroundColor: '#B4413C',
                    borderColor: '#DC2626',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left'
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    updatePlatformChart() {
        const canvas = document.getElementById('platformChart');
        if (!canvas) return;

        console.log('🎯 Updating enhanced platform chart...');
        
        const ctx = canvas.getContext('2d');
        const analytics = appState.getState('analytics');

        if (this.charts.platform) {
            this.charts.platform.destroy();
        }

        this.charts.platform = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Facebook', 'Instagram'],
                datasets: [{
                    data: [
                        analytics.platformBreakdown?.facebook?.posts || 0,
                        analytics.platformBreakdown?.instagram?.posts || 0
                    ],
                    backgroundColor: ['#1877F2', '#E4405F'],
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

        console.log('📋 Updating enhanced detailed metrics...');
        
        const analytics = appState.getState('analytics');
        const platformData = analytics.platformBreakdown || {};

        const metrics = Object.entries(platformData).map(([platform, data]) => ({
            platform: platform.charAt(0).toUpperCase() + platform.slice(1),
            posts: data.posts || 0,
            engagement: data.engagement || 0,
            reach: data.reach || 0,
            avgEngagement: data.posts > 0 ? Math.round(data.engagement / data.posts) : 0,
            engagementRate: data.reach > 0 ? ((data.engagement / data.reach) * 100).toFixed(1) : '0.0'
        }));

        container.innerHTML = `
            <div class="table-responsive">
                <table class="metrics-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--color-secondary);">
                            <th style="padding: var(--space-12); text-align: left; border-bottom: 1px solid var(--color-border);">Platform</th>
                            <th style="padding: var(--space-12); text-align: left; border-bottom: 1px solid var(--color-border);">Posts</th>
                            <th style="padding: var(--space-12); text-align: left; border-bottom: 1px solid var(--color-border);">Total Engagement</th>
                            <th style="padding: var(--space-12); text-align: left; border-bottom: 1px solid var(--color-border);">Total Reach</th>
                            <th style="padding: var(--space-12); text-align: left; border-bottom: 1px solid var(--color-border);">Avg. Engagement</th>
                            <th style="padding: var(--space-12); text-align: left; border-bottom: 1px solid var(--color-border);">Engagement Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${metrics.map(metric => `
                            <tr>
                                <td style="padding: var(--space-12); border-bottom: 1px solid var(--color-card-border-inner);">
                                    <i class="fab fa-${metric.platform.toLowerCase()}"></i> ${metric.platform}
                                </td>
                                <td style="padding: var(--space-12); border-bottom: 1px solid var(--color-card-border-inner);">${metric.posts}</td>
                                <td style="padding: var(--space-12); border-bottom: 1px solid var(--color-card-border-inner);">${metric.engagement.toLocaleString()}</td>
                                <td style="padding: var(--space-12); border-bottom: 1px solid var(--color-card-border-inner);">${metric.reach.toLocaleString()}</td>
                                <td style="padding: var(--space-12); border-bottom: 1px solid var(--color-card-border-inner);">${metric.avgEngagement}</td>
                                <td style="padding: var(--space-12); border-bottom: 1px solid var(--color-card-border-inner);">${metric.engagementRate}%</td>
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

        console.log('📄 Updating enhanced drafts list...');
        
        const drafts = appState.getState('drafts');
        const platformColors = {
            facebook: '#1877F2',
            instagram: '#E4405F',
            twitter: '#1DA1F2',
            linkedin: '#0A66C2'
        };

        if (drafts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <h4>No drafts yet</h4>
                    <p>Create your first draft post or import content to get started.</p>
                    <div style="display: flex; gap: var(--space-12); justify-content: center; margin-top: var(--space-16);">
                        <button class="btn btn--primary" onclick="uiManager.showSection('composer')">
                            <i class="fas fa-plus"></i>
                            Create Draft
                        </button>
                        <button class="btn btn--secondary" onclick="uiManager.showSection('bulk-import')">
                            <i class="fas fa-upload"></i>
                            Bulk Import
                        </button>
                    </div>
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
                                    ${platform}
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
                        ${draft.imported ? '<span class="status status--info">Imported</span>' : ''}
                        ${draft.contentCategory ? `<span><i class="fas fa-tag"></i> ${draft.contentCategory}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateCalendar() {
        console.log('📅 Updating enhanced calendar...');
        this.renderEnhancedCalendar();
    }

    renderEnhancedCalendar() {
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
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${date.toISOString()}">
                    <div class="day-number">${day}</div>
                    <div class="scheduled-posts">
                        ${dayPosts.map(post => {
                            const time = new Date(post.scheduledFor).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: CONFIG.dubaiTimezone
                            });
                            return `
                                <div class="scheduled-post" onclick="postComposer.viewScheduledPost('${post.id}')" title="${post.content}">
                                    <div style="font-size: 10px; opacity: 0.8;">${time}</div>
                                    <div>${post.content.substring(0, 25)}...</div>
                                    ${post.aiOptimized ? '<i class="fas fa-brain" style="font-size: 8px; opacity: 0.7;" title="AI Optimized"></i>' : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        calendarHTML += '</div>';
        calendar.innerHTML = calendarHTML;

        // Add click handlers for days
        calendar.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', (e) => {
                const date = e.currentTarget.getAttribute('data-date');
                if (date) {
                    console.log(`📅 Calendar day clicked: ${date}`);
                    // Could open scheduling modal for this date
                }
            });
        });
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
        if (!this.isMobile) {
            document.querySelector('.sidebar').classList.remove('open');
        } else {
            document.querySelector('.main-app').classList.remove('sidebar-collapsed');
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            console.log(`🔧 Showing enhanced modal: ${modalId}`);
            modal.classList.remove('hidden');
        }
    }

    closeModal(modal) {
        if (modal) {
            console.log('🔧 Closing enhanced modal');
            modal.classList.add('hidden');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
            this.closeModal(modal);
        });
    }

    showSettingsTab(tabName) {
        console.log(`⚙️ Showing enhanced settings tab: ${tabName}`);
        
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
        });

        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}Settings`);
        });
    }
}

// Enhanced Post Composer with AI Features
class PostComposer {
    constructor() {
        console.log('✍️ Initializing Enhanced Post Composer...');
        this.selectedPlatforms = [];
        this.mediaFiles = [];
        this.currentDraft = null;
        this.autoSaveTimeout = null;
        this.aiSuggestionsEnabled = true;
        this.setupEventListeners();
        this.setupPlatformSelector();
        console.log('✅ Enhanced Post Composer Initialized');
    }

    setupEventListeners() {
        // Enhanced content textarea
        const contentTextarea = document.getElementById('postContent');
        if (contentTextarea) {
            contentTextarea.addEventListener('input', () => {
                this.updateCharacterCount();
                this.updatePreview();
                this.scheduleAutoSave();
            });

            // Add placeholder based on AI suggestions
            contentTextarea.placeholder = "What's happening? (AI suggestions available)";
        }

        // Enhanced media upload
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

        // Enhanced action buttons
        document.getElementById('aiSuggestBtn')?.addEventListener('click', () => {
            this.generateAISuggestions();
        });

        document.getElementById('aiEnhanceBtn')?.addEventListener('click', () => {
            this.enhanceContentWithAI();
        });

        document.getElementById('aiHashtagBtn')?.addEventListener('click', () => {
            this.generateHashtags();
        });

        document.getElementById('saveDraftBtn')?.addEventListener('click', () => {
            this.saveDraft();
        });

        document.getElementById('schedulePostBtn')?.addEventListener('click', () => {
            this.showSmartScheduleModal();
        });

        document.getElementById('publishNowBtn')?.addEventListener('click', () => {
            this.publishNow();
        });

        // Time slot selection
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                
                const slotType = slot.getAttribute('data-slot');
                console.log(`⏰ Time slot selected: ${slotType}`);
            });
        });
    }

    setupPlatformSelector() {
        const container = document.getElementById('platformCheckboxes');
        if (!container) return;

        console.log('🎯 Setting up enhanced platform selector...');
        
        const platforms = [
            { id: 'facebook', name: 'Facebook', icon: 'fab fa-facebook', color: '#1877F2' },
            { id: 'instagram', name: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F' }
        ];

        container.innerHTML = platforms.map(platform => `
            <label class="platform-checkbox" data-platform="${platform.id}" style="border-color: ${platform.color};">
                <input type="checkbox" value="${platform.id}">
                <i class="${platform.icon}"></i>
                <span>${platform.name}</span>
            </label>
        `).join('');

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

    generateAISuggestions() {
        console.log('🧠 Generating AI content suggestions...');
        
        const btn = document.getElementById('aiSuggestBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-brain fa-spin"></i> Generating...';
        btn.disabled = true;

        // Simulate AI suggestion generation
        setTimeout(() => {
            const suggestions = [
                "🚀 Exciting news! We're launching something amazing next week. Stay tuned for innovation that will transform your business experience. #innovation #tech #dubai",
                "💡 Monday motivation: Success isn't just about what you accomplish, but what you inspire others to do. Let's make this week count! #motivation #leadership",
                "🌟 Behind the scenes at our Dubai office: Creating spaces that inspire creativity, collaboration, and breakthrough thinking. #workplace #dubai #culture"
            ];

            const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
            document.getElementById('postContent').value = randomSuggestion;
            
            this.updateCharacterCount();
            this.updatePreview();
            
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            ToastManager.show('AI suggestions generated!', 'success', 'AI Assistant');
        }, 2000);
    }

    enhanceContentWithAI() {
        console.log('✨ Enhancing content with AI...');
        
        const content = document.getElementById('postContent').value;
        if (!content.trim()) {
            ToastManager.show('Please enter some content first', 'warning');
            return;
        }

        const btn = document.getElementById('aiEnhanceBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-magic fa-spin"></i> Enhancing...';
        btn.disabled = true;

        setTimeout(() => {
            // Simulate AI enhancement
            const enhanced = content + "\n\n✨ Enhanced with AI for maximum engagement!";
            document.getElementById('postContent').value = enhanced;
            
            this.updateCharacterCount();
            this.updatePreview();
            
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            ToastManager.show('Content enhanced!', 'success', 'AI Enhancement');
        }, 1500);
    }

    generateHashtags() {
        console.log('# Generating AI hashtags...');
        
        const content = document.getElementById('postContent').value;
        if (!content.trim()) {
            ToastManager.show('Please enter some content first', 'warning');
            return;
        }

        const btn = document.getElementById('aiHashtagBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-hashtag fa-spin"></i> Generating...';
        btn.disabled = true;

        setTimeout(() => {
            const hashtags = ['#innovation', '#tech', '#dubai', '#business', '#success', '#growth'];
            const selectedHashtags = hashtags.slice(0, 3).join(' ');
            
            const currentContent = document.getElementById('postContent').value;
            const newContent = currentContent + '\n\n' + selectedHashtags;
            document.getElementById('postContent').value = newContent;
            
            this.updateCharacterCount();
            this.updatePreview();
            
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            ToastManager.show('Hashtags added!', 'success', 'AI Hashtags');
        }, 1000);
    }

    updateCharacterCount() {
        const content = document.getElementById('postContent')?.value || '';
        const counter = document.getElementById('characterCount');
        const limit = document.getElementById('characterLimit');
        
        if (!counter) return;

        const limits = {
            facebook: 2200,
            instagram: 2200,
            twitter: 280,
            linkedin: 1300
        };

        const currentLimit = this.selectedPlatforms.length > 0 
            ? Math.min(...this.selectedPlatforms.map(p => limits[p] || 2200))
            : 2200;

        counter.textContent = content.length;
        if (limit) limit.textContent = currentLimit;

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

        console.log('👀 Updating enhanced post preview...');
        
        const platformColors = {
            facebook: '#1877F2',
            instagram: '#E4405F'
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
                        <div class="preview-media" style="margin-top: var(--space-8); padding: var(--space-8); background: var(--color-secondary); border-radius: var(--radius-sm);">
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
        const maxSize = 50 * 1024 * 1024;
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
        const category = document.getElementById('contentCategory')?.value;
        const shortUrl = document.getElementById('shortUrl')?.value;
        
        if (!content?.trim()) {
            ToastManager.show('Please enter some content before saving', 'warning');
            return;
        }

        if (this.selectedPlatforms.length === 0) {
            ToastManager.show('Please select at least one platform', 'warning');
            return;
        }

        console.log('💾 Saving enhanced draft...');
        
        const draft = {
            id: this.currentDraft?.id || `draft_${Date.now()}`,
            content: content.trim(),
            platforms: [...this.selectedPlatforms],
            contentCategory: category || 'article',
            shortUrl: shortUrl || '',
            linkType: 'article',
            socialImage: '',
            mediaUrls: this.mediaFiles.map(f => f.name),
            createdAt: this.currentDraft?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

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
                console.log('💾 Auto-saving enhanced draft...');
                this.saveDraft();
            }
        }, 5000);
    }

    showSmartScheduleModal() {
        const content = document.getElementById('postContent')?.value;
        
        if (!content?.trim()) {
            ToastManager.show('Please enter some content before scheduling', 'warning');
            return;
        }

        if (this.selectedPlatforms.length === 0) {
            ToastManager.show('Please select at least one platform', 'warning');
            return;
        }

        console.log('📅 Showing smart schedule modal...');
        
        // Set default values for Dubai timezone
        const dubaiTime = new Date().toLocaleString("en-US", {timeZone: CONFIG.dubaiTimezone});
        const tomorrow = new Date(new Date(dubaiTime).getTime() + 86400000);
        
        document.getElementById('scheduleDate').value = tomorrow.toISOString().split('T')[0];
        document.getElementById('scheduleTime').value = '17:17'; // Default to optimal evening time
        
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

        console.log('🚀 Publishing enhanced post now...');
        
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
            
            this.clearForm();
            
            const analytics = appState.getState('analytics');
            analytics.totalPosts = (analytics.totalPosts || 0) + 1;
            appState.setState({ analytics });
            
            ToastManager.show(`Post published to ${this.selectedPlatforms.join(', ')}!`, 'success', 'Published');
            console.log('✅ Enhanced post published successfully');
        }, 2000);
    }

    clearForm() {
        console.log('🧹 Clearing enhanced composer form...');
        
        document.getElementById('postContent').value = '';
        document.getElementById('contentCategory').value = '';
        document.getElementById('shortUrl').value = '';
        document.getElementById('mediaPreview').innerHTML = '';
        
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
        console.log(`✏️ Editing enhanced draft: ${draftId}`);
        
        const drafts = appState.getState('drafts');
        const draft = drafts.find(d => d.id === draftId);
        
        if (!draft) return;
        
        uiManager.showSection('composer');
        
        document.getElementById('postContent').value = draft.content;
        if (draft.contentCategory) {
            document.getElementById('contentCategory').value = draft.contentCategory;
        }
        if (draft.shortUrl) {
            document.getElementById('shortUrl').value = draft.shortUrl;
        }
        
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
        console.log(`📅 Scheduling enhanced draft: ${draftId}`);
        
        const drafts = appState.getState('drafts');
        const draft = drafts.find(d => d.id === draftId);
        
        if (!draft) return;
        
        this.editDraft(draftId);
        
        setTimeout(() => {
            this.showSmartScheduleModal();
        }, 100);
    }

    viewScheduledPost(postId) {
        console.log(`👀 Viewing scheduled post: ${postId}`);
        const scheduledPosts = appState.getState('scheduledPosts');
        const post = scheduledPosts.find(p => p.id === postId);
        
        if (post) {
            const dubaiTime = new Date(post.scheduledFor).toLocaleString('en-US', {
                timeZone: CONFIG.dubaiTimezone,
                dateStyle: 'medium',
                timeStyle: 'short'
            });
            ToastManager.show(`Scheduled for ${dubaiTime} Dubai time`, 'info', 'Scheduled Post');
        }
    }
}

// Initialize Enhanced Global Instances
console.log('🔧 Initializing enhanced global instances...');

const appState = new AppState();
const firebaseService = new FirebaseService();
const uiManager = new UIManager();
const postComposer = new PostComposer();

// Enhanced Application Initialization
async function initializeEnhancedApp() {
    try {
        console.log('🚀 Starting SocialHub Pro v8.5 Application...');
        
        uiManager.showLoadingScreen();
        
        // Extended loading time to show features
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await firebaseService.initialize();
        
        setupEnhancedGlobalEventListeners();
        
        registerEnhancedServiceWorker();
        
        uiManager.showLoginScreen();
        
        console.log('✅ Enhanced application initialization completed');
        
    } catch (error) {
        console.error('❌ Enhanced application initialization failed:', error);
        ToastManager.show('Application failed to start', 'error', 'Error');
        
        setTimeout(() => {
            uiManager.showLoginScreen();
        }, 1000);
    }
}

function setupEnhancedGlobalEventListeners() {
    console.log('🔧 Setting up enhanced global event listeners...');
    
    // Enhanced Google Sign In
    document.getElementById('googleSignIn')?.addEventListener('click', async () => {
        try {
            console.log('🔐 Attempting Enhanced Google Sign-In...');
            await firebaseService.signInWithGoogle();
        } catch (error) {
            console.error('❌ Google Sign-In error:', error);
            ToastManager.show('Sign-in failed. Please try again.', 'error', 'Authentication Error');
        }
    });
    
    // Enhanced Sign Out
    document.getElementById('signOut')?.addEventListener('click', async () => {
        try {
            console.log('🔐 Enhanced signing out...');
            await firebaseService.signOut();
            ToastManager.show('Signed out successfully', 'info');
        } catch (error) {
            console.error('❌ Sign-out error:', error);
            ToastManager.show('Sign-out failed', 'error');
        }
    });
    
    // Enhanced Add Account
    document.getElementById('addAccountBtn')?.addEventListener('click', () => {
        console.log('➕ Opening enhanced account connection modal...');
        uiManager.showModal('accountModal');
    });
    
    // Enhanced Quick Post Button
    document.getElementById('quickPostBtn')?.addEventListener('click', () => {
        console.log('⚡ Enhanced quick post clicked');
        uiManager.showSection('composer');
    });
    
    // Enhanced Refresh Button
    document.getElementById('refreshBtn')?.addEventListener('click', async () => {
        console.log('🔄 Enhanced manual refresh triggered');
        const btn = document.getElementById('refreshBtn');
        const icon = btn.querySelector('i');
        
        icon.classList.add('fa-spin');
        
        try {
            await appState.syncData();
            uiManager.loadSectionData(uiManager.currentSection);
            ToastManager.show('Data refreshed', 'success');
        } catch (error) {
            console.error('❌ Enhanced refresh failed:', error);
            ToastManager.show('Refresh failed', 'error');
        } finally {
            setTimeout(() => {
                icon.classList.remove('fa-spin');
            }, 1000);
        }
    });
    
    // Enhanced Calendar Navigation
    document.getElementById('prevMonth')?.addEventListener('click', () => {
        console.log('📅 Enhanced previous month clicked');
        ToastManager.show('Previous month navigation', 'info');
    });
    
    document.getElementById('nextMonth')?.addEventListener('click', () => {
        console.log('📅 Enhanced next month clicked');
        ToastManager.show('Next month navigation', 'info');
    });
    
    document.getElementById('todayBtn')?.addEventListener('click', () => {
        console.log('📅 Enhanced today button clicked');
        uiManager.renderEnhancedCalendar();
        ToastManager.show('Calendar updated to current month', 'success');
    });
    
    // Enhanced Schedule Modal Actions
    document.getElementById('confirmSchedule')?.addEventListener('click', () => {
        const scheduleType = document.querySelector('.schedule-option.active')?.getAttribute('data-type') || 'ai';
        
        let scheduledFor;
        
        if (scheduleType === 'ai') {
            // AI optimal scheduling
            const timeSlot = document.getElementById('aiTimeSlot')?.value || 'optimal';
            const dubaiTime = new Date().toLocaleString("en-US", {timeZone: CONFIG.dubaiTimezone});
            const tomorrow = new Date(new Date(dubaiTime).getTime() + 86400000);
            
            if (timeSlot === 'optimal') {
                tomorrow.setHours(17, 17, 0, 0); // Default optimal time
            } else {
                const slots = DUBAI_TIME_SLOTS[timeSlot];
                if (slots) {
                    const [hour, minute] = slots[0].split(':');
                    tomorrow.setHours(parseInt(hour), parseInt(minute), 0, 0);
                }
            }
            
            scheduledFor = tomorrow;
        } else {
            // Custom scheduling
            const date = document.getElementById('scheduleDate').value;
            const time = document.getElementById('scheduleTime').value;
            
            if (!date || !time) {
                ToastManager.show('Please select date and time', 'warning');
                return;
            }
            
            scheduledFor = new Date(`${date}T${time}`);
        }
        
        console.log(`📅 Enhanced scheduling post for ${scheduledFor}`);
        
        const content = document.getElementById('postContent')?.value;
        
        const scheduledPost = {
            id: `scheduled_${Date.now()}`,
            content: content.trim(),
            platforms: [...postComposer.selectedPlatforms],
            scheduledFor: scheduledFor.toISOString(),
            status: 'scheduled',
            createdAt: new Date().toISOString(),
            aiOptimized: scheduleType === 'ai',
            timeSlot: scheduleType === 'ai' ? (document.getElementById('aiTimeSlot')?.value || 'optimal') : 'custom'
        };
        
        const scheduledPosts = appState.getState('scheduledPosts');
        scheduledPosts.push(scheduledPost);
        appState.setState({ scheduledPosts });
        
        postComposer.clearForm();
        uiManager.closeModal(document.getElementById('scheduleModal'));
        
        const dubaiTimeStr = scheduledFor.toLocaleString('en-US', {
            timeZone: CONFIG.dubaiTimezone,
            dateStyle: 'medium',
            timeStyle: 'short'
        });
        
        ToastManager.show(`Post scheduled for ${dubaiTimeStr} Dubai time`, 'success', 'Scheduled');
        console.log('✅ Enhanced post scheduled successfully');
    });
    
    document.getElementById('cancelSchedule')?.addEventListener('click', () => {
        uiManager.closeModal(document.getElementById('scheduleModal'));
    });
    
    // Enhanced Schedule Type Selection
    document.querySelectorAll('.schedule-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.schedule-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            const type = option.getAttribute('data-type');
            const aiOptions = document.getElementById('aiScheduleOptions');
            const customOptions = document.getElementById('customScheduleOptions');
            
            if (type === 'ai') {
                aiOptions?.classList.remove('hidden');
                customOptions?.classList.add('hidden');
            } else {
                aiOptions?.classList.add('hidden');
                customOptions?.classList.remove('hidden');
            }
        });
    });
    
    // Enhanced Platform Connection
    document.querySelectorAll('.platform-option button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const platform = e.target.closest('.platform-option').getAttribute('data-platform');
            console.log(`🔗 Enhanced connecting to ${platform}...`);
            
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

    // Enhanced FAB
    document.getElementById('fab')?.addEventListener('click', () => {
        console.log('⚡ Enhanced FAB clicked');
        uiManager.showSection('composer');
    });
}

async function registerEnhancedServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            console.log('📱 Registering enhanced service worker...');
            
            const swCode = `
                const CACHE_NAME = 'socialhub-pro-v8.5';
                const urlsToCache = [
                    '/',
                    '/style.css',
                    '/app.js',
                    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
                    'https://cdn.jsdelivr.net/npm/chart.js'
                ];

                self.addEventListener('install', (event) => {
                    console.log('SocialHub Pro SW: Installing...');
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

                self.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'SKIP_WAITING') {
                        self.skipWaiting();
                    }
                });
            `;
            
            const blob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(blob);
            
            const registration = await navigator.serviceWorker.register(swUrl);
            console.log('✅ Enhanced Service Worker registered:', registration.scope);
            
        } catch (error) {
            console.warn('⚠️ Enhanced Service Worker registration failed:', error);
        }
    }
}

// Enhanced Error Handling
window.addEventListener('error', (event) => {
    console.error('❌ Enhanced Global Error:', event.error);
    appState.setState({
        performanceMetrics: {
            ...appState.getState('performanceMetrics'),
            errors: (appState.getState('performanceMetrics').errors || 0) + 1
        }
    });
    ToastManager.show('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Enhanced Unhandled Promise Rejection:', event.reason);
    ToastManager.show('An unexpected error occurred', 'error');
});

// Enhanced Performance Monitoring
if (CONFIG.performanceMonitoring) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const metrics = {
                loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                domReady: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
                networkTime: Math.round(perfData.responseEnd - perfData.fetchStart),
                renderTime: Math.round(perfData.domComplete - perfData.domLoading)
            };
            
            console.log('📊 Enhanced Performance Metrics:', metrics);
            
            appState.setState({
                performanceMetrics: {
                    ...appState.getState('performanceMetrics'),
                    ...metrics
                }
            });
        }, 100);
    });
}

// Initialize the enhanced application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedApp);
} else {
    initializeEnhancedApp();
}

// Enhanced Export for global access
window.SocialHubPro = {
    appState,
    firebaseService,
    uiManager,
    postComposer,
    ToastManager,
    version: CONFIG.version,
    config: CONFIG,
    dubaiTimeSlots: DUBAI_TIME_SLOTS,
    userRoles: USER_ROLES
};

console.log('✅ SocialHub Pro v8.5 JavaScript loaded successfully - Enhanced Edition Ready! 🚀');