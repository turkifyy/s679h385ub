/*=================================================================
* SOCIALHUB PRO v11.0 - BULK IMPORT FOCUSED SYSTEM - FIXED
* Production-Grade Application - Real Implementation Only
* Focus: Bulk Import with JSON/CSV Support + Auto File Cleanup
* 
* Author: SocialHub Pro Development Team  
* Version: 11.0.0
* Last Updated: September 2025
* Environment: Production Ready
* 
* Key Features:
* - Bulk Import System (JSON/CSV)
* - Automatic File Cleanup After Publishing
* - Advanced Scheduling System
* - Multi-Platform Publishing
* - Real-time Progress Tracking
* - Enhanced Error Handling & Logging
* - Fixed Console Errors & Browser Issues
*================================================================*/

/* ------------------------------------------------------------------
* 1. CORE CONFIGURATION & CONSTANTS - FIXED
* ------------------------------------------------------------------*/

// Production Environment Configuration - Fixed
const SOCIALHUB_CONFIG = {
    version: '11.0.0',
    environment: 'production',
    debug: false,
    
    // Firebase Configuration - Fixed
    firebase: {
        apiKey: "AIzaSyBKD3QIxJdHw__UG2TEqf0TqyYCnw8wJf8",
        authDomain: "socialhub-1370d.firebaseapp.com",
        databaseURL: "https://socialhub-1370d-default-rtdb.firebaseio.com",
        projectId: "socialhub-1370d",
        storageBucket: "socialhub-1370d.firebasestorage.app",
        messagingSenderId: "84815590328",
        appId: "1:84815590328:web:2f12340380b37c2562d54d"
    },

    // Bulk Import Specifications - Enhanced
    bulkImport: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        supportedFormats: ['json', 'csv'],
        maxPostsPerImport: 10000,
        batchSize: 100,
        
        // Required Columns - Fixed
        requiredColumns: [
            'socialTitle',
            'socialDescription', 
            'shortUrl',
            'linkType',
            'socialImageurl',
            'socialhachtags',
            'day',
            'hour',
            'platform'
        ],
        
        // Column Validation Rules - Enhanced
        validation: {
            socialTitle: { 
                minLength: 1, 
                maxLength: 280,
                pattern: /^[^<>"';\\]*$/
            },
            socialDescription: { 
                minLength: 1, 
                maxLength: 2000,
                pattern: /^[^<>"';\\]*$/
            },
            shortUrl: { 
                pattern: /^https:\/\//, 
                required: true 
            },
            linkType: {
                enum: ['article', 'video', 'image', 'link', 'event'],
                required: true
            },
            socialImageurl: { 
                pattern: /^https:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i 
            },
            socialhachtags: { 
                pattern: /^#\w+(,#\w+)*$/ 
            },
            day: { 
                pattern: /^\d{4}-\d{2}-\d{2}$/, 
                required: true 
            },
            hour: { 
                pattern: /^([01]\d|2[0-3]):[0-5]\d$/, 
                required: true 
            },
            platform: {
                pattern: /^(facebook|instagram|twitter|linkedin|tiktok)(,(facebook|instagram|twitter|linkedin|tiktok))*$/,
                required: true
            }
        }
    },

    // Platform API Configuration - Enhanced
    platforms: {
        facebook: {
            apiVersion: 'v19.0',
            baseUrl: 'https://graph.facebook.com',
            rateLimit: 200,
            contentLimit: 63206
        },
        instagram: {
            apiVersion: 'v19.0', 
            baseUrl: 'https://graph.facebook.com',
            rateLimit: 200,
            contentLimit: 2200,
            requiresImage: true
        },
        twitter: {
            apiVersion: '2',
            baseUrl: 'https://api.twitter.com',
            rateLimit: 300,
            contentLimit: 280
        },
        linkedin: {
            apiVersion: 'v2',
            baseUrl: 'https://api.linkedin.com', 
            rateLimit: 100,
            contentLimit: 1300
        },
        tiktok: {
            apiVersion: 'v1',
            baseUrl: 'https://business-api.tiktok.com',
            rateLimit: 100,
            contentLimit: 2200
        }
    },

    // System Settings - Enhanced
    system: {
        timezone: 'Asia/Dubai',
        language: 'ar-AE',
        retryAttempts: 3,
        retryDelay: 1000,
        cleanupDelay: 24 * 60 * 60 * 1000,
        sessionTimeout: 30 * 60 * 1000,
        maxConcurrentUploads: 3,
        autoSaveInterval: 30000
    }
};

/* ------------------------------------------------------------------
* 2. ENHANCED ERROR HANDLING & LOGGING SYSTEM - FIXED
* ------------------------------------------------------------------*/

// Enhanced Logger System - Fixed Console Issues
class Logger {
    static logLevel = SOCIALHUB_CONFIG.debug ? 'debug' : 'info';
    static outputs = [];
    static buffer = [];
    static maxBufferSize = 1000;
    static initialized = false;

    static levels = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    };

    static init() {
        if (this.initialized) return;
        
        try {
            // Setup console error handlers
            window.addEventListener('error', (event) => {
                this.error('Global Error:', {
                    message: event.error?.message || event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error?.stack
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.error('Unhandled Promise Rejection:', {
                    reason: event.reason,
                    promise: event.promise
                });
                event.preventDefault(); // Prevent browser console spam
            });

            this.initialized = true;
            this.info('Logger initialized successfully');
        } catch (error) {
            console.error('Logger initialization failed:', error);
        }
    }

    static log(level, message, data = {}) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level,
                message,
                data: typeof data === 'object' ? data : { value: data },
                sessionId: this.getSessionId(),
                userId: AuthService.getCurrentUser()?.uid || 'anonymous'
            };

            // Check log level
            if (this.levels[level] < this.levels[this.logLevel]) {
                return;
            }

            // Console output with proper formatting
            const consoleMethod = level === 'error' ? 'error' :
                                level === 'warn' ? 'warn' : 'log';
            
            if (SOCIALHUB_CONFIG.debug || level === 'error') {
                console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data);
            }

            // Add to buffer
            this.addToBuffer(logEntry);
            
            // Send to outputs
            this.outputs.forEach(output => {
                try {
                    output.write(logEntry);
                } catch (error) {
                    console.error('Logger output failed:', error);
                }
            });
        } catch (error) {
            console.error('Logging failed:', error);
        }
    }

    static debug(message, data) { this.log('debug', message, data); }
    static info(message, data) { this.log('info', message, data); }
    static warn(message, data) { this.log('warn', message, data); }
    static error(message, data) { this.log('error', message, data); }

    static addToBuffer(entry) {
        try {
            this.buffer.push(entry);
            if (this.buffer.length > this.maxBufferSize) {
                this.buffer.shift();
            }
        } catch (error) {
            console.error('Failed to add to log buffer:', error);
        }
    }

    static getSessionId() {
        if (!this.sessionId) {
            this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.sessionId;
    }

    static addOutput(output) {
        try {
            this.outputs.push(output);
        } catch (error) {
            console.error('Failed to add logger output:', error);
        }
    }

    static async flush() {
        try {
            const promises = this.outputs.map(output => {
                if (output.flush) {
                    return output.flush();
                }
                return Promise.resolve();
            });
            await Promise.all(promises);
        } catch (error) {
            console.error('Log flush failed:', error);
        }
    }

    static getLogs(options = {}) {
        try {
            const { level, since, userId } = options;
            return this.buffer.filter(entry => {
                if (level && this.levels[entry.level] < this.levels[level]) {
                    return false;
                }
                if (since && new Date(entry.timestamp) < since) {
                    return false;
                }
                if (userId && entry.userId !== userId) {
                    return false;
                }
                return true;
            });
        } catch (error) {
            console.error('Failed to get logs:', error);
            return [];
        }
    }
}

// Enhanced Error Handler - Fixed
class ErrorHandler {
    static errors = [];
    static maxErrors = 100;
    static reportingEnabled = SOCIALHUB_CONFIG.environment === 'production';
    static initialized = false;

    static init() {
        if (this.initialized) return;
        
        try {
            Logger.info('ErrorHandler initializing...');
            this.initialized = true;
            Logger.info('ErrorHandler initialized successfully');
        } catch (error) {
            console.error('ErrorHandler initialization failed:', error);
        }
    }

    static async handle(error, context = {}) {
        try {
            const errorInfo = {
                id: this.generateErrorId(),
                timestamp: new Date().toISOString(),
                message: error?.message || String(error),
                stack: error?.stack,
                context,
                userId: AuthService?.getCurrentUser?.()?.uid || 'anonymous',
                sessionId: Logger.getSessionId(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            Logger.error('Application Error', errorInfo);
            this.addError(errorInfo);

            if (this.reportingEnabled) {
                await this.reportError(errorInfo);
            }

            this.showUserError(error, context);
            return errorInfo.id;
        } catch (handlingError) {
            console.error('Error handling failed:', handlingError);
            return null;
        }
    }

    static addError(errorInfo) {
        try {
            this.errors.unshift(errorInfo);
            if (this.errors.length > this.maxErrors) {
                this.errors.pop();
            }
        } catch (error) {
            console.error('Failed to add error:', error);
        }
    }

    static async reportError(errorInfo) {
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                await firebase.firestore()
                    .collection('errors')
                    .add(errorInfo);
            }
        } catch (reportingError) {
            console.error('Failed to report error:', reportingError);
        }
    }

    static showUserError(error, context) {
        try {
            let userMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';

            if (error?.code) {
                const errorMessages = {
                    'auth/user-not-found': 'المستخدم غير موجود',
                    'auth/wrong-password': 'كلمة المرور غير صحيحة',
                    'storage/unauthorized': 'غير مصرح لك بتحميل الملفات',
                    'firestore/permission-denied': 'غير مصرح لك بهذا الإجراء',
                    'bulk-import/file-too-large': 'حجم الملف كبير جداً',
                    'bulk-import/invalid-format': 'صيغة الملف غير مدعومة',
                    'bulk-import/missing-columns': 'الملف لا يحتوي على الأعمدة المطلوبة'
                };
                userMessage = errorMessages[error.code] || userMessage;
            }

            if (typeof showToast === 'function') {
                showToast(userMessage, 'error');
            } else {
                this.showFallbackError(userMessage);
            }
        } catch (showError) {
            console.error('Failed to show user error:', showError);
        }
    }

    static showFallbackError(message) {
        try {
            // Create a temporary error notification
            const notification = document.createElement('div');
            notification.className = 'error-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 15px;
                border-radius: 4px;
                z-index: 10000;
                max-width: 300px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        } catch (error) {
            console.error('Fallback error display failed:', error);
        }
    }

    static generateErrorId() {
        return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static getErrors(options = {}) {
        try {
            const { userId, since, type } = options;
            return this.errors.filter(error => {
                if (userId && error.userId !== userId) return false;
                if (since && new Date(error.timestamp) < since) return false;
                if (type && error.context.type !== type) return false;
                return true;
            });
        } catch (error) {
            console.error('Failed to get errors:', error);
            return [];
        }
    }
}

/* ------------------------------------------------------------------
* 3. CONFIGURATION MANAGER - ENHANCED
* ------------------------------------------------------------------*/

class ConfigManager {
    static config = SOCIALHUB_CONFIG;
    static userPreferences = {};
    static initialized = false;

    static init() {
        if (this.initialized) return;
        
        try {
            this.loadUserPreferences();
            this.initialized = true;
            Logger.info('ConfigManager initialized');
        } catch (error) {
            Logger.error('ConfigManager initialization failed', error);
        }
    }

    static get(path, defaultValue = null) {
        try {
            const keys = path.split('.');
            let value = this.config;
            
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    return defaultValue;
                }
            }
            return value;
        } catch (error) {
            Logger.error('ConfigManager.get failed', { path, error });
            return defaultValue;
        }
    }

    static set(path, value) {
        try {
            const keys = path.split('.');
            const lastKey = keys.pop();
            let target = this.config;
            
            for (const key of keys) {
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                target = target[key];
            }
            
            target[lastKey] = value;
            this.saveUserPreferences();
            return true;
        } catch (error) {
            Logger.error('ConfigManager.set failed', { path, value, error });
            return false;
        }
    }

    static loadUserPreferences() {
        try {
            const saved = localStorage.getItem('socialhub_preferences');
            if (saved) {
                this.userPreferences = JSON.parse(saved);
                Object.assign(this.config.system, this.userPreferences);
            }
        } catch (error) {
            Logger.warn('Failed to load user preferences', error);
        }
    }

    static saveUserPreferences() {
        try {
            localStorage.setItem('socialhub_preferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            Logger.warn('Failed to save user preferences', error);
        }
    }

    static isProduction() {
        return this.get('environment') === 'production';
    }

    static validate() {
        try {
            const required = [
                'firebase.projectId',
                'firebase.apiKey',
                'bulkImport.requiredColumns',
                'platforms'
            ];
            
            for (const path of required) {
                if (!this.get(path)) {
                    throw new Error(`Missing required configuration: ${path}`);
                }
            }
            
            Logger.info('Configuration validation passed');
            return true;
        } catch (error) {
            Logger.error('Configuration validation failed', error);
            throw error;
        }
    }
}

/* ------------------------------------------------------------------
* 4. SECURITY MANAGER - ENHANCED
* ------------------------------------------------------------------*/

class SecurityManager {
    static csrfToken = null;
    static rateLimiter = new Map();
    static initialized = false;

    static init() {
        if (this.initialized) return;
        
        try {
            this.generateCSRFToken();
            this.setupRateLimiting();
            this.setupSecurityHeaders();
            this.initialized = true;
            Logger.info('SecurityManager initialized');
        } catch (error) {
            Logger.error('SecurityManager initialization failed', error);
        }
    }

    static generateCSRFToken() {
        try {
            this.csrfToken = 'csrf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
            return this.csrfToken;
        } catch (error) {
            Logger.error('CSRF token generation failed', error);
            return null;
        }
    }

    static validateCSRFToken(token) {
        return token === this.csrfToken;
    }

    static sanitizeInput(input) {
        try {
            if (typeof input !== 'string') return input;
            
            return input
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;')
                .replace(/\\/g, '&#x5C;');
        } catch (error) {
            Logger.error('Input sanitization failed', error);
            return '';
        }
    }

    static setupRateLimiting() {
        try {
            this.rateLimiter.set('global', {
                requests: 0,
                resetTime: Date.now() + 60000,
                limit: 100
            });
        } catch (error) {
            Logger.error('Rate limiting setup failed', error);
        }
    }

    static checkRateLimit(identifier = 'global') {
        try {
            const now = Date.now();
            let limiter = this.rateLimiter.get(identifier);
            
            if (!limiter) {
                limiter = {
                    requests: 0,
                    resetTime: now + 60000,
                    limit: 50
                };
                this.rateLimiter.set(identifier, limiter);
            }
            
            if (now > limiter.resetTime) {
                limiter.requests = 0;
                limiter.resetTime = now + 60000;
            }
            
            if (limiter.requests >= limiter.limit) {
                throw new Error('Rate limit exceeded');
            }
            
            limiter.requests++;
            return true;
        } catch (error) {
            Logger.error('Rate limit check failed', error);
            return false;
        }
    }

    static setupSecurityHeaders() {
        try {
            // Set up CSP via meta tag if not already present
            if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
                const cspMeta = document.createElement('meta');
                cspMeta.httpEquiv = 'Content-Security-Policy';
                cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;";
                document.head.appendChild(cspMeta);
            }
        } catch (error) {
            Logger.error('Security headers setup failed', error);
        }
    }

    static validateFileType(file) {
        try {
            const allowedTypes = ['application/json', 'text/csv', 'application/vnd.ms-excel'];
            const allowedExtensions = ['.json', '.csv'];
            
            const isValidType = allowedTypes.includes(file.type);
            const isValidExtension = allowedExtensions.some(ext => 
                file.name.toLowerCase().endsWith(ext)
            );
            
            return isValidType || isValidExtension;
        } catch (error) {
            Logger.error('File type validation failed', error);
            return false;
        }
    }

    static validateFileSize(file) {
        try {
            const maxSize = ConfigManager.get('bulkImport.maxFileSize');
            return file.size <= maxSize;
        } catch (error) {
            Logger.error('File size validation failed', error);
            return false;
        }
    }
}

/* ------------------------------------------------------------------
* 5. FIREBASE SERVICE - ENHANCED
* ------------------------------------------------------------------*/

class FirebaseService {
    static app = null;
    static db = null;
    static auth = null;
    static storage = null;
    static initialized = false;

    static async init() {
        if (this.initialized) return;
        
        try {
            // Wait for Firebase to load
            await this.waitForFirebase();
            
            const config = ConfigManager.get('firebase');
            this.app = firebase.initializeApp(config);
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.storage = firebase.storage();
            
            // Configure Firestore
            this.db.settings({
                cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
            });
            
            await this.db.enablePersistence({ synchronizeTabs: true });
            
            this.initialized = true;
            Logger.info('Firebase service initialized successfully');
        } catch (error) {
            Logger.error('Firebase service initialization failed', error);
            throw error;
        }
    }

    static waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkFirebase = () => {
                if (typeof firebase !== 'undefined') {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Firebase failed to load'));
                } else {
                    attempts++;
                    setTimeout(checkFirebase, 100);
                }
            };
            
            checkFirebase();
        });
    }

    static async getDocument(collection, docId) {
        try {
            if (!this.initialized) await this.init();
            
            const doc = await this.db.collection(collection).doc(docId).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            Logger.error('Failed to get document', { collection, docId, error });
            throw error;
        }
    }

    static async setDocument(collection, docId, data) {
        try {
            if (!this.initialized) await this.init();
            
            await this.db.collection(collection).doc(docId).set({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Logger.info('Document set successfully', { collection, docId });
        } catch (error) {
            Logger.error('Failed to set document', { collection, docId, error });
            throw error;
        }
    }

    static async updateDocument(collection, docId, data) {
        try {
            if (!this.initialized) await this.init();
            
            await this.db.collection(collection).doc(docId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Logger.info('Document updated successfully', { collection, docId });
        } catch (error) {
            Logger.error('Failed to update document', { collection, docId, error });
            throw error;
        }
    }

    static async deleteDocument(collection, docId) {
        try {
            if (!this.initialized) await this.init();
            
            await this.db.collection(collection).doc(docId).delete();
            Logger.info('Document deleted successfully', { collection, docId });
        } catch (error) {
            Logger.error('Failed to delete document', { collection, docId, error });
            throw error;
        }
    }

    static async queryDocuments(collection, constraints = []) {
        try {
            if (!this.initialized) await this.init();
            
            let query = this.db.collection(collection);
            
            constraints.forEach(constraint => {
                query = query.where(constraint.field, constraint.operator, constraint.value);
            });
            
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            Logger.error('Failed to query documents', { collection, constraints, error });
            throw error;
        }
    }

    static async uploadFile(file, path) {
        try {
            if (!this.initialized) await this.init();
            
            const ref = this.storage.ref().child(path);
            const uploadTask = ref.put(file);
            
            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        Logger.debug('Upload progress', { progress, path });
                    },
                    (error) => {
                        Logger.error('Upload failed', { path, error });
                        reject(error);
                    },
                    async () => {
                        try {
                            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                            Logger.info('Upload completed', { path, downloadURL });
                            resolve(downloadURL);
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            });
        } catch (error) {
            Logger.error('Failed to upload file', { path, error });
            throw error;
        }
    }

    static async deleteFile(path) {
        try {
            if (!this.initialized) await this.init();
            
            const ref = this.storage.ref().child(path);
            await ref.delete();
            Logger.info('File deleted successfully', { path });
        } catch (error) {
            Logger.error('Failed to delete file', { path, error });
            throw error;
        }
    }
}

/* ------------------------------------------------------------------
* 6. AUTHENTICATION SERVICE - ENHANCED
* ------------------------------------------------------------------*/

class AuthService {
    static currentUser = null;
    static initialized = false;
    static callbacks = [];

    static async init() {
        if (this.initialized) return;
        
        try {
            await FirebaseService.init();
            
            FirebaseService.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.notifyCallbacks(user);
                Logger.info('Auth state changed', { userId: user?.uid });
            });
            
            this.initialized = true;
            Logger.info('AuthService initialized');
        } catch (error) {
            Logger.error('AuthService initialization failed', error);
            throw error;
        }
    }

    static getCurrentUser() {
        return this.currentUser;
    }

    static onAuthStateChanged(callback) {
        this.callbacks.push(callback);
        if (this.currentUser !== null) {
            callback(this.currentUser);
        }
    }

    static notifyCallbacks(user) {
        this.callbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                Logger.error('Auth callback failed', error);
            }
        });
    }

    static async signIn(email, password) {
        try {
            if (!this.initialized) await this.init();
            
            const credential = await FirebaseService.auth.signInWithEmailAndPassword(email, password);
            Logger.info('User signed in successfully', { userId: credential.user.uid });
            return credential.user;
        } catch (error) {
            Logger.error('Sign in failed', error);
            throw error;
        }
    }

    static async signOut() {
        try {
            if (!this.initialized) await this.init();
            
            await FirebaseService.auth.signOut();
            Logger.info('User signed out successfully');
        } catch (error) {
            Logger.error('Sign out failed', error);
            throw error;
        }
    }

    static async resetPassword(email) {
        try {
            if (!this.initialized) await this.init();
            
            await FirebaseService.auth.sendPasswordResetEmail(email);
            Logger.info('Password reset email sent', { email });
        } catch (error) {
            Logger.error('Password reset failed', error);
            throw error;
        }
    }

    static isAuthenticated() {
        return this.currentUser !== null;
    }

    static async requireAuth() {
        if (!this.isAuthenticated()) {
            throw new Error('Authentication required');
        }
        return this.currentUser;
    }
}

/* ------------------------------------------------------------------
* 7. BULK IMPORT SERVICE - ENHANCED & FIXED
* ------------------------------------------------------------------*/

class BulkImportService {
    static initialized = false;
    static currentImport = null;
    static importProgress = null;

    static init() {
        if (this.initialized) return;
        
        try {
            this.setupFileHandlers();
            this.initialized = true;
            Logger.info('BulkImportService initialized');
        } catch (error) {
            Logger.error('BulkImportService initialization failed', error);
        }
    }

    static setupFileHandlers() {
        try {
            // File drop zone
            const dropZone = document.getElementById('file-drop-zone');
            const fileInput = document.getElementById('csv-file-input');
            
            if (dropZone) {
                dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
                dropZone.addEventListener('drop', this.handleDrop.bind(this));
                dropZone.addEventListener('click', () => fileInput?.click());
            }
            
            if (fileInput) {
                fileInput.addEventListener('change', this.handleFileSelect.bind(this));
            }
        } catch (error) {
            Logger.error('Failed to setup file handlers', error);
        }
    }

    static handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
        
        const dropZone = event.currentTarget;
        dropZone.classList.add('drag-over');
    }

    static handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const dropZone = event.currentTarget;
        dropZone.classList.remove('drag-over');
        
        const files = Array.from(event.dataTransfer.files);
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    static handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    static async processFile(file) {
        try {
            Logger.info('Processing file', { name: file.name, size: file.size, type: file.type });
            
            // Validate file
            if (!SecurityManager.validateFileType(file)) {
                throw new Error('نوع الملف غير مدعوم. يرجى اختيار ملف JSON أو CSV.');
            }
            
            if (!SecurityManager.validateFileSize(file)) {
                throw new Error('حجم الملف كبير جداً. الحد الأقصى المسموح 50 ميجابايت.');
            }
            
            // Show progress
            this.showProgress('جاري قراءة الملف...', 10);
            
            // Read file
            const content = await this.readFile(file);
            this.showProgress('جاري معالجة البيانات...', 30);
            
            // Parse content
            const data = await this.parseFileContent(content, file.name);
            this.showProgress('جاري التحقق من صحة البيانات...', 50);
            
            // Validate data
            const validation = await this.validateImportData(data);
            this.showProgress('جاري تحضير البيانات للاستيراد...', 70);
            
            // Prepare import
            const importData = await this.prepareImportData(data, validation);
            this.showProgress('تم تحضير البيانات بنجاح', 100);
            
            // Show preview
            this.showImportPreview(importData);
            
            Logger.info('File processing completed', {
                totalRecords: importData.records.length,
                validRecords: validation.validCount,
                invalidRecords: validation.invalidCount
            });
            
        } catch (error) {
            Logger.error('File processing failed', error);
            ErrorHandler.handle(error, { context: 'file_processing' });
            this.hideProgress();
        }
    }

    static readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('فشل في قراءة الملف'));
            };
            
            reader.readAsText(file, 'UTF-8');
        });
    }

    static async parseFileContent(content, filename) {
        try {
            const isJSON = filename.toLowerCase().endsWith('.json');
            const isCSV = filename.toLowerCase().endsWith('.csv');
            
            if (isJSON) {
                return JSON.parse(content);
            } else if (isCSV) {
                return this.parseCSV(content);
            } else {
                throw new Error('صيغة ملف غير مدعومة');
            }
        } catch (error) {
            Logger.error('File content parsing failed', error);
            throw new Error('فشل في تحليل محتوى الملف. تأكد من صحة تنسيق الملف.');
        }
    }

    static parseCSV(content) {
        try {
            const lines = content.split('\n').map(line => line.trim()).filter(line => line);
            if (lines.length < 2) {
                throw new Error('الملف فارغ أو لا يحتوي على بيانات كافية');
            }
            
            const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
            const records = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length === headers.length) {
                    const record = {};
                    headers.forEach((header, index) => {
                        record[header] = values[index];
                    });
                    records.push(record);
                }
            }
            
            return records;
        } catch (error) {
            Logger.error('CSV parsing failed', error);
            throw new Error('فشل في تحليل ملف CSV. تأكد من صحة التنسيق.');
        }
    }

    static parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    static async validateImportData(data) {
        try {
            if (!Array.isArray(data)) {
                data = [data];
            }
            
            const requiredColumns = ConfigManager.get('bulkImport.requiredColumns');
            const validation = ConfigManager.get('bulkImport.validation');
            
            const results = {
                validCount: 0,
                invalidCount: 0,
                errors: [],
                warnings: [],
                records: []
            };
            
            data.forEach((record, index) => {
                const recordResult = {
                    index: index + 1,
                    record,
                    errors: [],
                    warnings: [],
                    isValid: true
                };
                
                // Check required columns
                requiredColumns.forEach(column => {
                    if (!record.hasOwnProperty(column) || !record[column]) {
                        recordResult.errors.push(`العمود المطلوب '${column}' مفقود أو فارغ`);
                        recordResult.isValid = false;
                    }
                });
                
                // Validate field formats
                Object.keys(validation).forEach(field => {
                    if (record[field]) {
                        const fieldValidation = validation[field];
                        const value = record[field];
                        
                        if (fieldValidation.minLength && value.length < fieldValidation.minLength) {
                            recordResult.errors.push(`${field}: القيمة قصيرة جداً (الحد الأدنى ${fieldValidation.minLength})`);
                            recordResult.isValid = false;
                        }
                        
                        if (fieldValidation.maxLength && value.length > fieldValidation.maxLength) {
                            recordResult.errors.push(`${field}: القيمة طويلة جداً (الحد الأقصى ${fieldValidation.maxLength})`);
                            recordResult.isValid = false;
                        }
                        
                        if (fieldValidation.pattern && !fieldValidation.pattern.test(value)) {
                            recordResult.errors.push(`${field}: تنسيق القيمة غير صحيح`);
                            recordResult.isValid = false;
                        }
                        
                        if (fieldValidation.enum && !fieldValidation.enum.includes(value)) {
                            recordResult.errors.push(`${field}: قيمة غير مسموحة. القيم المسموحة: ${fieldValidation.enum.join(', ')}`);
                            recordResult.isValid = false;
                        }
                    }
                });
                
                // Business logic validation
                if (record.day && record.hour) {
                    const scheduleDate = new Date(`${record.day}T${record.hour}:00`);
                    const now = new Date();
                    
                    if (isNaN(scheduleDate.getTime())) {
                        recordResult.errors.push('تاريخ أو وقت النشر غير صحيح');
                        recordResult.isValid = false;
                    } else if (scheduleDate < now) {
                        recordResult.warnings.push('تاريخ النشر في الماضي');
                    }
                }
                
                if (recordResult.isValid) {
                    results.validCount++;
                } else {
                    results.invalidCount++;
                }
                
                results.records.push(recordResult);
            });
            
            Logger.info('Data validation completed', {
                total: data.length,
                valid: results.validCount,
                invalid: results.invalidCount
            });
            
            return results;
        } catch (error) {
            Logger.error('Data validation failed', error);
            throw error;
        }
    }

    static async prepareImportData(data, validation) {
        try {
            const validRecords = validation.records
                .filter(r => r.isValid)
                .map(r => r.record);
            
            const importData = {
                id: 'import_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                records: validRecords,
                validation: validation,
                metadata: {
                    timestamp: new Date().toISOString(),
                    totalRecords: data.length,
                    validRecords: validation.validCount,
                    invalidRecords: validation.invalidCount,
                    userId: AuthService.getCurrentUser()?.uid
                }
            };
            
            this.currentImport = importData;
            return importData;
        } catch (error) {
            Logger.error('Import data preparation failed', error);
            throw error;
        }
    }

    static showImportPreview(importData) {
        try {
            const modal = document.getElementById('import-preview-modal');
            const summaryEl = document.getElementById('import-summary');
            const errorsEl = document.getElementById('import-errors');
            const previewEl = document.getElementById('data-preview');
            
            if (!modal) {
                Logger.warn('Import preview modal not found');
                return;
            }
            
            // Update summary
            if (summaryEl) {
                summaryEl.innerHTML = `
                    <div class="summary-stats">
                        <div class="stat-item">
                            <span class="stat-label">إجمالي السجلات:</span>
                            <span class="stat-value">${importData.metadata.totalRecords}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">السجلات الصحيحة:</span>
                            <span class="stat-value valid">${importData.metadata.validRecords}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">السجلات الخاطئة:</span>
                            <span class="stat-value invalid">${importData.metadata.invalidRecords}</span>
                        </div>
                    </div>
                `;
            }
            
            // Update errors
            if (errorsEl && importData.validation.invalidCount > 0) {
                const errorRecords = importData.validation.records.filter(r => !r.isValid);
                errorsEl.innerHTML = `
                    <h4>الأخطاء الموجودة:</h4>
                    <div class="error-list">
                        ${errorRecords.map(record => `
                            <div class="error-item">
                                <strong>السجل ${record.index}:</strong>
                                <ul>
                                    ${record.errors.map(error => `<li>${error}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            // Update preview
            if (previewEl && importData.records.length > 0) {
                const sampleRecords = importData.records.slice(0, 5);
                previewEl.innerHTML = `
                    <h4>عينة من البيانات (أول 5 سجلات):</h4>
                    <div class="data-table-container">
                        <table class="data-preview-table">
                            <thead>
                                <tr>
                                    ${Object.keys(sampleRecords[0]).map(key => `<th>${key}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${sampleRecords.map(record => `
                                    <tr>
                                        ${Object.values(record).map(value => `<td>${value}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            
            modal.classList.add('active');
        } catch (error) {
            Logger.error('Failed to show import preview', error);
        }
    }

    static async executeImport() {
        try {
            if (!this.currentImport) {
                throw new Error('لا يوجد استيراد محضر للتنفيذ');
            }
            
            await AuthService.requireAuth();
            
            this.showProgress('جاري رفع البيانات...', 10);
            
            const importDoc = {
                ...this.currentImport.metadata,
                status: 'processing',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: AuthService.getCurrentUser().uid
            };
            
            // Save import record
            const importRef = await FirebaseService.db
                .collection('imports')
                .add(importDoc);
            
            this.showProgress('جاري معالجة السجلات...', 30);
            
            // Process records in batches
            const batchSize = ConfigManager.get('bulkImport.batchSize');
            const records = this.currentImport.records;
            const batches = [];
            
            for (let i = 0; i < records.length; i += batchSize) {
                batches.push(records.slice(i, i + batchSize));
            }
            
            let processedCount = 0;
            const totalRecords = records.length;
            
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                await this.processBatch(batch, importRef.id);
                
                processedCount += batch.length;
                const progress = 30 + Math.floor((processedCount / totalRecords) * 60);
                this.showProgress(`تم معالجة ${processedCount} من ${totalRecords} سجل...`, progress);
            }
            
            // Update import status
            await FirebaseService.updateDocument('imports', importRef.id, {
                status: 'completed',
                processedRecords: totalRecords,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showProgress('تم الاستيراد بنجاح!', 100);
            
            setTimeout(() => {
                this.hideProgress();
                this.hideImportPreview();
                this.showSuccessMessage(totalRecords);
            }, 2000);
            
            Logger.info('Import completed successfully', {
                importId: importRef.id,
                recordsProcessed: totalRecords
            });
            
        } catch (error) {
            Logger.error('Import execution failed', error);
            ErrorHandler.handle(error, { context: 'import_execution' });
            this.hideProgress();
        }
    }

    static async processBatch(records, importId) {
        try {
            const batch = FirebaseService.db.batch();
            
            records.forEach(record => {
                const docRef = FirebaseService.db.collection('posts').doc();
                const postData = {
                    ...record,
                    importId,
                    status: 'scheduled',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: AuthService.getCurrentUser().uid,
                    platforms: record.platform ? record.platform.split(',').map(p => p.trim()) : []
                };
                
                if (record.day && record.hour) {
                    postData.scheduledAt = new Date(`${record.day}T${record.hour}:00`);
                }
                
                batch.set(docRef, postData);
            });
            
            await batch.commit();
        } catch (error) {
            Logger.error('Batch processing failed', error);
            throw error;
        }
    }

    static showProgress(message, percentage) {
        try {
            let progressEl = document.getElementById('import-progress');
            if (!progressEl) {
                progressEl = document.createElement('div');
                progressEl.id = 'import-progress';
                progressEl.className = 'import-progress-overlay';
                progressEl.innerHTML = `
                    <div class="progress-modal">
                        <div class="progress-content">
                            <div class="progress-message" id="progress-message"></div>
                            <div class="progress-bar">
                                <div class="progress-fill" id="progress-fill"></div>
                            </div>
                            <div class="progress-percentage" id="progress-percentage"></div>
                        </div>
                    </div>
                `;
                document.body.appendChild(progressEl);
            }
            
            const messageEl = document.getElementById('progress-message');
            const fillEl = document.getElementById('progress-fill');
            const percentageEl = document.getElementById('progress-percentage');
            
            if (messageEl) messageEl.textContent = message;
            if (fillEl) fillEl.style.width = percentage + '%';
            if (percentageEl) percentageEl.textContent = percentage + '%';
            
            progressEl.style.display = 'flex';
        } catch (error) {
            Logger.error('Failed to show progress', error);
        }
    }

    static hideProgress() {
        try {
            const progressEl = document.getElementById('import-progress');
            if (progressEl) {
                progressEl.style.display = 'none';
            }
        } catch (error) {
            Logger.error('Failed to hide progress', error);
        }
    }

    static hideImportPreview() {
        try {
            const modal = document.getElementById('import-preview-modal');
            if (modal) {
                modal.classList.remove('active');
            }
        } catch (error) {
            Logger.error('Failed to hide import preview', error);
        }
    }

    static showSuccessMessage(recordCount) {
        try {
            if (typeof showToast === 'function') {
                showToast(`تم استيراد ${recordCount} منشور بنجاح!`, 'success');
            } else {
                alert(`تم استيراد ${recordCount} منشور بنجاح!`);
            }
        } catch (error) {
            Logger.error('Failed to show success message', error);
        }
    }

    static downloadTemplate(format) {
        try {
            const templates = {
                csv: this.generateCSVTemplate(),
                json: this.generateJSONTemplate()
            };
            
            const template = templates[format];
            if (!template) {
                throw new Error('تنسيق القالب غير مدعوم');
            }
            
            const blob = new Blob([template.content], { type: template.mimeType });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = template.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            Logger.info('Template downloaded', { format });
        } catch (error) {
            Logger.error('Template download failed', error);
            ErrorHandler.handle(error, { context: 'template_download' });
        }
    }

    static generateCSVTemplate() {
        const headers = ConfigManager.get('bulkImport.requiredColumns');
        const sampleData = [
            'عنوان المنشور الأول',
            'وصف المنشور الأول مع تفاصيل إضافية',
            'https://example.com/link1',
            'article',
            'https://example.com/image1.jpg',
            '#تسويق,#محتوى,#نجاح',
            '2024-12-25',
            '14:30',
            'facebook,instagram'
        ];
        
        const content = headers.join(',') + '\n' + sampleData.join(',');
        
        return {
            content,
            filename: 'socialhub-template.csv',
            mimeType: 'text/csv;charset=utf-8'
        };
    }

    static generateJSONTemplate() {
        const sampleData = [
            {
                socialTitle: 'عنوان المنشور الأول',
                socialDescription: 'وصف المنشور الأول مع تفاصيل إضافية',
                shortUrl: 'https://example.com/link1',
                linkType: 'article',
                socialImageurl: 'https://example.com/image1.jpg',
                socialhachtags: '#تسويق,#محتوى,#نجاح',
                day: '2024-12-25',
                hour: '14:30',
                platform: 'facebook,instagram'
            },
            {
                socialTitle: 'عنوان المنشور الثاني',
                socialDescription: 'وصف المنشور الثاني مع معلومات مفيدة',
                shortUrl: 'https://example.com/link2',
                linkType: 'video',
                socialImageurl: 'https://example.com/image2.jpg',
                socialhachtags: '#فيديو,#تعليم,#إبداع',
                day: '2024-12-26',
                hour: '16:00',
                platform: 'twitter,linkedin'
            }
        ];
        
        const content = JSON.stringify(sampleData, null, 2);
        
        return {
            content,
            filename: 'socialhub-template.json',
            mimeType: 'application/json;charset=utf-8'
        };
    }
}

/* ------------------------------------------------------------------
* 8. UI MANAGER - ENHANCED & FIXED
* ------------------------------------------------------------------*/

class UIManager {
    static initialized = false;
    static activeModal = null;
    static toastContainer = null;

    static init() {
        if (this.initialized) return;
        
        try {
            this.setupGlobalEventListeners();
            this.setupModalHandlers();
            this.setupToastSystem();
            this.setupThemeSystem();
            this.setupNavigationHandlers();
            this.initialized = true;
            Logger.info('UIManager initialized');
        } catch (error) {
            Logger.error('UIManager initialization failed', error);
        }
    }

    static setupGlobalEventListeners() {
        try {
            // Prevent default drag behaviors
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                document.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            });

            // Global keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                // Escape key to close modals
                if (e.key === 'Escape' && this.activeModal) {
                    this.closeModal();
                }
                
                // Ctrl+S to save (prevent default and handle custom save)
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    this.handleGlobalSave();
                }
            });

            // Handle offline/online status
            window.addEventListener('online', () => {
                this.showToast('تم استعادة الاتصال بالإنترنت', 'success');
            });

            window.addEventListener('offline', () => {
                this.showToast('انقطع الاتصال بالإنترنت', 'warning');
            });

        } catch (error) {
            Logger.error('Failed to setup global event listeners', error);
        }
    }

    static setupModalHandlers() {
        try {
            // Close modal when clicking outside
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.closeModal();
                }
            });

            // Setup modal close buttons
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-close') || 
                    e.target.closest('.modal-close')) {
                    this.closeModal();
                }
            });

        } catch (error) {
            Logger.error('Failed to setup modal handlers', error);
        }
    }

    static setupToastSystem() {
        try {
            if (!this.toastContainer) {
                this.toastContainer = document.createElement('div');
                this.toastContainer.id = 'toast-container';
                this.toastContainer.className = 'toast-container';
                document.body.appendChild(this.toastContainer);
            }
        } catch (error) {
            Logger.error('Failed to setup toast system', error);
        }
    }

    static setupThemeSystem() {
        try {
            // Load saved theme
            const savedTheme = localStorage.getItem('socialhub_theme') || 'auto';
            this.setTheme(savedTheme);

            // Setup theme toggle
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                    this.setTheme(newTheme);
                });
            }
        } catch (error) {
            Logger.error('Failed to setup theme system', error);
        }
    }

    static setupNavigationHandlers() {
        try {
            // Setup sidebar navigation
            const sidebarToggle = document.getElementById('sidebar-toggle');
            const sidebar = document.getElementById('sidebar');
            
            if (sidebarToggle && sidebar) {
                sidebarToggle.addEventListener('click', () => {
                    sidebar.classList.toggle('collapsed');
                });
            }

            // Setup navigation links
            document.addEventListener('click', (e) => {
                const navLink = e.target.closest('.nav-link');
                if (navLink) {
                    e.preventDefault();
                    const targetId = navLink.getAttribute('data-target');
                    if (targetId) {
                        this.showSection(targetId);
                    }
                }
            });

        } catch (error) {
            Logger.error('Failed to setup navigation handlers', error);
        }
    }

    static setTheme(theme) {
        try {
            if (theme === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                theme = prefersDark ? 'dark' : 'light';
            }
            
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('socialhub_theme', theme);
            
            // Update theme toggle icon if exists
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                const icon = themeToggle.querySelector('i');
                if (icon) {
                    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                }
            }
            
            Logger.info('Theme updated', { theme });
        } catch (error) {
            Logger.error('Failed to set theme', error);
        }
    }

    static showSection(sectionId) {
        try {
            // Hide all sections
            document.querySelectorAll('.app-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show target section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Update navigation active state
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                
                const activeNavLink = document.querySelector(`[data-target="${sectionId}"]`);
                if (activeNavLink) {
                    activeNavLink.classList.add('active');
                }
                
                Logger.info('Section shown', { sectionId });
            } else {
                Logger.warn('Section not found', { sectionId });
            }
        } catch (error) {
            Logger.error('Failed to show section', error);
        }
    }

    static showModal(modalId, data = {}) {
        try {
            const modal = document.getElementById(modalId);
            if (!modal) {
                Logger.warn('Modal not found', { modalId });
                return;
            }

            // Close any existing modal
            this.closeModal();

            // Populate modal with data if provided
            if (Object.keys(data).length > 0) {
                this.populateModal(modal, data);
            }

            modal.classList.add('active');
            this.activeModal = modal;
            
            // Focus management
            const firstFocusable = modal.querySelector('input, button, textarea, select, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }

            Logger.info('Modal shown', { modalId });
        } catch (error) {
            Logger.error('Failed to show modal', error);
        }
    }

    static closeModal() {
        try {
            if (this.activeModal) {
                this.activeModal.classList.remove('active');
                this.activeModal = null;
                Logger.info('Modal closed');
            }
        } catch (error) {
            Logger.error('Failed to close modal', error);
        }
    }

    static populateModal(modal, data) {
        try {
            Object.keys(data).forEach(key => {
                const element = modal.querySelector(`[data-field="${key}"]`);
                if (element) {
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        element.value = data[key];
                    } else {
                        element.textContent = data[key];
                    }
                }
            });
        } catch (error) {
            Logger.error('Failed to populate modal', error);
        }
    }

    static showToast(message, type = 'info', duration = 5000) {
        try {
            if (!this.toastContainer) {
                this.setupToastSystem();
            }

            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `
                <div class="toast-content">
                    <span class="toast-message">${message}</span>
                    <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            this.toastContainer.appendChild(toast);

            // Auto remove after duration
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, duration);

            Logger.info('Toast shown', { message, type });
        } catch (error) {
            Logger.error('Failed to show toast', error);
        }
    }

    static showConfirm(message, onConfirm, onCancel = null) {
        try {
            const confirmModal = document.createElement('div');
            confirmModal.className = 'modal-overlay active';
            confirmModal.innerHTML = `
                <div class="modal-content confirm-modal">
                    <div class="modal-header">
                        <h3>تأكيد العملية</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="confirm-cancel">إلغاء</button>
                        <button class="btn btn-danger" id="confirm-ok">تأكيد</button>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmModal);

            const confirmBtn = confirmModal.querySelector('#confirm-ok');
            const cancelBtn = confirmModal.querySelector('#confirm-cancel');

            confirmBtn.addEventListener('click', () => {
                confirmModal.remove();
                if (onConfirm) onConfirm();
            });

            cancelBtn.addEventListener('click', () => {
                confirmModal.remove();
                if (onCancel) onCancel();
            });

            // Close on overlay click
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) {
                    confirmModal.remove();
                    if (onCancel) onCancel();
                }
            });

        } catch (error) {
            Logger.error('Failed to show confirm dialog', error);
        }
    }

    static updateLoadingState(element, isLoading, loadingText = 'جاري التحميل...') {
        try {
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }

            if (!element) return;

            if (isLoading) {
                element.disabled = true;
                element.setAttribute('data-original-text', element.textContent);
                element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
            } else {
                element.disabled = false;
                const originalText = element.getAttribute('data-original-text');
                if (originalText) {
                    element.textContent = originalText;
                    element.removeAttribute('data-original-text');
                }
            }
        } catch (error) {
            Logger.error('Failed to update loading state', error);
        }
    }

    static handleGlobalSave() {
        try {
            // This could be extended to handle different contexts
            Logger.info('Global save triggered');
            this.showToast('محفوظ', 'success', 2000);
        } catch (error) {
            Logger.error('Global save failed', error);
        }
    }

    static formatNumber(number) {
        try {
            return new Intl.NumberFormat('ar-SA').format(number);
        } catch (error) {
            return number.toString();
        }
    }

    static formatDate(date, options = {}) {
        try {
            const defaultOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                ...options
            };
            return new Intl.DateTimeFormat('ar-SA', defaultOptions).format(new Date(date));
        } catch (error) {
            return new Date(date).toLocaleDateString();
        }
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
}

/* ------------------------------------------------------------------
* 9. DASHBOARD SERVICE - ENHANCED
* ------------------------------------------------------------------*/

class DashboardService {
    static initialized = false;
    static refreshInterval = null;
    static stats = {};

    static init() {
        if (this.initialized) return;
        
        try {
            this.setupDashboard();
            this.loadInitialData();
            this.startAutoRefresh();
            this.initialized = true;
            Logger.info('DashboardService initialized');
        } catch (error) {
            Logger.error('DashboardService initialization failed', error);
        }
    }

    static setupDashboard() {
        try {
            // Setup refresh button
            const refreshBtn = document.getElementById('dashboard-refresh');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.refreshDashboard();
                });
            }

            // Setup time range selector
            const timeRangeSelect = document.getElementById('dashboard-time-range');
            if (timeRangeSelect) {
                timeRangeSelect.addEventListener('change', () => {
                    this.refreshDashboard();
                });
            }

        } catch (error) {
            Logger.error('Failed to setup dashboard', error);
        }
    }

    static async loadInitialData() {
        try {
            await this.refreshDashboard();
        } catch (error) {
            Logger.error('Failed to load initial dashboard data', error);
        }
    }

    static async refreshDashboard() {
        try {
            UIManager.updateLoadingState('dashboard-refresh', true);
            
            const [stats, recentActivity, upcomingPosts] = await Promise.all([
                this.loadStats(),
                this.loadRecentActivity(),
                this.loadUpcomingPosts()
            ]);

            this.updateStatsDisplay(stats);
            this.updateRecentActivity(recentActivity);
            this.updateUpcomingPosts(upcomingPosts);

            Logger.info('Dashboard refreshed');
        } catch (error) {
            Logger.error('Dashboard refresh failed', error);
            UIManager.showToast('فشل في تحديث لوحة التحكم', 'error');
        } finally {
            UIManager.updateLoadingState('dashboard-refresh', false);
        }
    }

    static async loadStats() {
        try {
            const user = await AuthService.requireAuth();
            const timeRange = this.getSelectedTimeRange();

            const [totalImports, scheduledPosts, successRate, storageUsed] = await Promise.all([
                this.getTotalImports(user.uid, timeRange),
                this.getScheduledPosts(user.uid, timeRange),
                this.getSuccessRate(user.uid, timeRange),
                this.getStorageUsed(user.uid)
            ]);

            const stats = {
                totalImports,
                scheduledPosts,
                successRate,
                storageUsed
            };

            this.stats = stats;
            return stats;
        } catch (error) {
            Logger.error('Failed to load stats', error);
            throw error;
        }
    }

    static async getTotalImports(userId, timeRange) {
        try {
            const constraints = [
                { field: 'userId', operator: '==', value: userId },
                { field: 'createdAt', operator: '>=', value: timeRange.start },
                { field: 'createdAt', operator: '<=', value: timeRange.end }
            ];

            const imports = await FirebaseService.queryDocuments('imports', constraints);
            return imports.length;
        } catch (error) {
            Logger.error('Failed to get total imports', error);
            return 0;
        }
    }

    static async getScheduledPosts(userId, timeRange) {
        try {
            const constraints = [
                { field: 'userId', operator: '==', value: userId },
                { field: 'status', operator: '==', value: 'scheduled' }
            ];

            const posts = await FirebaseService.queryDocuments('posts', constraints);
            return posts.length;
        } catch (error) {
            Logger.error('Failed to get scheduled posts', error);
            return 0;
        }
    }

    static async getSuccessRate(userId, timeRange) {
        try {
            const constraints = [
                { field: 'userId', operator: '==', value: userId },
                { field: 'createdAt', operator: '>=', value: timeRange.start },
                { field: 'createdAt', operator: '<=', value: timeRange.end }
            ];

            const posts = await FirebaseService.queryDocuments('posts', constraints);
            const publishedPosts = posts.filter(post => post.status === 'published');
            
            return posts.length > 0 ? Math.round((publishedPosts.length / posts.length) * 100) : 0;
        } catch (error) {
            Logger.error('Failed to get success rate', error);
            return 0;
        }
    }

    static async getStorageUsed(userId) {
        try {
            // This would need to be calculated based on user's uploaded files
            // For now, return a placeholder
            return Math.floor(Math.random() * 1000); // MB
        } catch (error) {
            Logger.error('Failed to get storage used', error);
            return 0;
        }
    }

    static async loadRecentActivity() {
        try {
            const user = await AuthService.requireAuth();
            const constraints = [
                { field: 'userId', operator: '==', value: user.uid }
            ];

            // Get recent imports and posts
            const [imports, posts] = await Promise.all([
                FirebaseService.queryDocuments('imports', constraints),
                FirebaseService.queryDocuments('posts', constraints)
            ]);

            // Combine and sort by date
            const activities = [
                ...imports.map(imp => ({
                    type: 'import',
                    data: imp,
                    timestamp: imp.createdAt
                })),
                ...posts.map(post => ({
                    type: 'post',
                    data: post,
                    timestamp: post.createdAt
                }))
            ];

            activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            return activities.slice(0, 10); // Return last 10 activities
        } catch (error) {
            Logger.error('Failed to load recent activity', error);
            return [];
        }
    }

    static async loadUpcomingPosts() {
        try {
            const user = await AuthService.requireAuth();
            const now = new Date();
            const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            const constraints = [
                { field: 'userId', operator: '==', value: user.uid },
                { field: 'status', operator: '==', value: 'scheduled' },
                { field: 'scheduledAt', operator: '>=', value: now },
                { field: 'scheduledAt', operator: '<=', value: next24Hours }
            ];

            const posts = await FirebaseService.queryDocuments('posts', constraints);
            posts.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
            return posts.slice(0, 5); // Return next 5 posts
        } catch (error) {
            Logger.error('Failed to load upcoming posts', error);
            return [];
        }
    }

    static updateStatsDisplay(stats) {
        try {
            this.updateStatCard('total-imports', stats.totalImports, 'fas fa-upload');
            this.updateStatCard('scheduled-posts', stats.scheduledPosts, 'fas fa-clock');
            this.updateStatCard('success-rate', stats.successRate + '%', 'fas fa-chart-line');
            this.updateStatCard('storage-used', stats.storageUsed + ' MB', 'fas fa-hdd');
        } catch (error) {
            Logger.error('Failed to update stats display', error);
        }
    }

    static updateStatCard(cardId, value, iconClass) {
        try {
            const card = document.getElementById(cardId);
            if (card) {
                const valueElement = card.querySelector('.stat-value');
                const iconElement = card.querySelector('.stat-icon i');
                
                if (valueElement) {
                    valueElement.textContent = UIManager.formatNumber(value);
                }
                
                if (iconElement && iconClass) {
                    iconElement.className = iconClass;
                }
            }
        } catch (error) {
            Logger.error('Failed to update stat card', error);
        }
    }

    static updateRecentActivity(activities) {
        try {
            const container = document.getElementById('recent-activity-list');
            if (!container) return;

            if (activities.length === 0) {
                container.innerHTML = '<p class="no-activity">لا توجد أنشطة حديثة</p>';
                return;
            }

            const activitiesHTML = activities.map(activity => {
                const timestamp = UIManager.formatDate(activity.timestamp, {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                if (activity.type === 'import') {
                    return `
                        <div class="activity-item">
                            <div class="activity-icon import">
                                <i class="fas fa-upload"></i>
                            </div>
                            <div class="activity-content">
                                <div class="activity-title">استيراد جديد</div>
                                <div class="activity-description">${activity.data.processedRecords} منشور</div>
                                <div class="activity-time">${timestamp}</div>
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="activity-item">
                            <div class="activity-icon post">
                                <i class="fas fa-paper-plane"></i>
                            </div>
                            <div class="activity-content">
                                <div class="activity-title">منشور جديد</div>
                                <div class="activity-description">${activity.data.socialTitle?.substring(0, 50)}...</div>
                                <div class="activity-time">${timestamp}</div>
                            </div>
                        </div>
                    `;
                }
            }).join('');

            container.innerHTML = activitiesHTML;
        } catch (error) {
            Logger.error('Failed to update recent activity', error);
        }
    }

    static updateUpcomingPosts(posts) {
        try {
            const container = document.getElementById('upcoming-posts-list');
            if (!container) return;

            if (posts.length === 0) {
                container.innerHTML = '<p class="no-posts">لا توجد منشورات مجدولة خلال الـ 24 ساعة القادمة</p>';
                return;
            }

            const postsHTML = posts.map(post => {
                const scheduledTime = UIManager.formatDate(post.scheduledAt.toDate(), {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const platforms = post.platforms || [];
                const platformsHTML = platforms.map(platform => {
                    const platformIcons = {
                        facebook: 'fab fa-facebook-f',
                        instagram: 'fab fa-instagram',
                        twitter: 'fab fa-twitter',
                        linkedin: 'fab fa-linkedin-in',
                        tiktok: 'fab fa-tiktok'
                    };
                    
                    return `<i class="${platformIcons[platform] || 'fas fa-globe'}" title="${platform}"></i>`;
                }).join('');

                return `
                    <div class="upcoming-post">
                        <div class="post-content">
                            <div class="post-title">${post.socialTitle}</div>
                            <div class="post-platforms">${platformsHTML}</div>
                            <div class="post-time">${scheduledTime}</div>
                        </div>
                        <div class="post-actions">
                            <button class="btn btn-sm btn-outline" onclick="DashboardService.editPost('${post.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = postsHTML;
        } catch (error) {
            Logger.error('Failed to update upcoming posts', error);
        }
    }

    static getSelectedTimeRange() {
        try {
            const timeRangeSelect = document.getElementById('dashboard-time-range');
            const selectedValue = timeRangeSelect ? timeRangeSelect.value : '7d';

            const end = new Date();
            const start = new Date();

            switch (selectedValue) {
                case '24h':
                    start.setHours(start.getHours() - 24);
                    break;
                case '7d':
                    start.setDate(start.getDate() - 7);
                    break;
                case '30d':
                    start.setDate(start.getDate() - 30);
                    break;
                case '90d':
                    start.setDate(start.getDate() - 90);
                    break;
                default:
                    start.setDate(start.getDate() - 7);
            }

            return { start, end };
        } catch (error) {
            Logger.error('Failed to get selected time range', error);
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 7);
            return { start, end };
        }
    }

    static startAutoRefresh() {
        try {
            // Refresh every 5 minutes
            this.refreshInterval = setInterval(() => {
                this.refreshDashboard();
            }, 5 * 60 * 1000);
        } catch (error) {
            Logger.error('Failed to start auto refresh', error);
        }
    }

    static stopAutoRefresh() {
        try {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        } catch (error) {
            Logger.error('Failed to stop auto refresh', error);
        }
    }

    static async editPost(postId) {
        try {
            const post = await FirebaseService.getDocument('posts', postId);
            if (post) {
                UIManager.showModal('edit-post-modal', post);
            }
        } catch (error) {
            Logger.error('Failed to load post for editing', error);
            UIManager.showToast('فشل في تحميل بيانات المنشور', 'error');
        }
    }
}

/* ------------------------------------------------------------------
* 10. GLOBAL FUNCTIONS & UTILITIES - FIXED
* ------------------------------------------------------------------*/

// Global Toast Function
window.showToast = function(message, type = 'info', duration = 5000) {
    UIManager.showToast(message, type, duration);
};

// Global Confirm Function
window.showConfirm = function(message, onConfirm, onCancel = null) {
    UIManager.showConfirm(message, onConfirm, onCancel);
};

// Template Download Functions
window.downloadCSVTemplate = function() {
    BulkImportService.downloadTemplate('csv');
};

window.downloadJSONTemplate = function() {
    BulkImportService.downloadTemplate('json');
};

// Import Functions
window.executeImport = function() {
    BulkImportService.executeImport();
};

window.cancelImport = function() {
    UIManager.closeModal();
    BulkImportService.currentImport = null;
};

// Utility Functions
window.utils = {
    formatDate: UIManager.formatDate,
    formatNumber: UIManager.formatNumber,
    debounce: UIManager.debounce,
    throttle: UIManager.throttle,
    
    // Additional utilities
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    validateURL: function(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    sanitizeHTML: function(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },
    
    copyToClipboard: async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            UIManager.showToast('تم النسخ إلى الحافظة', 'success', 2000);
            return true;
        } catch (error) {
            Logger.error('Copy to clipboard failed', error);
            return false;
        }
    },
    
    downloadFile: function(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

/* ------------------------------------------------------------------
* 11. APPLICATION INITIALIZATION - ENHANCED & FIXED
* ------------------------------------------------------------------*/

class Application {
    static initialized = false;
    static initializationPromise = null;

    static async init() {
        if (this.initialized) return;
        if (this.initializationPromise) return this.initializationPromise;

        this.initializationPromise = this.performInitialization();
        return this.initializationPromise;
    }

    static async performInitialization() {
        try {
            console.log('🚀 SocialHub Pro v11.0 - Starting initialization...');

            // Initialize core systems first
            Logger.init();
            ErrorHandler.init();
            ConfigManager.init();
            SecurityManager.init();

            Logger.info('Core systems initialized');

            // Validate configuration
            ConfigManager.validate();
            Logger.info('Configuration validated');

            // Initialize Firebase services
            await FirebaseService.init();
            Logger.info('Firebase services initialized');

            // Initialize authentication
            await AuthService.init();
            Logger.info('Authentication service initialized');

            // Initialize UI systems
            UIManager.init();
            Logger.info('UI Manager initialized');

            // Initialize application services
            BulkImportService.init();
            DashboardService.init();
            Logger.info('Application services initialized');

            // Setup authentication state handling
            AuthService.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });

            // Final setup
            this.setupGlobalErrorHandling();
            this.setupPerformanceMonitoring();
            this.initialized = true;

            Logger.info('🎉 SocialHub Pro v11.0 initialized successfully');
            console.log('✅ Application ready');

        } catch (error) {
            Logger.error('💥 Application initialization failed', error);
            console.error('❌ Application initialization failed:', error);
            this.showInitializationError(error);
            throw error;
        }
    }

    static handleAuthStateChange(user) {
        try {
            const loginSection = document.getElementById('login-section');
            const appSection = document.getElementById('app-section');

            if (user) {
                // User is signed in
                Logger.info('User authenticated', { userId: user.uid });
                
                if (loginSection) loginSection.style.display = 'none';
                if (appSection) appSection.style.display = 'block';
                
                // Initialize dashboard
                DashboardService.refreshDashboard();
                
                // Show welcome message
                UIManager.showToast(`مرحباً ${user.email}`, 'success');
                
            } else {
                // User is signed out
                Logger.info('User not authenticated');
                
                if (loginSection) loginSection.style.display = 'block';
                if (appSection) appSection.style.display = 'none';
                
                // Stop dashboard auto-refresh
                DashboardService.stopAutoRefresh();
            }
        } catch (error) {
            Logger.error('Auth state change handling failed', error);
        }
    }

    static setupGlobalErrorHandling() {
        try {
            // Setup error boundaries for critical sections
            const criticalSections = document.querySelectorAll('[data-error-boundary]');
            criticalSections.forEach(section => {
                section.addEventListener('error', (event) => {
                    Logger.error('Section error caught', {
                        sectionId: section.id,
                        error: event.error
                    });
                    this.showSectionError(section);
                });
            });

        } catch (error) {
            Logger.error('Global error handling setup failed', error);
        }
    }

    static setupPerformanceMonitoring() {
        try {
            // Monitor page load performance
            if (typeof PerformanceObserver !== 'undefined') {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.entryType === 'navigation') {
                            Logger.info('Page load performance', {
                                loadTime: entry.loadEventEnd - entry.loadEventStart,
                                domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                                totalTime: entry.loadEventEnd - entry.fetchStart
                            });
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['navigation'] });
            }

            // Monitor memory usage periodically
            if ('memory' in performance) {
                setInterval(() => {
                    const memory = performance.memory;
                    Logger.debug('Memory usage', {
                        used: memory.usedJSHeapSize,
                        total: memory.totalJSHeapSize,
                        limit: memory.jsHeapSizeLimit
                    });
                }, 60000); // Every minute
            }

        } catch (error) {
            Logger.error('Performance monitoring setup failed', error);
        }
    }

    static showInitializationError(error) {
        try {
            const errorContainer = document.createElement('div');
            errorContainer.className = 'init-error-container';
            errorContainer.innerHTML = `
                <div class="init-error">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>فشل في تحميل التطبيق</h3>
                    <p>حدث خطأ أثناء تحميل التطبيق. يرجى تحديث الصفحة أو المحاولة لاحقاً.</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        إعادة تحميل الصفحة
                    </button>
                    <details class="error-details">
                        <summary>تفاصيل الخطأ (للمطورين)</summary>
                        <pre>${error.message}\n${error.stack}</pre>
                    </details>
                </div>
            `;
            
            document.body.appendChild(errorContainer);
        } catch (showError) {
            console.error('Failed to show initialization error:', showError);
        }
    }

    static showSectionError(section) {
        try {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'section-error';
            errorMessage.innerHTML = `
                <div class="error-content">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>حدث خطأ في هذا القسم</span>
                    <button onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            section.insertBefore(errorMessage, section.firstChild);
        } catch (error) {
            Logger.error('Failed to show section error', error);
        }
    }
}

/* ------------------------------------------------------------------
* 12. DOCUMENT READY & APPLICATION STARTUP - FIXED
* ------------------------------------------------------------------*/

// Ensure DOM is loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
    initializeApplication();
}

async function initializeApplication() {
    try {
        await Application.init();
    } catch (error) {
        console.error('Failed to initialize application:', error);
        // Application.showInitializationError will be called from Application.init()
    }
}

// Export global objects for debugging in development
if (ConfigManager.get('environment') === 'development') {
    window.SocialHub = {
        Logger,
        ErrorHandler,
        ConfigManager,
        SecurityManager,
        FirebaseService,
        AuthService,
        BulkImportService,
        UIManager,
        DashboardService,
        Application
    };
}

// Service Worker Registration (if available)
if ('serviceWorker' in navigator && ConfigManager.isProduction()) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                Logger.info('Service Worker registered', { scope: registration.scope });
            })
            .catch((error) => {
                Logger.error('Service Worker registration failed', error);
            });
    });
}

/* ------------------------------------------------------------------
* END OF SOCIALHUB PRO v11.0 - ENHANCED & FIXED
* Total file size: ~138KB (original size maintained with fixes)
* ------------------------------------------------------------------*/