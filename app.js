/*=================================================================
 * SOCIALHUB PRO v11.0 - BULK IMPORT FOCUSED SYSTEM
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
 * 
 * Removed Features:
 * - Single Post Creation (Composer)
 * - Individual Post Publishing
 * - Manual Post Scheduling UI
 *================================================================*/

/* ------------------------------------------------------------------ 
 * 1. CORE CONFIGURATION & CONSTANTS
 * ------------------------------------------------------------------*/

// Production Environment Configuration
const SOCIALHUB_CONFIG = {
    version: '11.0.0',
    environment: 'production',
    
    // Firebase Configuration
    firebase: {
        apiKey: "AIzaSyBKD3QIxJdHw__UG2TEqf0TqyYCnw8wJf8",
        authDomain: "socialhub-1370d.firebaseapp.com",
        databaseURL: "https://socialhub-1370d-default-rtdb.firebaseio.com",
        projectId: "socialhub-1370d",
        storageBucket: "socialhub-1370d.firebasestorage.app",
        messagingSenderId: "84815590328",
        appId: "1:84815590328:web:2f12340380b37c2562d54d"
    },
    
    // Bulk Import Specifications
    bulkImport: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        supportedFormats: ['json', 'csv'],
        maxPostsPerImport: 10000,
        batchSize: 100, // Process 100 posts at a time
        
        // Required Columns
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
        
        // Column Validation Rules
        validation: {
            socialTitle: { minLength: 1, maxLength: 280 },
            socialDescription: { minLength: 1, maxLength: 2000 },
            shortUrl: { pattern: /^https:\/\//, required: true },
            linkType: { 
                enum: ['article', 'video', 'image', 'link', 'event'],
                required: true 
            },
            socialImageurl: { pattern: /^https:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i },
            socialhachtags: { pattern: /^#\w+(,#\w+)*$/ },
            day: { pattern: /^\d{4}-\d{2}-\d{2}$/, required: true },
            hour: { pattern: /^([01]\d|2[0-3]):[0-5]\d$/, required: true },
            platform: { 
                pattern: /^(facebook|instagram|twitter|linkedin|tiktok)(,(facebook|instagram|twitter|linkedin|tiktok))*$/,
                required: true 
            }
        }
    },
    
    // Platform API Configuration
    platforms: {
        facebook: {
            apiVersion: 'v19.0',
            baseUrl: 'https://graph.facebook.com',
            rateLimit: 200, // requests per hour
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
            rateLimit: 300, // requests per 15 minutes
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
    
    // System Settings
    system: {
        timezone: 'Asia/Dubai',
        language: 'ar-AE',
        retryAttempts: 3,
        retryDelay: 1000,
        cleanupDelay: 24 * 60 * 60 * 1000, // 24 hours
        sessionTimeout: 30 * 60 * 1000 // 30 minutes
    }
};

/* ------------------------------------------------------------------ 
 * 2. CORE SYSTEMS
 * ------------------------------------------------------------------*/

// Configuration Manager
class ConfigManager {
    static config = SOCIALHUB_CONFIG;
    static userPreferences = {};
    
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
            return true;
        } catch (error) {
            Logger.error('ConfigManager.set failed', { path, value, error });
            return false;
        }
    }
    
    static isProduction() {
        return this.get('environment') === 'production';
    }
    
    static validate() {
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
    }
}

// Advanced Logger System
class Logger {
    static logLevel = ConfigManager.isProduction() ? 'info' : 'debug';
    static outputs = [];
    static buffer = [];
    static maxBufferSize = 1000;
    
    static levels = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    };
    
    static log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data: this.sanitizeLogData(data),
            sessionId: this.getSessionId(),
            userId: AuthService.getCurrentUser()?.uid || 'anonymous'
        };
        
        // Check log level
        if (this.levels[level] < this.levels[this.logLevel]) {
            return;
        }
        
        // Console output (always in development)
        if (!ConfigManager.isProduction() || level === 'error') {
            const consoleMethod = level === 'error' ? 'error' : 
                                  level === 'warn' ? 'warn' : 'log';
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
    }
    
    static sanitizeLogData(data) {
        // Convert any non-serializable data to string representation
        if (typeof data !== 'object' || data === null) {
            return data;
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (value instanceof Error) {
                sanitized[key] = {
                    message: value.message,
                    stack: value.stack,
                    name: value.name
                };
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeLogData(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }
    
    static debug(message, data) { this.log('debug', message, data); }
    static info(message, data) { this.log('info', message, data); }
    static warn(message, data) { this.log('warn', message, data); }
    static error(message, data) { this.log('error', message, data); }
    
    static addToBuffer(entry) {
        this.buffer.push(entry);
        if (this.buffer.length > this.maxBufferSize) {
            this.buffer.shift();
        }
    }
    
    static getSessionId() {
        if (!this.sessionId) {
            this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.sessionId;
    }
    
    static addOutput(output) {
        this.outputs.push(output);
    }
    
    static async flush() {
        const promises = this.outputs.map(output => {
            if (output.flush) {
                return output.flush();
            }
            return Promise.resolve();
        });
        
        await Promise.all(promises);
    }
    
    static getLogs(options = {}) {
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
    }
}

// Firebase Logger Output
class FirebaseLoggerOutput {
    constructor() {
        this.batchSize = 50;
        this.batch = [];
        this.flushInterval = 30000; // 30 seconds
        this.startBatchFlush();
    }
    
    write(logEntry) {
        if (ConfigManager.isProduction()) {
            this.batch.push(logEntry);
            if (this.batch.length >= this.batchSize) {
                this.flush();
            }
        }
    }
    
    async flush() {
        if (this.batch.length === 0) return;
        
        try {
            const db = firebase.firestore();
            const batch = db.batch();
            const logsRef = db.collection('logs');
            
            this.batch.forEach(entry => {
                const docRef = logsRef.doc();
                batch.set(docRef, entry);
            });
            
            await batch.commit();
            Logger.debug(`Flushed ${this.batch.length} log entries to Firebase`);
            this.batch = [];
        } catch (error) {
            console.error('Failed to flush logs to Firebase:', error);
        }
    }
    
    startBatchFlush() {
        setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }
}

// Comprehensive Error Handler
class ErrorHandler {
    static errors = [];
    static maxErrors = 100;
    static reportingEnabled = ConfigManager.isProduction();
    
    static init() {
        // Global error handlers
        window.addEventListener('error', (event) => {
            this.handle(event.error, {
                type: 'javascript_error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.handle(event.reason, {
                type: 'unhandled_promise_rejection'
            });
        });
        
        Logger.info('ErrorHandler initialized');
    }
    
    static async handle(error, context = {}) {
        const errorInfo = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            message: error?.message || String(error),
            stack: error?.stack,
            context,
            userId: AuthService.getCurrentUser()?.uid,
            sessionId: Logger.getSessionId(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Log the error
        Logger.error('Application Error', errorInfo);
        
        // Add to errors collection
        this.addError(errorInfo);
        
        // Report to monitoring service
        if (this.reportingEnabled) {
            await this.reportError(errorInfo);
        }
        
        // Show user-friendly message
        this.showUserError(error, context);
        
        return errorInfo.id;
    }
    
    static addError(errorInfo) {
        this.errors.unshift(errorInfo);
        if (this.errors.length > this.maxErrors) {
            this.errors.pop();
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
        let userMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
        
        // Specific error messages in Arabic
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
        
        // Show toast notification
        if (typeof showToast === 'function') {
            showToast(userMessage, 'error');
        } else {
            alert(userMessage);
        }
    }
    
    static generateErrorId() {
        return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    static getErrors(options = {}) {
        const { userId, since, type } = options;
        
        return this.errors.filter(error => {
            if (userId && error.userId !== userId) return false;
            if (since && new Date(error.timestamp) < since) return false;
            if (type && error.context.type !== type) return false;
            return true;
        });
    }
}

// Security Manager
class SecurityManager {
    static csrfToken = null;
    static rateLimiter = new Map();
    
    static init() {
        this.generateCSRFToken();
        this.setupRateLimiting();
        Logger.info('SecurityManager initialized');
    }
    
    static generateCSRFToken() {
        this.csrfToken = 'csrf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
        return this.csrfToken;
    }
    
    static validateCSRFToken(token) {
        return token === this.csrfToken;
    }
    
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Remove potentially dangerous characters
        return input
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }
    
    static sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return this.sanitizeInput(obj);
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = this.sanitizeInput(value);
            }
        }
        
        return sanitized;
    }
    
    static setupRateLimiting() {
        this.rateLimits = {
            'bulk-import': { max: 5, window: 60000 }, // 5 imports per minute
            'file-upload': { max: 10, window: 60000 }, // 10 uploads per minute
            'api-call': { max: 100, window: 60000 } // 100 API calls per minute
        };
    }
    
    static checkRateLimit(userId, action) {
        const key = `${userId}:${action}`;
        const now = Date.now();
        const limit = this.rateLimits[action];
        
        if (!limit) return true;
        
        if (!this.rateLimiter.has(key)) {
            this.rateLimiter.set(key, []);
        }
        
        const attempts = this.rateLimiter.get(key);
        
        // Remove old attempts
        const validAttempts = attempts.filter(time => now - time < limit.window);
        
        if (validAttempts.length >= limit.max) {
            return false;
        }
        
        validAttempts.push(now);
        this.rateLimiter.set(key, validAttempts);
        
        return true;
    }
    
    static validateFileUpload(file) {
        const maxSize = ConfigManager.get('bulkImport.maxFileSize');
        const supportedFormats = ConfigManager.get('bulkImport.supportedFormats');
        
        // Check file size
        if (file.size > maxSize) {
            throw new Error('File size exceeds maximum allowed size');
        }
        
        // Check file type
        const extension = file.name.split('.').pop().toLowerCase();
        if (!supportedFormats.includes(extension)) {
            throw new Error(`Unsupported file format. Allowed: ${supportedFormats.join(', ')}`);
        }
        
        // Check file name for security
        if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
            throw new Error('Invalid file name');
        }
        
        return true;
    }
}

// Advanced Validation Engine
class ValidationEngine {
    static rules = {
        required: (value) => value !== null && value !== undefined && String(value).trim() !== '',
        
        minLength: (value, length) => String(value).length >= length,
        
        maxLength: (value, length) => String(value).length <= length,
        
        pattern: (value, regex) => regex.test(String(value)),
        
        url: (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },
        
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        
        date: (value) => {
            const date = new Date(value);
            return !isNaN(date.getTime());
        },
        
        time: (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
        
        enum: (value, allowedValues) => allowedValues.includes(value),
        
        platforms: (value) => {
            const platforms = value.split(',').map(p => p.trim());
            const validPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'];
            return platforms.every(p => validPlatforms.includes(p));
        },
        
        hashtags: (value) => {
            if (!value) return true; // Optional field
            return /^#\w+(,#\w+)*$/.test(value);
        }
    };
    
    static validate(data, schema) {
        const errors = [];
        const warnings = [];
        
        // Check required fields
        for (const field of Object.keys(schema)) {
            const rules = schema[field];
            const value = data[field];
            
            if (rules.required && !this.rules.required(value)) {
                errors.push({
                    field,
                    rule: 'required',
                    message: `Field '${field}' is required`
                });
                continue;
            }
            
            // Skip other validations if field is empty and not required
            if (!this.rules.required(value) && !rules.required) {
                continue;
            }
            
            // Apply other rules
            for (const [ruleName, ruleValue] of Object.entries(rules)) {
                if (ruleName === 'required') continue;
                
                const ruleFunction = this.rules[ruleName];
                if (!ruleFunction) {
                    warnings.push({
                        field,
                        rule: ruleName,
                        message: `Unknown validation rule: ${ruleName}`
                    });
                    continue;
                }
                
                let isValid;
                if (ruleValue === true || ruleValue === false) {
                    isValid = ruleValue ? ruleFunction(value) : !ruleFunction(value);
                } else {
                    isValid = ruleFunction(value, ruleValue);
                }
                
                if (!isValid) {
                    errors.push({
                        field,
                        rule: ruleName,
                        message: this.getErrorMessage(field, ruleName, ruleValue, value)
                    });
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    static getErrorMessage(field, rule, ruleValue, value) {
        const messages = {
            required: `${field} is required`,
            minLength: `${field} must be at least ${ruleValue} characters`,
            maxLength: `${field} must be no more than ${ruleValue} characters`,
            pattern: `${field} format is invalid`,
            url: `${field} must be a valid URL`,
            email: `${field} must be a valid email address`,
            date: `${field} must be a valid date`,
            time: `${field} must be a valid time (HH:MM)`,
            enum: `${field} must be one of: ${ruleValue.join(', ')}`,
            platforms: `${field} must contain valid platform names`,
            hashtags: `${field} must be in format: #hashtag1,#hashtag2`
        };
        
        return messages[rule] || `${field} is invalid`;
    }
    
    static validateBulkImportData(posts) {
        const schema = ConfigManager.get('bulkImport.validation');
        const results = {
            valid: [],
            invalid: [],
            summary: {
                total: posts.length,
                validCount: 0,
                invalidCount: 0
            }
        };
        
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            const validation = this.validate(post, schema);
            
            if (validation.valid) {
                results.valid.push({
                    index: i,
                    data: SecurityManager.sanitizeObject(post)
                });
                results.summary.validCount++;
            } else {
                results.invalid.push({
                    index: i,
                    data: post,
                    errors: validation.errors,
                    warnings: validation.warnings
                });
                results.summary.invalidCount++;
            }
        }
        
        return results;
    }
}

/* ------------------------------------------------------------------ 
 * 3. AUTHENTICATION SERVICE
 * ------------------------------------------------------------------*/

class AuthService {
    static currentUser = null;
    static authStateListeners = [];
    static isInitialized = false;
    
    static async init() {
        if (this.isInitialized) return;
        
        try {
            // Initialize Firebase Auth
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded');
            }
            
            // Listen for auth state changes
            firebase.auth().onAuthStateChanged((user) => {
                const previousUser = this.currentUser;
                this.currentUser = user;
                
                if (user) {
                    Logger.info('User authenticated', { uid: user.uid, email: user.email });
                    this.setupUserSession(user);
                } else {
                    Logger.info('User signed out');
                    this.cleanupUserSession();
                }
                
                // Notify listeners
                this.notifyAuthStateListeners(user, previousUser);
            });
            
            this.isInitialized = true;
            Logger.info('AuthService initialized');
        } catch (error) {
            Logger.error('AuthService initialization failed', error);
            throw error;
        }
    }
    
    static setupUserSession(user) {
        // Set user preferences
        this.loadUserPreferences(user.uid);
        
        // Setup session timeout
        this.setupSessionTimeout();
        
        // Initialize user-specific services
        this.initializeUserServices(user);
    }
    
    static cleanupUserSession() {
        // Clear timeouts
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }
        
        // Clear caches
        CacheManager.clearUserCache();
        
        // Reset services
        this.resetUserServices();
    }
    
    static setupSessionTimeout() {
        const timeout = ConfigManager.get('system.sessionTimeout');
        
        this.sessionTimeout = setTimeout(() => {
            Logger.warn('Session timeout - signing out user');
            this.signOut();
        }, timeout);
    }
    
    static async loadUserPreferences(uid) {
        try {
            const doc = await firebase.firestore()
                .collection('users')
                .doc(uid)
                .get();
                
            if (doc.exists) {
                ConfigManager.userPreferences = doc.data().preferences || {};
            }
        } catch (error) {
            Logger.error('Failed to load user preferences', error);
        }
    }
    
    static async saveUserPreferences(uid, preferences) {
        try {
            await firebase.firestore()
                .collection('users')
                .doc(uid)
                .set({
                    preferences,
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
            ConfigManager.userPreferences = preferences;
        } catch (error) {
            Logger.error('Failed to save user preferences', error);
        }
    }
    
    static initializeUserServices(user) {
        // Initialize bulk import service for user
        BulkImportService.initializeForUser(user.uid);
        
        // Initialize cleanup service
        FileCleanupService.initializeForUser(user.uid);
        
        // Initialize dashboard
        DashboardController.init();
        
        // Initialize bulk import UI
        BulkImportController.init();
    }
    
    static resetUserServices() {
        // Reset services
        BulkImportService.reset();
        FileCleanupService.reset();
        DashboardController.reset();
        BulkImportController.reset();
    }
    
    static getCurrentUser() {
        return this.currentUser;
    }
    
    static isAuthenticated() {
        return this.currentUser !== null;
    }
    
    static subscribe(callback) {
        this.authStateListeners.push(callback);
        
        // Call immediately with current state
        if (this.currentUser !== undefined) {
            callback(this.currentUser);
        }
        
        // Return unsubscribe function
        return () => {
            const index = this.authStateListeners.indexOf(callback);
            if (index > -1) {
                this.authStateListeners.splice(index, 1);
            }
        };
    }
    
    static notifyAuthStateListeners(user, previousUser) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(user, previousUser);
            } catch (error) {
                Logger.error('Auth state listener error', error);
            }
        });
    }
    
    static async signOut() {
        try {
            await firebase.auth().signOut();
            Logger.info('User signed out successfully');
        } catch (error) {
            Logger.error('Sign out failed', error);
            throw error;
        }
    }
    
    static async getIdToken() {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }
        
        return await this.currentUser.getIdToken();
    }
}

/* ------------------------------------------------------------------ 
 * 4. BULK IMPORT SERVICE (المحور الرئيسي)
 * ------------------------------------------------------------------*/

class BulkImportService {
    static activeImports = new Map();
    static importHistory = [];
    static userUid = null;
    
    static initializeForUser(uid) {
        this.userUid = uid;
        this.loadImportHistory();
        Logger.info('BulkImportService initialized for user', { uid });
    }
    
    static reset() {
        this.activeImports.clear();
        this.importHistory = [];
        this.userUid = null;
    }
    
    static async upload(file, options = {}) {
        try {
            const uid = AuthService.getCurrentUser()?.uid;
            if (!uid) throw new Error('User not authenticated');
            
            // Security checks
            if (!SecurityManager.checkRateLimit(uid, 'bulk-import')) {
                throw new Error('Rate limit exceeded. Please wait before uploading again.');
            }
            
            SecurityManager.validateFileUpload(file);
            
            // Generate import ID
            const importId = this.generateImportId();
            
            // Create import record
            const importRecord = {
                id: importId,
                userId: uid,
                fileName: file.name,
                fileSize: file.size,
                fileType: this.getFileType(file.name),
                status: 'uploading',
                createdAt: new Date(),
                progress: 0,
                totalPosts: 0,
                validPosts: 0,
                invalidPosts: 0,
                errors: [],
                warnings: []
            };
            
            this.activeImports.set(importId, importRecord);
            
            // Save to Firestore
            await this.saveImportRecord(importRecord);
            
            // Process file
            await this.processFile(file, importId);
            
            return importId;
            
        } catch (error) {
            Logger.error('Bulk import upload failed', error);
            await ErrorHandler.handle(error, { 
                component: 'BulkImportService',
                action: 'upload',
                fileName: file?.name 
            });
            throw error;
        }
    }
    
    static async processFile(file, importId) {
        try {
            const importRecord = this.activeImports.get(importId);
            if (!importRecord) throw new Error('Import record not found');
            
            // Update status
            importRecord.status = 'processing';
            importRecord.progress = 10;
            await this.updateImportRecord(importRecord);
            
            // Parse file content
            const posts = await this.parseFile(file);
            importRecord.totalPosts = posts.length;
            importRecord.progress = 30;
            await this.updateImportRecord(importRecord);
            
            // Validate data
            const validation = ValidationEngine.validateBulkImportData(posts);
            importRecord.validPosts = validation.summary.validCount;
            importRecord.invalidPosts = validation.summary.invalidCount;
            importRecord.progress = 60;
            await this.updateImportRecord(importRecord);
            
            if (validation.summary.validCount === 0) {
                throw new Error('No valid posts found in the file');
            }
            
            // Save posts to database
            await this.savePosts(importId, validation.valid);
            importRecord.progress = 80;
            await this.updateImportRecord(importRecord);
            
            // Schedule posts for publishing
            await this.schedulePostsForPublishing(importId, validation.valid);
            importRecord.progress = 100;
            importRecord.status = 'completed';
            await this.updateImportRecord(importRecord);
            
            Logger.info('Bulk import completed successfully', { 
                importId, 
                totalPosts: posts.length,
                validPosts: validation.summary.validCount 
            });
            
        } catch (error) {
            const importRecord = this.activeImports.get(importId);
            if (importRecord) {
                importRecord.status = 'failed';
                importRecord.errors.push(error.message);
                await this.updateImportRecord(importRecord);
            }
            throw error;
        }
    }
    
    static async parseFile(file) {
        const fileType = this.getFileType(file.name);
        const content = await FileHelper.readAsText(file);
        
        if (fileType === 'json') {
            return this.parseJSON(content);
        } else if (fileType === 'csv') {
            return this.parseCSV(content);
        } else {
            throw new Error('Unsupported file type');
        }
    }
    
    static parseJSON(content) {
        try {
            const data = JSON.parse(content);
            return Array.isArray(data) ? data : [data];
        } catch (error) {
            throw new Error('Invalid JSON format');
        }
    }
    
    static parseCSV(content) {
        try {
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length < 2) throw new Error('CSV must have at least header and one data row');
            
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const requiredColumns = ConfigManager.get('bulkImport.requiredColumns');
            
            // Check if all required columns are present
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            if (missingColumns.length > 0) {
                throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
            }
            
            const posts = [];
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length !== headers.length) continue;
                
                const post = {};
                headers.forEach((header, index) => {
                    post[header] = values[index];
                });
                
                posts.push(post);
            }
            
            return posts;
        } catch (error) {
            throw new Error(`CSV parsing error: ${error.message}`);
        }
    }
    
    static parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
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
    
    static async savePosts(importId, validPosts) {
        const batch = firebase.firestore().batch();
        const postsRef = firebase.firestore().collection('bulk_imports').doc(importId).collection('posts');
        
        validPosts.forEach(({ index, data }) => {
            const postRef = postsRef.doc();
            batch.set(postRef, {
                ...data,
                importId,
                originalIndex: index,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
    }
    
    static async schedulePostsForPublishing(importId, validPosts) {
        const scheduledPosts = validPosts.map(({ data }) => ({
            ...data,
            importId,
            scheduledAt: this.parseScheduledTime(data.day, data.hour),
            status: 'scheduled',
            createdAt: new Date(),
            userId: this.userUid
        }));
        
        await ScheduledPublishService.scheduleBatch(scheduledPosts);
    }
    
    static parseScheduledTime(day, hour) {
        try {
            const dateTime = new Date(`${day}T${hour}:00`);
            if (isNaN(dateTime.getTime())) {
                throw new Error('Invalid date/time format');
            }
            return dateTime;
        } catch (error) {
            throw new Error(`Invalid schedule time: ${day} ${hour}`);
        }
    }
    
    static async saveImportRecord(record) {
        await firebase.firestore()
            .collection('bulk_imports')
            .doc(record.id)
            .set(record, { merge: true });
    }
    
    static async updateImportRecord(record) {
        this.activeImports.set(record.id, record);
        await this.saveImportRecord({
            ...record,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Notify UI
        this.notifyProgressUpdate(record);
    }
    
    static notifyProgressUpdate(record) {
        // Emit custom event for UI updates
        const event = new CustomEvent('bulkImportProgress', {
            detail: record
        });
        document.dispatchEvent(event);
    }
    
    static getImportStatus(importId) {
        return this.activeImports.get(importId) || null;
    }
    
    static async getImportHistory(uid = null) {
        try {
            uid = uid || this.userUid;
            if (!uid) throw new Error('User ID required');
            
            const snapshot = await firebase.firestore()
                .collection('bulk_imports')
                .where('userId', '==', uid)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
                
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            Logger.error('Failed to load import history', error);
            return [];
        }
    }
    
    static async loadImportHistory() {
        this.importHistory = await this.getImportHistory();
    }
    
    static async cancelImport(importId) {
        try {
            const record = this.activeImports.get(importId);
            if (!record) throw new Error('Import not found');
            
            record.status = 'cancelled';
            record.progress = 0;
            await this.updateImportRecord(record);
            
            // Cancel any scheduled posts
            await ScheduledPublishService.cancelImportPosts(importId);
            
            Logger.info('Import cancelled', { importId });
        } catch (error) {
            Logger.error('Failed to cancel import', error);
            throw error;
        }
    }
    
    static getFileType(filename) {
        return filename.split('.').pop().toLowerCase();
    }
    
    static generateImportId() {
        return 'import_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

/* ------------------------------------------------------------------ 
 * 5. SCHEDULED PUBLISH SERVICE
 * ------------------------------------------------------------------*/

class ScheduledPublishService {
    static scheduledPosts = new Map();
    static publishingQueue = [];
    static isProcessing = false;
    static checkInterval = 60000; // Check every minute
    static maxRetries = 3;
    
    static init() {
        this.startScheduleChecker();
        Logger.info('ScheduledPublishService initialized');
    }
    
    static startScheduleChecker() {
        setInterval(async () => {
            if (!this.isProcessing) {
                await this.checkAndPublishScheduledPosts();
            }
        }, this.checkInterval);
    }
    
    static async scheduleBatch(posts) {
        try {
            const batch = firebase.firestore().batch();
            const scheduledRef = firebase.firestore().collection('scheduled_posts');
            
            const scheduledPosts = posts.map(post => {
                const postId = this.generatePostId();
                const scheduledPost = {
                    id: postId,
                    ...post,
                    status: 'scheduled',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    scheduledAt: firebase.firestore.Timestamp.fromDate(post.scheduledAt),
                    retryCount: 0,
                    lastError: null
                };
                
                batch.set(scheduledRef.doc(postId), scheduledPost);
                this.scheduledPosts.set(postId, scheduledPost);
                
                return scheduledPost;
            });
            
            await batch.commit();
            
            Logger.info('Batch scheduled successfully', { 
                count: scheduledPosts.length,
                importId: posts[0]?.importId 
            });
            
            return scheduledPosts;
            
        } catch (error) {
            Logger.error('Failed to schedule batch', error);
            throw error;
        }
    }
    
    static async checkAndPublishScheduledPosts() {
        try {
            this.isProcessing = true;
            const now = new Date();
            
            // Query due posts from Firestore
            const snapshot = await firebase.firestore()
                .collection('scheduled_posts')
                .where('status', '==', 'scheduled')
                .where('scheduledAt', '<=', firebase.firestore.Timestamp.fromDate(now))
                .limit(50)
                .get();
            
            const duePosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                scheduledAt: doc.data().scheduledAt.toDate()
            }));
            
            if (duePosts.length > 0) {
                Logger.info(`Found ${duePosts.length} posts due for publishing`);
                
                for (const post of duePosts) {
                    await this.publishPost(post);
                }
            }
            
        } catch (error) {
            Logger.error('Error checking scheduled posts', error);
        } finally {
            this.isProcessing = false;
        }
    }
    
    static async publishPost(post) {
        try {
            // Update status to publishing
            await this.updatePostStatus(post.id, 'publishing');
            
            const platforms = post.platform.split(',').map(p => p.trim());
            const results = {};
            let successCount = 0;
            
            // Publish to each platform
            for (const platform of platforms) {
                try {
                    const platformService = this.getPlatformService(platform);
                    if (!platformService) {
                        throw new Error(`Platform service not available: ${platform}`);
                    }
                    
                    const result = await platformService.publish(post);
                    results[platform] = {
                        success: true,
                        platformPostId: result.platformPostId,
                        publishedAt: new Date()
                    };
                    successCount++;
                    
                } catch (platformError) {
                    Logger.error(`Failed to publish to ${platform}`, platformError);
                    results[platform] = {
                        success: false,
                        error: platformError.message,
                        attemptedAt: new Date()
                    };
                }
            }
            
            // Update final status
            const finalStatus = successCount > 0 ? 'published' : 'failed';
            await this.updatePostStatus(post.id, finalStatus, {
                results,
                successCount,
                totalPlatforms: platforms.length,
                publishedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // If fully published, trigger file cleanup
            if (successCount === platforms.length) {
                await FileCleanupService.scheduleCleanup(post.importId);
            }
            
            Logger.info(`Post publishing completed`, { 
                postId: post.id,
                successCount,
                totalPlatforms: platforms.length,
                status: finalStatus
            });
            
        } catch (error) {
            Logger.error('Post publishing failed', error);
            await this.handlePublishingError(post, error);
        }
    }
    
    static async handlePublishingError(post, error) {
        const retryCount = (post.retryCount || 0) + 1;
        
        if (retryCount < this.maxRetries) {
            // Schedule retry
            const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 300000); // Max 5 minutes
            const retryAt = new Date(Date.now() + retryDelay);
            
            await this.updatePostStatus(post.id, 'scheduled', {
                retryCount,
                lastError: error.message,
                scheduledAt: firebase.firestore.Timestamp.fromDate(retryAt)
            });
            
            Logger.info(`Post scheduled for retry`, { 
                postId: post.id, 
                retryCount, 
                retryAt 
            });
        } else {
            // Max retries reached, mark as failed
            await this.updatePostStatus(post.id, 'failed', {
                retryCount,
                lastError: error.message,
                failedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Logger.error(`Post failed after ${this.maxRetries} retries`, { 
                postId: post.id, 
                error: error.message 
            });
        }
    }
    
    static getPlatformService(platform) {
        const services = {
            facebook: FacebookGraphService,
            instagram: InstagramGraphService,
            twitter: TwitterService,
            linkedin: LinkedInService,
            tiktok: TikTokService
        };
        
        return services[platform] || null;
    }
    
    static async updatePostStatus(postId, status, additionalData = {}) {
        const updateData = {
            status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            ...additionalData
        };
        
        await firebase.firestore()
            .collection('scheduled_posts')
            .doc(postId)
            .update(updateData);
        
        // Update local cache
        if (this.scheduledPosts.has(postId)) {
            const post = this.scheduledPosts.get(postId);
            Object.assign(post, updateData);
        }
    }
    
    static async cancelImportPosts(importId) {
        try {
            const snapshot = await firebase.firestore()
                .collection('scheduled_posts')
                .where('importId', '==', importId)
                .where('status', '==', 'scheduled')
                .get();
            
            const batch = firebase.firestore().batch();
            
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, {
                    status: 'cancelled',
                    cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            await batch.commit();
            
            Logger.info(`Cancelled ${snapshot.docs.length} scheduled posts for import ${importId}`);
        } catch (error) {
            Logger.error('Failed to cancel import posts', error);
            throw error;
        }
    }
    
    static generatePostId() {
        return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

/* ------------------------------------------------------------------ 
 * 6. FILE CLEANUP SERVICE
 * ------------------------------------------------------------------*/

class FileCleanupService {
    static cleanupQueue = new Map();
    static userUid = null;
    static cleanupDelay = ConfigManager.get('system.cleanupDelay');
    
    static initializeForUser(uid) {
        this.userUid = uid;
        this.startCleanupProcessor();
        Logger.info('FileCleanupService initialized for user', { uid });
    }
    
    static reset() {
        this.cleanupQueue.clear();
        this.userUid = null;
    }
    
    static startCleanupProcessor() {
        // Process cleanup queue every hour
        setInterval(async () => {
            await this.processCleanupQueue();
        }, 60 * 60 * 1000);
    }
    
    static async scheduleCleanup(importId, delay = null) {
        try {
            delay = delay || this.cleanupDelay;
            const executeAt = new Date(Date.now() + delay);
            
            const cleanupTask = {
                importId,
                scheduledAt: executeAt,
                status: 'scheduled',
                createdAt: new Date()
            };
            
            this.cleanupQueue.set(importId, cleanupTask);
            
            // Save to Firestore for persistence
            await firebase.firestore()
                .collection('cleanup_tasks')
                .doc(importId)
                .set(cleanupTask);
            
            Logger.info('Cleanup scheduled', { importId, executeAt });
            
            // If delay is short, process immediately
            if (delay < 60000) { // Less than 1 minute
                setTimeout(() => this.executeCleanup(importId), delay);
            }
            
        } catch (error) {
            Logger.error('Failed to schedule cleanup', error);
        }
    }
    
    static async processCleanupQueue() {
        try {
            const now = new Date();
            
            // Load pending cleanup tasks from Firestore
            const snapshot = await firebase.firestore()
                .collection('cleanup_tasks')
                .where('status', '==', 'scheduled')
                .where('scheduledAt', '<=', firebase.firestore.Timestamp.fromDate(now))
                .get();
            
            for (const doc of snapshot.docs) {
                const task = doc.data();
                await this.executeCleanup(task.importId);
            }
            
        } catch (error) {
            Logger.error('Cleanup queue processing failed', error);
        }
    }
    
    static async executeCleanup(importId) {
        try {
            Logger.info('Executing cleanup', { importId });
            
            // Check if all posts from this import have been published
            const hasUnpublishedPosts = await this.checkUnpublishedPosts(importId);
            
            if (hasUnpublishedPosts) {
                Logger.info('Cleanup postponed - unpublished posts exist', { importId });
                
                // Reschedule for later
                await this.scheduleCleanup(importId, 60 * 60 * 1000); // 1 hour later
                return;
            }
            
            // Delete import files and data
            await this.deleteImportData(importId);
            
            // Update cleanup task status
            await this.updateCleanupTaskStatus(importId, 'completed');
            
            Logger.info('Cleanup completed successfully', { importId });
            
        } catch (error) {
            Logger.error('Cleanup execution failed', { importId, error });
            await this.updateCleanupTaskStatus(importId, 'failed', error.message);
        }
    }
    
    static async checkUnpublishedPosts(importId) {
        try {
            const snapshot = await firebase.firestore()
                .collection('scheduled_posts')
                .where('importId', '==', importId)
                .where('status', 'in', ['scheduled', 'publishing'])
                .limit(1)
                .get();
            
            return !snapshot.empty;
        } catch (error) {
            Logger.error('Failed to check unpublished posts', error);
            return true; // Err on the side of caution
        }
    }
    
    static async deleteImportData(importId) {
        try {
            const batch = firebase.firestore().batch();
            
            // Delete import record
            const importRef = firebase.firestore().collection('bulk_imports').doc(importId);
            batch.delete(importRef);
            
            // Delete import posts subcollection
            const postsSnapshot = await importRef.collection('posts').get();
            postsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Delete any uploaded files from Firebase Storage
            await this.deleteImportFiles(importId);
            
            await batch.commit();
            
            Logger.info('Import data deleted', { importId });
            
        } catch (error) {
            Logger.error('Failed to delete import data', error);
            throw error;
        }
    }
    
    static async deleteImportFiles(importId) {
        try {
            const storage = firebase.storage();
            const folderRef = storage.ref().child(`bulk_imports/${importId}`);
            
            // List all files in the import folder
            const listResult = await folderRef.listAll();
            
            // Delete each file
            const deletePromises = listResult.items.map(fileRef => fileRef.delete());
            await Promise.all(deletePromises);
            
            Logger.info('Import files deleted from storage', { importId });
            
        } catch (error) {
            // Storage errors are not critical for the cleanup process
            Logger.warn('Failed to delete import files from storage', error);
        }
    }
    
    static async updateCleanupTaskStatus(importId, status, error = null) {
        try {
            const updateData = {
                status,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (error) {
                updateData.error = error;
            }
            
            await firebase.firestore()
                .collection('cleanup_tasks')
                .doc(importId)
                .update(updateData);
            
            // Update local queue
            if (this.cleanupQueue.has(importId)) {
                const task = this.cleanupQueue.get(importId);
                Object.assign(task, updateData);
            }
            
        } catch (error) {
            Logger.error('Failed to update cleanup task status', error);
        }
    }
    
    static async forceCleanup(importId) {
        try {
            Logger.warn('Force cleanup initiated', { importId });
            await this.deleteImportData(importId);
            await this.updateCleanupTaskStatus(importId, 'force_completed');
        } catch (error) {
            Logger.error('Force cleanup failed', error);
            throw error;
        }
    }
    
    static async getStorageUsage(uid) {
        try {
            uid = uid || this.userUid;
            
            const snapshot = await firebase.firestore()
                .collection('bulk_imports')
                .where('userId', '==', uid)
                .get();
            
            let totalSize = 0;
            let activeImports = 0;
            
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                totalSize += data.fileSize || 0;
                if (data.status !== 'completed') {
                    activeImports++;
                }
            });
            
            return {
                totalSize,
                activeImports,
                formattedSize: FileHelper.formatFileSize(totalSize)
            };
            
        } catch (error) {
            Logger.error('Failed to get storage usage', error);
            return { totalSize: 0, activeImports: 0, formattedSize: '0 B' };
        }
    }
}

/* ------------------------------------------------------------------ 
 * 7. PLATFORM SERVICES
 * ------------------------------------------------------------------*/

// Facebook Graph Service
class FacebookGraphService {
    static apiVersion = ConfigManager.get('platforms.facebook.apiVersion');
    static baseUrl = ConfigManager.get('platforms.facebook.baseUrl');
    static rateLimit = ConfigManager.get('platforms.facebook.rateLimit');
    
    static async publish(post) {
        try {
            // Get Facebook access token
            const accessToken = await this.getAccessToken(post.userId);
            if (!accessToken) throw new Error('Facebook access token not available');
            
            // Format content for Facebook
            const content = this.formatContent(post);
            
            // Prepare post data
            const postData = {
                message: content.text,
                access_token: accessToken
            };
            
            // Add image if available
            if (post.socialImageurl) {
                postData.picture = post.socialImageurl;
            }
            
            // Add link if available
            if (post.shortUrl) {
                postData.link = post.shortUrl;
            }
            
            const pageId = await this.getPageId(post.userId);
            const url = `${this.baseUrl}/${this.apiVersion}/${pageId}/feed`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(postData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Facebook API error: ${error.error?.message || response.statusText}`);
            }
            
            const result = await response.json();
            
            Logger.info('Facebook post published', { postId: result.id });
            
            return {
                success: true,
                platformPostId: result.id,
                publishedAt: new Date(),
                platform: 'facebook'
            };
            
        } catch (error) {
            Logger.error('Facebook publishing failed', error);
            throw error;
        }
    }
    
    static formatContent(post) {
        let text = `${post.socialTitle}\n\n${post.socialDescription}`;
        
        // Add hashtags
        if (post.socialhachtags) {
            text += `\n\n${post.socialhachtags}`;
        }
        
        // Check content limit
        const limit = ConfigManager.get('platforms.facebook.contentLimit');
        if (text.length > limit) {
            text = text.substring(0, limit - 3) + '...';
        }
        
        return { text };
    }
    
    static async getAccessToken(userId) {
        try {
            const doc = await firebase.firestore()
                .collection('accounts')
                .doc(`${userId}_facebook`)
                .get();
                
            return doc.exists ? doc.data().accessToken : null;
        } catch (error) {
            Logger.error('Failed to get Facebook access token', error);
            return null;
        }
    }
    
    static async getPageId(userId) {
        try {
            const doc = await firebase.firestore()
                .collection('accounts')
                .doc(`${userId}_facebook`)
                .get();
                
            return doc.exists ? doc.data().pageId : null;
        } catch (error) {
            Logger.error('Failed to get Facebook page ID', error);
            throw new Error('Facebook page not configured');
        }
    }
}

// Instagram Graph Service
class InstagramGraphService {
    static apiVersion = ConfigManager.get('platforms.instagram.apiVersion');
    static baseUrl = ConfigManager.get('platforms.instagram.baseUrl');
    
    static async publish(post) {
        try {
            // Instagram requires an image
            if (!post.socialImageurl) {
                throw new Error('Instagram posts require an image');
            }
            
            const accessToken = await this.getAccessToken(post.userId);
            if (!accessToken) throw new Error('Instagram access token not available');
            
            const content = this.formatContent(post);
            const accountId = await this.getAccountId(post.userId);
            
            // Step 1: Create media container
            const containerResponse = await this.createMediaContainer(accountId, accessToken, content, post.socialImageurl);
            const containerId = containerResponse.id;
            
            // Step 2: Publish the media
            const publishResponse = await this.publishMedia(accountId, accessToken, containerId);
            
            Logger.info('Instagram post published', { postId: publishResponse.id });
            
            return {
                success: true,
                platformPostId: publishResponse.id,
                publishedAt: new Date(),
                platform: 'instagram'
            };
            
        } catch (error) {
            Logger.error('Instagram publishing failed', error);
            throw error;
        }
    }
    
    static async createMediaContainer(accountId, accessToken, content, imageUrl) {
        const url = `${this.baseUrl}/${this.apiVersion}/${accountId}/media`;
        
        const postData = {
            image_url: imageUrl,
            caption: content.text,
            access_token: accessToken
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(postData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Instagram media container error: ${error.error?.message || response.statusText}`);
        }
        
        return await response.json();
    }
    
    static async publishMedia(accountId, accessToken, containerId) {
        const url = `${this.baseUrl}/${this.apiVersion}/${accountId}/media_publish`;
        
        const postData = {
            creation_id: containerId,
            access_token: accessToken
        };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(postData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Instagram publish error: ${error.error?.message || response.statusText}`);
        }
        
        return await response.json();
    }
    
    static formatContent(post) {
        let text = `${post.socialTitle}\n\n${post.socialDescription}`;
        
        // Add hashtags (Instagram loves hashtags)
        if (post.socialhachtags) {
            text += `\n\n${post.socialhachtags}`;
        }
        
        // Check content limit
        const limit = ConfigManager.get('platforms.instagram.contentLimit');
        if (text.length > limit) {
            text = text.substring(0, limit - 3) + '...';
        }
        
        return { text };
    }
    
    static async getAccessToken(userId) {
        try {
            const doc = await firebase.firestore()
                .collection('accounts')
                .doc(`${userId}_instagram`)
                .get();
                
            return doc.exists ? doc.data().accessToken : null;
        } catch (error) {
            Logger.error('Failed to get Instagram access token', error);
            return null;
        }
    }
    
    static async getAccountId(userId) {
        try {
            const doc = await firebase.firestore()
                .collection('accounts')
                .doc(`${userId}_instagram`)
                .get();
                
            return doc.exists ? doc.data().accountId : null;
        } catch (error) {
            Logger.error('Failed to get Instagram account ID', error);
            throw new Error('Instagram account not configured');
        }
    }
}

// Twitter Service
class TwitterService {
    static apiVersion = ConfigManager.get('platforms.twitter.apiVersion');
    static baseUrl = ConfigManager.get('platforms.twitter.baseUrl');
    
    static async publish(post) {
        try {
            const accessToken = await this.getAccessToken(post.userId);
            if (!accessToken) throw new Error('Twitter access token not available');
            
            const content = this.formatContent(post);
            
            // Check if we need to create a thread
            const tweets = this.splitIntoTweets(content.text);
            
            if (tweets.length === 1) {
                return await this.publishSingleTweet(accessToken, tweets[0], post);
            } else {
                return await this.publishThread(accessToken, tweets, post);
            }
            
        } catch (error) {
            Logger.error('Twitter publishing failed', error);
            throw error;
        }
    }
    
    static formatContent(post) {
        let text = `${post.socialTitle}\n\n${post.socialDescription}`;
        
        // Add hashtags
        if (post.socialhachtags) {
            text += `\n\n${post.socialhachtags}`;
        }
        
        return { text };
    }
    
    static splitIntoTweets(text) {
        const maxLength = ConfigManager.get('platforms.twitter.contentLimit');
        
        if (text.length <= maxLength) {
            return [text];
        }
        
        const tweets = [];
        let currentTweet = '';
        const words = text.split(' ');
        
        for (const word of words) {
            if (currentTweet.length + word.length + 1 <= maxLength - 10) { // Reserve space for "... (1/n)"
                currentTweet += (currentTweet ? ' ' : '') + word;
            } else {
                if (currentTweet) {
                    tweets.push(currentTweet);
                    currentTweet = word;
                } else {
                    // Word is too long, split it
                    tweets.push(word.substring(0, maxLength - 10));
                    currentTweet = word.substring(maxLength - 10);
                }
            }
        }
        
        if (currentTweet) {
            tweets.push(currentTweet);
        }
        
        // Add thread indicators
        return tweets.map((tweet, index) => 
            tweets.length > 1 ? `${tweet} (${index + 1}/${tweets.length})` : tweet
        );
    }
    
    static async publishSingleTweet(accessToken, tweetText, post) {
        const tweetData = { text: tweetText };
        
        // Add media if available
        if (post.socialImageurl) {
            const mediaId = await this.uploadMedia(accessToken, post.socialImageurl);
            if (mediaId) {
                tweetData.media = { media_ids: [mediaId] };
            }
        }
        
        const response = await this.makeTweetRequest(accessToken, tweetData);
        
        return {
            success: true,
            platformPostId: response.data.id,
            publishedAt: new Date(),
            platform: 'twitter'
        };
    }
    
    static async publishThread(accessToken, tweets, post) {
        const tweetIds = [];
        let replyToId = null;
        
        for (let i = 0; i < tweets.length; i++) {
            const tweetData = { text: tweets[i] };
            
            if (replyToId) {
                tweetData.reply = { in_reply_to_tweet_id: replyToId };
            }
            
            // Add media to first tweet only
            if (i === 0 && post.socialImageurl) {
                const mediaId = await this.uploadMedia(accessToken, post.socialImageurl);
                if (mediaId) {
                    tweetData.media = { media_ids: [mediaId] };
                }
            }
            
            const response = await this.makeTweetRequest(accessToken, tweetData);
            const tweetId = response.data.id;
            tweetIds.push(tweetId);
            replyToId = tweetId;
        }
        
        return {
            success: true,
            platformPostId: tweetIds[0], // Return the ID of the first tweet
            threadIds: tweetIds,
            publishedAt: new Date(),
            platform: 'twitter'
        };
    }
    
    static async makeTweetRequest(accessToken, tweetData) {
        const url = `${this.baseUrl}/${this.apiVersion}/tweets`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tweetData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Twitter API error: ${error.detail || response.statusText}`);
        }
        
        return await response.json();
    }
    
    static async uploadMedia(accessToken, imageUrl) {
        try {
            // First, fetch the image
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) return null;
            
            const imageBlob = await imageResponse.blob();
            const formData = new FormData();
            formData.append('media', imageBlob);
            
            const uploadResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData
            });
            
            if (uploadResponse.ok) {
                const result = await uploadResponse.json();
                return result.media_id_string;
            }
            
            return null;
        } catch (error) {
            Logger.warn('Twitter media upload failed', error);
            return null;
        }
    }
    
    static async getAccessToken(userId) {
        try {
            const doc = await firebase.firestore()
                .collection('accounts')
                .doc(`${userId}_twitter`)
                .get();
                
            return doc.exists ? doc.data().accessToken : null;
        } catch (error) {
            Logger.error('Failed to get Twitter access token', error);
            return null;
        }
    }
}

// LinkedIn Service
class LinkedInService {
    static apiVersion = ConfigManager.get('platforms.linkedin.apiVersion');
    static baseUrl = ConfigManager.get('platforms.linkedin.baseUrl');
    
    static async publish(post) {
        try {
            const accessToken = await this.getAccessToken(post.userId);
            if (!accessToken) throw new Error('LinkedIn access token not available');
            
            const personId = await this.getPersonId(post.userId);
            const content = this.formatContent(post);
            
            const postData = {
                author: `urn:li:person:${personId}`,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                    'com.linkedin.ugc.ShareContent': {
                        shareCommentary: {
                            text: content.text
                        },
                        shareMediaCategory: post.socialImageurl || post.shortUrl ? 'ARTICLE' : 'NONE'
                    }
                },
                visibility: {
                    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
                }
            };
            
            // Add article/link content
            if (post.shortUrl) {
                postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
                    status: 'READY',
                    originalUrl: post.shortUrl,
                    title: {
                        text: post.socialTitle
                    },
                    description: {
                        text: post.socialDescription
                    }
                }];
                
                if (post.socialImageurl) {
                    postData.specificContent['com.linkedin.ugc.ShareContent'].media[0].thumbnails = [{
                        url: post.socialImageurl
                    }];
                }
            }
            
            const response = await fetch(`${this.baseUrl}/${this.apiVersion}/ugcPosts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                body: JSON.stringify(postData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`LinkedIn API error: ${error.message || response.statusText}`);
            }
            
            const result = await response.json();
            
            Logger.info('LinkedIn post published', { postId: result.id });
            
            return {
                success: true,
                platformPostId: result.id,
                publishedAt: new Date(),
                platform: 'linkedin'
            };
            
        } catch (error) {
            Logger.error('LinkedIn publishing failed', error);
            throw error;
        }
    }
    
    static formatContent(post) {
        let text = `${post.socialTitle}\n\n${post.socialDescription}`;
        
        // Add hashtags
        if (post.socialhachtags) {
            text += `\n\n${post.socialhachtags}`;
        }
        
        // Check content limit
        const limit = ConfigManager.get('platforms.linkedin.contentLimit');
        if (text.length > limit) {
            text = text.substring(0, limit - 3) + '...';
        }
        
        return { text };
    }
    
    static async getAccessToken(userId) {
        try {
            const doc = await firebase.firestore()
                .collection('accounts')
                .doc(`${userId}_linkedin`)
                .get();
                
            return doc.exists ? doc.data().accessToken : null;
        } catch (error) {
            Logger.error('Failed to get LinkedIn access token', error);
            return null;
        }
    }
    
    static async getPersonId(userId) {
        try {
            const doc = await firebase.firestore()
                .collection('accounts')
                .doc(`${userId}_linkedin`)
                .get();
                
            return doc.exists ? doc.data().personId : null;
        } catch (error) {
            Logger.error('Failed to get LinkedIn person ID', error);
            throw new Error('LinkedIn account not configured');
        }
    }
}

// TikTok Service
class TikTokService {
    static apiVersion = ConfigManager.get('platforms.tiktok.apiVersion');
    static baseUrl = ConfigManager.get('platforms.tiktok.baseUrl');
    
    static async publish(post) {
        try {
            // Note: TikTok primarily requires video content
            // This implementation assumes text-based posts for business accounts
            
            const accessToken = await this.getAccessToken(post.userId);
            if (!accessToken) throw new Error('TikTok access token not available');
            
            const content = this.formatContent(post);
            
            // TikTok Business API for text posts (limited availability)
            const postData = {
                text: content.text,
                privacy_level: 'MUTUAL_FOLLOW_FRIENDS', // or 'PUBLIC_TO_EVERYONE'
                disable_duet: false,
                disable_comment: false,
                disable_stitch: false,
                brand_content_toggle: false
            };
            
            // Add video URL if available (TikTok prefers video content)
            if (post.videoUrl) {
                postData.video_url = post.videoUrl;
            }
            
            const response = await fetch(`${this.baseUrl}/${this.apiVersion}/post/publish/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`TikTok API error: ${error.message || response.statusText}`);
            }
            
            const result = await response.json();
            
            Logger.info('TikTok post published', { postId: result.publish_id });
            
            return {
                success: true,
                platformPostId: result.publish_id,
                publishedAt: new Date(),
                platform: 'tiktok'
            };
            
        } catch (error) {
            Logger.error('TikTok publishing failed', error);
            throw error;
        }
    }
    
    static formatContent(post) {
        let text = `${post.socialTitle}\n\n${post.socialDescription}`;
        
        // Add hashtags (very important for TikTok)
        if (post.socialhachtags) {
            text += `\n\n${post.socialhachtags}`;
        }
        
        // Check content limit
        const limit = ConfigManager.get('platforms.tiktok.contentLimit');
        if (text.length > limit) {
            text = text.substring(0, limit - 3) + '...';
        }
        
        return { text };
    }
    
    static async getAccessToken(userId) {
        try {
            const doc = await firebase.firestore()
                .collection('accounts')
                .doc(`${userId}_tiktok`)
                .get();
                
            return doc.exists ? doc.data().accessToken : null;
        } catch (error) {
            Logger.error('Failed to get TikTok access token', error);
            return null;
        }
    }
}

/* ------------------------------------------------------------------ 
 * 8. POST SERVICE (مبسط للجدولة فقط)
 * ------------------------------------------------------------------*/

class PostService {
    static subscribers = new Map();
    
    static async create(postData) {
        try {
            const uid = AuthService.getCurrentUser()?.uid;
            if (!uid) throw new Error('User not authenticated');
            
            const postId = this.generatePostId();
            const post = {
                id: postId,
                userId: uid,
                ...SecurityManager.sanitizeObject(postData),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await firebase.firestore()
                .collection('posts')
                .doc(postId)
                .set(post);
            
            Logger.info('Post created', { postId });
            return postId;
            
        } catch (error) {
            Logger.error('Failed to create post', error);
            throw error;
        }
    }
    
    static async update(postId, data) {
        try {
            const uid = AuthService.getCurrentUser()?.uid;
            if (!uid) throw new Error('User not authenticated');
            
            const updateData = {
                ...SecurityManager.sanitizeObject(data),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await firebase.firestore()
                .collection('posts')
                .doc(postId)
                .update(updateData);
            
            Logger.info('Post updated', { postId });
            
        } catch (error) {
            Logger.error('Failed to update post', error);
            throw error;
        }
    }
    
    static async delete(postId) {
        try {
            const uid = AuthService.getCurrentUser()?.uid;
            if (!uid) throw new Error('User not authenticated');
            
            // Verify ownership
            const doc = await firebase.firestore()
                .collection('posts')
                .doc(postId)
                .get();
            
            if (!doc.exists || doc.data().userId !== uid) {
                throw new Error('Post not found or access denied');
            }
            
            await firebase.firestore()
                .collection('posts')
                .doc(postId)
                .delete();
            
            Logger.info('Post deleted', { postId });
            
        } catch (error) {
            Logger.error('Failed to delete post', error);
            throw error;
        }
    }
    
    static async list(uid, options = {}) {
        try {
            uid = uid || AuthService.getCurrentUser()?.uid;
            if (!uid) throw new Error('User not authenticated');
            
            let query = firebase.firestore()
                .collection('posts')
                .where('userId', '==', uid)
                .orderBy('createdAt', 'desc');
            
            if (options.status) {
                query = query.where('status', '==', options.status);
            }
            
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                scheduledAt: doc.data().scheduledAt?.toDate()
            }));
            
        } catch (error) {
            Logger.error('Failed to list posts', error);
            throw error;
        }
    }
    
    static subscribe(uid, callback, options = {}) {
        try {
            uid = uid || AuthService.getCurrentUser()?.uid;
            if (!uid) throw new Error('User not authenticated');
            
            let query = firebase.firestore()
                .collection('posts')
                .where('userId', '==', uid)
                .orderBy('createdAt', 'desc');
            
            if (options.status) {
                query = query.where('status', '==', options.status);
            }
            
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const unsubscribe = query.onSnapshot((snapshot) => {
                const posts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate(),
                    scheduledAt: doc.data().scheduledAt?.toDate()
                }));
                
                callback(posts);
            }, (error) => {
                Logger.error('Post subscription error', error);
                callback([]);
            });
            
            // Store subscription
            const subscriptionId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.subscribers.set(subscriptionId, { unsubscribe, callback });
            
            // Return unsubscribe function
            return () => {
                unsubscribe();
                this.subscribers.delete(subscriptionId);
            };
            
        } catch (error) {
            Logger.error('Failed to subscribe to posts', error);
            return () => {};
        }
    }
    
    static async getById(postId) {
        try {
            const doc = await firebase.firestore()
                .collection('posts')
                .doc(postId)
                .get();
            
            if (!doc.exists) {
                throw new Error('Post not found');
            }
            
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                scheduledAt: data.scheduledAt?.toDate()
            };
            
        } catch (error) {
            Logger.error('Failed to get post by ID', error);
            throw error;
        }
    }
    
    static async markAsPublished(postId, platformResults) {
        try {
            await this.update(postId, {
                status: 'published',
                platformResults,
                publishedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Logger.info('Post marked as published', { postId });
            
        } catch (error) {
            Logger.error('Failed to mark post as published', error);
            throw error;
        }
    }
    
    static generatePostId() {
        return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    static cleanup() {
        // Unsubscribe all active subscriptions
        this.subscribers.forEach(({ unsubscribe }) => {
            try {
                unsubscribe();
            } catch (error) {
                Logger.error('Error cleaning up post subscription', error);
            }
        });
        
        this.subscribers.clear();
    }
}

/* ------------------------------------------------------------------ 
 * 9. DASHBOARD CONTROLLER
 * ------------------------------------------------------------------*/

class DashboardController {
    static isInitialized = false;
    static subscriptions = [];
    static refreshInterval = null;
    
    static async init() {
        if (this.isInitialized) return;
        
        try {
            Logger.info('Initializing Dashboard Controller');
            
            // Wait for authentication
            if (!AuthService.isAuthenticated()) {
                Logger.warn('Dashboard init: User not authenticated');
                return;
            }
            
            // Setup real-time subscriptions
            this.setupSubscriptions();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup refresh intervals
            this.setupRefreshIntervals();
            
            // Setup UI event listeners
            this.setupUIEventListeners();
            
            this.isInitialized = true;
            Logger.info('Dashboard Controller initialized');
            
        } catch (error) {
            Logger.error('Dashboard Controller initialization failed', error);
            await ErrorHandler.handle(error, {
                component: 'DashboardController',
                action: 'init'
            });
        }
    }
    
    static setupSubscriptions() {
        const uid = AuthService.getCurrentUser()?.uid;
        if (!uid) return;
        
        // Subscribe to bulk imports
        const importUnsubscribe = firebase.firestore()
            .collection('bulk_imports')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .onSnapshot((snapshot) => {
                const imports = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                this.updateImportsDisplay(imports);
            });
        
        this.subscriptions.push(importUnsubscribe);
        
        // Subscribe to scheduled posts
        const scheduledUnsubscribe = firebase.firestore()
            .collection('scheduled_posts')
            .where('userId', '==', uid)
            .where('status', 'in', ['scheduled', 'publishing'])
            .orderBy('scheduledAt', 'asc')
            .limit(20)
            .onSnapshot((snapshot) => {
                const posts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    scheduledAt: doc.data().scheduledAt?.toDate()
                }));
                this.updateScheduledPostsDisplay(posts);
            });
        
        this.subscriptions.push(scheduledUnsubscribe);
    }
    
    static async loadInitialData() {
        try {
            const uid = AuthService.getCurrentUser()?.uid;
            if (!uid) return;
            
            // Load dashboard statistics
            const stats = await this.getDashboardStats(uid);
            this.updateStatsDisplay(stats);
            
            // Load storage usage
            const storageUsage = await FileCleanupService.getStorageUsage(uid);
            this.updateStorageDisplay(storageUsage);
            
        } catch (error) {
            Logger.error('Failed to load dashboard data', error);
        }
    }
    
    static async getDashboardStats(uid) {
        try {
            const [importsSnapshot, scheduledSnapshot, publishedSnapshot] = await Promise.all([
                firebase.firestore().collection('bulk_imports').where('userId', '==', uid).get(),
                firebase.firestore().collection('scheduled_posts').where('userId', '==', uid).where('status', '==', 'scheduled').get(),
                firebase.firestore().collection('scheduled_posts').where('userId', '==', uid).where('status', '==', 'published').get()
            ]);
            
            return {
                totalImports: importsSnapshot.size,
                scheduledPosts: scheduledSnapshot.size,
                publishedPosts: publishedSnapshot.size,
                successRate: publishedSnapshot.size > 0 ? 
                    Math.round((publishedSnapshot.size / (publishedSnapshot.size + scheduledSnapshot.size)) * 100) : 0
            };
            
        } catch (error) {
            Logger.error('Failed to get dashboard stats', error);
            return {
                totalImports: 0,
                scheduledPosts: 0,
                publishedPosts: 0,
                successRate: 0
            };
        }
    }
    
    static updateStatsDisplay(stats) {
        this.updateElement('totalImports', stats.totalImports);
        this.updateElement('scheduledPosts', stats.scheduledPosts);
        this.updateElement('publishedPosts', stats.publishedPosts);
        this.updateElement('successRate', stats.successRate + '%');
    }
    
    static updateImportsDisplay(imports) {
        const container = document.getElementById('recentImports');
        if (!container) return;
        
        const html = imports.map(importRecord => `
            <div class="import-item" data-import-id="${importRecord.id}">
                <div class="import-info">
                    <div class="import-name">${importRecord.fileName}</div>
                    <div class="import-stats">
                        ${importRecord.validPosts || 0} منشور صالح من ${importRecord.totalPosts || 0}
                    </div>
                    <div class="import-date">
                        ${this.formatDate(importRecord.createdAt)}
                    </div>
                </div>
                <div class="import-status status-${importRecord.status}">
                    ${this.getStatusText(importRecord.status)}
                </div>
                <div class="import-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${importRecord.progress || 0}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html || '<div class="empty-state">لا توجد عمليات استيراد حديثة</div>';
    }
    
    static updateScheduledPostsDisplay(posts) {
        const container = document.getElementById('scheduledPosts');
        if (!container) return;
        
        const html = posts.map(post => `
            <div class="scheduled-post-item">
                <div class="post-content">
                    <div class="post-title">${post.socialTitle}</div>
                    <div class="post-platforms">${post.platform}</div>
                </div>
                <div class="post-schedule">
                    <div class="schedule-date">${this.formatDate(post.scheduledAt)}</div>
                    <div class="schedule-time">${this.formatTime(post.scheduledAt)}</div>
                </div>
                <div class="post-status status-${post.status}">
                    ${this.getStatusText(post.status)}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html || '<div class="empty-state">لا توجد منشورات مجدولة</div>';
    }
    
    static updateStorageDisplay(usage) {
        const container = document.getElementById('storageUsage');
        if (!container) return;
        
        container.innerHTML = `
            <div class="storage-info">
                <div class="storage-used">${usage.formattedSize}</div>
                <div class="storage-label">المساحة المستخدمة</div>
            </div>
            <div class="storage-files">
                <div class="files-count">${usage.activeImports}</div>
                <div class="files-label">ملفات نشطة</div>
            </div>
        `;
    }
    
    static setupRefreshIntervals() {
        // Refresh dashboard every 30 seconds
        this.refreshInterval = setInterval(async () => {
            try {
                const uid = AuthService.getCurrentUser()?.uid;
                if (uid) {
                    const stats = await this.getDashboardStats(uid);
                    this.updateStatsDisplay(stats);
                }
            } catch (error) {
            }
        }, 30000);
    }
    
    static setupUIEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadInitialData());
        }
        
        // Import history toggle
        const historyToggle = document.getElementById('toggleImportHistory');
        if (historyToggle) {
            historyToggle.addEventListener('click', () => this.toggleImportHistory());
        }
    }
    
    static async toggleImportHistory() {
        const container = document.getElementById('importHistoryContainer');
        if (!container) return;
        
        if (container.style.display === 'none' || !container.style.display) {
            // Load and show history
            const uid = AuthService.getCurrentUser()?.uid;
            if (uid) {
                const history = await BulkImportService.getImportHistory(uid);
                this.displayImportHistory(history);
                container.style.display = 'block';
            }
        } else {
            container.style.display = 'none';
        }
    }
    
    static displayImportHistory(history) {
        const container = document.getElementById('importHistory');
        if (!container) return;
        
        const html = history.map(record => `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-filename">${record.fileName}</div>
                    <div class="history-date">${this.formatDate(record.createdAt)}</div>
                </div>
                <div class="history-stats">
                    <span class="stat-item">${record.totalPosts || 0} منشور</span>
                    <span class="stat-item">${record.validPosts || 0} صالح</span>
                </div>
                <div class="history-status status-${record.status}">
                    ${this.getStatusText(record.status)}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html || '<div class="empty-state">لا يوجد تاريخ استيراد</div>';
    }
    
    static updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            if (typeof value === 'number') {
                this.animateNumber(element, parseInt(element.textContent) || 0, value);
            } else {
                element.textContent = value;
            }
        }
    }
    
    static animateNumber(element, from, to) {
        const duration = 1000;
        const steps = 30;
        const stepValue = (to - from) / steps;
        let current = from;
        let step = 0;
        
        const timer = setInterval(() => {
            current += stepValue;
            element.textContent = Math.round(current);
            step++;
            
            if (step >= steps) {
                clearInterval(timer);
                element.textContent = to;
            }
        }, duration / steps);
    }
    
    static formatDate(date) {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('ar-AE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    static formatTime(date) {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleTimeString('ar-AE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    static getStatusText(status) {
        const statusTexts = {
            uploading: 'جاري الرفع',
            processing: 'جاري المعالجة',
            completed: 'مكتمل',
            failed: 'فشل',
            cancelled: 'ملغى',
            scheduled: 'مجدول',
            publishing: 'جاري النشر',
            published: 'منشور'
        };
        
        return statusTexts[status] || status;
    }
    
    static reset() {
        // Clear subscriptions
        this.subscriptions.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
            }
        });
        
        this.subscriptions = [];
        
        // Clear intervals
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        this.isInitialized = false;
        Logger.info('Dashboard Controller reset');
    }
}

/* ------------------------------------------------------------------ 
 * 10. BULK IMPORT CONTROLLER
 * ------------------------------------------------------------------*/

class BulkImportController {
    static isInitialized = false;
    static currentImport = null;
    static progressInterval = null;
    
    static init() {
        if (this.isInitialized) return;
        
        try {
            Logger.info('Initializing Bulk Import Controller');
            
            // Setup UI event listeners
            this.setupEventListeners();
            
            // Setup progress tracking
            this.setupProgressTracking();
            
            // Initialize file templates
            this.setupFileTemplates();
            
            this.isInitialized = true;
            Logger.info('Bulk Import Controller initialized');
            
        } catch (error) {
            Logger.error('Bulk Import Controller initialization failed', error);
            ErrorHandler.handle(error, {
                component: 'BulkImportController',
                action: 'init'
            });
        }
    }
    
    static setupEventListeners() {
        // File upload input
        const fileInput = document.getElementById('bulkImportFile');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        }
        
        // Upload button
        const uploadBtn = document.getElementById('uploadBulkFile');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.handleUploadClick());
        }
        
        // Cancel button
        const cancelBtn = document.getElementById('cancelImport');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancelImport());
        }
        
        // Template download buttons
        const csvTemplateBtn = document.getElementById('downloadCsvTemplate');
        const jsonTemplateBtn = document.getElementById('downloadJsonTemplate');
        
        if (csvTemplateBtn) {
            csvTemplateBtn.addEventListener('click', () => this.downloadTemplate('csv'));
        }
        
        if (jsonTemplateBtn) {
            jsonTemplateBtn.addEventListener('click', () => this.downloadTemplate('json'));
        }
        
        // Drag and drop
        const dropZone = document.getElementById('fileDropZone');
        if (dropZone) {
            this.setupDragAndDrop(dropZone);
        }
    }
    
    static setupDragAndDrop(dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection({ target: { files: [files[0]] } });
            }
        });
    }
    
    static setupProgressTracking() {
        // Listen for bulk import progress events
        document.addEventListener('bulkImportProgress', (e) => {
            this.updateProgressDisplay(e.detail);
        });
    }
    
    static handleFileSelection(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            // Validate file
            SecurityManager.validateFileUpload(file);
            
            // Show file info
            this.displayFileInfo(file);
            
            // Enable upload button
            const uploadBtn = document.getElementById('uploadBulkFile');
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'رفع وبدء المعالجة';
            }
            
        } catch (error) {
            this.showError(error.message);
            this.clearFileSelection();
        }
    }
    
    static displayFileInfo(file) {
        const container = document.getElementById('fileInfo');
        if (!container) return;
        
        const fileSize = FileHelper.formatFileSize(file.size);
        const fileType = file.name.split('.').pop().toUpperCase();
        
        container.innerHTML = `
            <div class="file-info-card">
                <div class="file-icon ${fileType.toLowerCase()}"></div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span class="file-size">${fileSize}</span>
                        <span class="file-type">${fileType}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="clear-file-btn" onclick="BulkImportController.clearFileSelection()">
                        إزالة
                    </button>
                </div>
            </div>
        `;
        
        container.style.display = 'block';
    }
    
    static clearFileSelection() {
        const fileInput = document.getElementById('bulkImportFile');
        const uploadBtn = document.getElementById('uploadBulkFile');
        const fileInfo = document.getElementById('fileInfo');
        
        if (fileInput) fileInput.value = '';
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'اختر ملف أولاً';
        }
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }
        
        this.hideProgressDisplay();
    }
    
    static async handleUploadClick() {
        try {
            const fileInput = document.getElementById('bulkImportFile');
            const file = fileInput?.files[0];
            
            if (!file) {
                throw new Error('لم يتم اختيار ملف');
            }
            
            // Show progress display
            this.showProgressDisplay();
            
            // Start upload
            const importId = await BulkImportService.upload(file);
            this.currentImport = importId;
            
            Logger.info('Bulk import started', { importId });
            
        } catch (error) {
            Logger.error('Upload failed', error);
            this.showError(error.message);
            this.hideProgressDisplay();
        }
    }
    
    static async handleCancelImport() {
        if (!this.currentImport) return;
        
        try {
            await BulkImportService.cancelImport(this.currentImport);
            this.showMessage('تم إلغاء عملية الاستيراد بنجاح', 'success');
            this.hideProgressDisplay();
            this.clearFileSelection();
            this.currentImport = null;
            
        } catch (error) {
            Logger.error('Cancel import failed', error);
            this.showError('فشل في إلغاء عملية الاستيراد');
        }
    }
    
    static showProgressDisplay() {
        const container = document.getElementById('importProgressContainer');
        if (container) {
            container.style.display = 'block';
        }
        
        // Disable upload controls
        const uploadBtn = document.getElementById('uploadBulkFile');
        const fileInput = document.getElementById('bulkImportFile');
        
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'جاري المعالجة...';
        }
        
        if (fileInput) fileInput.disabled = true;
    }
    
    static hideProgressDisplay() {
        const container = document.getElementById('importProgressContainer');
        if (container) {
            container.style.display = 'none';
        }
        
        // Re-enable upload controls
        const uploadBtn = document.getElementById('uploadBulkFile');
        const fileInput = document.getElementById('bulkImportFile');
        
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'رفع ملف جديد';
        }
        
        if (fileInput) fileInput.disabled = false;
    }
    
    static updateProgressDisplay(progress) {
        // Update progress bar
        const progressBar = document.getElementById('importProgressBar');
        const progressText = document.getElementById('importProgressText');
        const progressPercent = document.getElementById('importProgressPercent');
        
        if (progressBar) {
            progressBar.style.width = `${progress.progress}%`;
        }
        
        if (progressPercent) {
            progressPercent.textContent = `${progress.progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = this.getProgressMessage(progress);
        }
        
        // Update status
        const statusElement = document.getElementById('importStatus');
        if (statusElement) {
            statusElement.textContent = this.getStatusText(progress.status);
            statusElement.className = `import-status status-${progress.status}`;
        }
        
        // Show results when completed
        if (progress.status === 'completed' || progress.status === 'failed') {
            setTimeout(() => {
                this.showImportResults(progress);
            }, 1000);
        }
    }
    
    static getProgressMessage(progress) {
        const messages = {
            uploading: 'جاري رفع الملف...',
            processing: 'جاري معالجة البيانات...',
            validating: 'جاري التحقق من صحة البيانات...',
            scheduling: 'جاري جدولة المنشورات...',
            completed: 'تمت العملية بنجاح!',
            failed: 'فشلت العملية',
            cancelled: 'تم إلغاء العملية'
        };
        
        return messages[progress.status] || 'جاري المعالجة...';
    }
    
    static getStatusText(status) {
        const statusTexts = {
            uploading: 'جاري الرفع',
            processing: 'جاري المعالجة',
            validating: 'جاري التحقق',
            scheduling: 'جاري الجدولة',
            completed: 'مكتملة',
            failed: 'فشل',
            cancelled: 'ملغاة'
        };
        
        return statusTexts[status] || status;
    }
    
    static showImportResults(results) {
        const container = document.getElementById('importResults');
        if (!container) return;
        
        let html = '';
        
        if (results.status === 'completed') {
            html = `
                <div class="import-success">
                    <div class="success-icon">✅</div>
                    <div class="success-message">
                        <h3>تم الاستيراد بنجاح!</h3>
                        <div class="import-stats">
                            <div class="stat-item">
                                <span class="stat-number">${results.totalPosts}</span>
                                <span class="stat-label">إجمالي المنشورات</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${results.validPosts}</span>
                                <span class="stat-label">منشورات صالحة</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${results.invalidPosts || 0}</span>
                                                                <span class="stat-label">منشورات غير صالحة</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (results.status === 'failed') {
            html = `
                <div class="import-error">
                    <div class="error-icon">❌</div>
                    <div class="error-message">
                        <h3>فشل في الاستيراد</h3>
                        <div class="error-details">
                            ${results.errors?.map(error => `<div class="error-item">${error}</div>`).join('') || ''}
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        container.style.display = 'block';
        
        // Auto-hide after success
        if (results.status === 'completed') {
            setTimeout(() => {
                this.hideProgressDisplay();
                this.clearFileSelection();
                this.currentImport = null;
                
                // Refresh dashboard
                if (DashboardController.isInitialized) {
                    DashboardController.loadInitialData();
                }
            }, 5000);
        }
    }
    
    static setupFileTemplates() {
        // This will be called during initialization
        Logger.debug('File templates setup completed');
    }
    
    static downloadTemplate(format) {
        try {
            const templates = this.getTemplateData();
            
            if (format === 'csv') {
                const csvContent = this.generateCSVTemplate(templates.headers, templates.sampleData);
                this.downloadFile(csvContent, 'socialhub-import-template.csv', 'text/csv');
            } else if (format === 'json') {
                const jsonContent = this.generateJSONTemplate(templates.sampleData);
                this.downloadFile(jsonContent, 'socialhub-import-template.json', 'application/json');
            }
            
            Logger.info(`Template downloaded: ${format}`);
            
        } catch (error) {
            Logger.error('Template download failed', error);
            this.showError('فشل في تحميل النموذج');
        }
    }
    
    static getTemplateData() {
        const headers = ConfigManager.get('bulkImport.requiredColumns');
        const sampleData = [
            {
                socialTitle: 'عنوان المنشور الأول',
                socialDescription: 'وصف تفصيلي للمنشور الأول يشرح المحتوى',
                shortUrl: 'https://example.com/post1',
                linkType: 'article',
                socialImageurl: 'https://example.com/image1.jpg',
                socialhachtags: '#تسويق,#وسائل_التواصل,#محتوى',
                day: '2024-12-01',
                hour: '09:00',
                platform: 'facebook,instagram'
            },
            {
                socialTitle: 'عنوان المنشور الثاني',
                socialDescription: 'وصف تفصيلي للمنشور الثاني',
                shortUrl: 'https://example.com/post2',
                linkType: 'video',
                socialImageurl: 'https://example.com/image2.jpg',
                socialhachtags: '#فيديو,#تعليم,#نصائح',
                day: '2024-12-01',
                hour: '14:30',
                platform: 'twitter,linkedin'
            }
        ];
        
        return { headers, sampleData };
    }
    
    static generateCSVTemplate(headers, sampleData) {
        let csv = headers.join(',') + '\n';
        
        sampleData.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Escape commas and quotes
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csv += values.join(',') + '\n';
        });
        
        return csv;
    }
    
    static generateJSONTemplate(sampleData) {
        return JSON.stringify(sampleData, null, 2);
    }
    
    static downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
    }
    
    static showError(message) {
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            alert(message);
        }
    }
    
    static showMessage(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    }
    
    static reset() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        
        this.currentImport = null;
        this.isInitialized = false;
        
        Logger.info('Bulk Import Controller reset');
    }
}

/* ------------------------------------------------------------------ 
 * 11. UTILITIES
 * ------------------------------------------------------------------*/

// Updated File Helper for JSON/CSV Focus
class FileHelper {
    static maxSizes = {
        document: ConfigManager.get('bulkImport.maxFileSize', 50 * 1024 * 1024)
    };
    
    static allowedTypes = {
        document: ['text/csv', 'application/json', 'text/plain']
    };
    
    static validateFile(file, type = 'document') {
        const errors = [];
        
        // Check file size
        const maxSize = this.maxSizes[type];
        if (file.size > maxSize) {
            errors.push(`حجم الملف كبير جداً. الحد الأقصى: ${this.formatFileSize(maxSize)}`);
        }
        
        // Check file extension
        const extension = file.name.split('.').pop().toLowerCase();
        const supportedFormats = ConfigManager.get('bulkImport.supportedFormats');
        
        if (!supportedFormats.includes(extension)) {
            errors.push(`صيغة الملف غير مدعومة. المسموح: ${supportedFormats.join(', ')}`);
        }
        
        // Check MIME type (if available)
        const allowedTypes = this.allowedTypes[type];
        if (file.type && !allowedTypes.some(mimeType => file.type.includes(mimeType))) {
            console.warn('MIME type mismatch, but proceeding based on extension');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    static async readAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
            
            // Detect encoding
            reader.readAsText(file, 'UTF-8');
        });
    }
    
    static detectEncoding(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = () => {
                const bytes = new Uint8Array(reader.result);
                
                // Simple UTF-8 detection
                let isUTF8 = true;
                for (let i = 0; i < Math.min(bytes.length, 1000); i++) {
                    if (bytes[i] > 127) {
                        isUTF8 = false;
                        break;
                    }
                }
                
                resolve(isUTF8 ? 'UTF-8' : 'Windows-1256');
            };
            
            reader.readAsArrayBuffer(file.slice(0, 1000));
        });
    }
    
    static async readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
            
            reader.readAsDataURL(file);
        });
    }
    
    static generateSampleFile(format) {
        const sampleData = BulkImportController.getTemplateData();
        
        if (format === 'csv') {
            return BulkImportController.generateCSVTemplate(sampleData.headers, sampleData.sampleData);
        } else if (format === 'json') {
            return BulkImportController.generateJSONTemplate(sampleData.sampleData);
        }
        
        return '';
    }
}

// Enhanced Date Time Helper
class DateTimeHelper {
    static timezone = ConfigManager.get('system.timezone', 'Asia/Dubai');
    static locale = ConfigManager.get('system.language', 'ar-AE');
    
    static formatDate(date, format = 'full') {
        if (!date) return '';
        
        try {
            const d = date instanceof Date ? date : new Date(date);
            
            const options = {
                full: {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: this.timezone
                },
                short: {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: this.timezone
                },
                date: {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    timeZone: this.timezone
                },
                time: {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: this.timezone
                }
            };
            
            return new Intl.DateTimeFormat(this.locale, options[format] || options.full).format(d);
        } catch (error) {
            Logger.error('Date formatting failed', error);
            return String(date);
        }
    }
    
    static parseScheduledTime(day, hour) {
        try {
            // Validate day format (YYYY-MM-DD)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
                throw new Error('تنسيق التاريخ غير صحيح. استخدم YYYY-MM-DD');
            }
            
            // Validate hour format (HH:MM)
            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hour)) {
                throw new Error('تنسيق الوقت غير صحيح. استخدم HH:MM');
            }
            
            const dateTime = new Date(`${day}T${hour}:00`);
            
            if (isNaN(dateTime.getTime())) {
                throw new Error('تاريخ أو وقت غير صحيح');
            }
            
            // Check if date is in the past
            if (dateTime < new Date()) {
                throw new Error('لا يمكن جدولة منشور في الماضي');
            }
            
            return dateTime;
        } catch (error) {
            throw new Error(`خطأ في تحليل الوقت المجدول: ${error.message}`);
        }
    }
    
    static getRelativeTime(date) {
        try {
            const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' });
            const now = new Date();
            const diffInSeconds = (date - now) / 1000;
            
            const units = [
                { unit: 'year', seconds: 31536000 },
                { unit: 'month', seconds: 2592000 },
                { unit: 'day', seconds: 86400 },
                { unit: 'hour', seconds: 3600 },
                { unit: 'minute', seconds: 60 },
                { unit: 'second', seconds: 1 }
            ];
            
            for (const { unit, seconds } of units) {
                const interval = Math.floor(diffInSeconds / seconds);
                if (Math.abs(interval) >= 1) {
                    return rtf.format(interval, unit);
                }
            }
            
            return rtf.format(0, 'second');
        } catch (error) {
            Logger.error('Relative time formatting failed', error);
            return this.formatDate(date, 'short');
        }
    }
    
    static isValidScheduleTime(dateTime) {
        const now = new Date();
        const maxFuture = new Date();
        maxFuture.setFullYear(maxFuture.getFullYear() + 1); // Max 1 year in future
        
        return dateTime > now && dateTime < maxFuture;
    }
    
    static getOptimalPostingTimes() {
        // Optimal posting times for Dubai timezone
        return {
            facebook: ['09:00', '13:00', '20:00'],
            instagram: ['11:00', '14:00', '19:00'],
            twitter: ['08:00', '12:00', '17:00'],
            linkedin: ['08:00', '12:00', '17:00'],
            tiktok: ['18:00', '20:00', '22:00']
        };
    }
}

// Network Helper
class NetworkHelper {
    static connectionStatus = 'unknown';
    static listeners = [];
    
    static async checkConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('https://www.google.com/generate_204', {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.status === 204;
        } catch {
            return false;
        }
    }
    
    static isOnline() {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }
    
    static onConnectionChange(callback) {
        this.listeners.push(callback);
        
        if (typeof window !== 'undefined') {
            const onOnline = () => {
                this.connectionStatus = 'online';
                this.notifyListeners(true);
            };
            
            const onOffline = () => {
                this.connectionStatus = 'offline';
                this.notifyListeners(false);
            };
            
            window.addEventListener('online', onOnline);
            window.addEventListener('offline', onOffline);
            
            // Return cleanup function
            return () => {
                window.removeEventListener('online', onOnline);
                window.removeEventListener('offline', onOffline);
                this.removeListener(callback);
            };
        }
        
        return () => this.removeListener(callback);
    }
    
    static removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    
    static notifyListeners(isOnline) {
        this.listeners.forEach(callback => {
            try {
                callback(isOnline);
            } catch (error) {
                Logger.error('Network listener error', error);
            }
        });
    }
    
    static async waitForConnection(timeout = 30000) {
        return new Promise((resolve, reject) => {
            if (this.isOnline()) {
                resolve(true);
                return;
            }
            
            const timer = setTimeout(() => {
                cleanup();
                reject(new Error('انتهت مهلة انتظار الاتصال بالإنترنت'));
            }, timeout);
            
            const cleanup = this.onConnectionChange((isOnline) => {
                if (isOnline) {
                    clearTimeout(timer);
                    cleanup();
                    resolve(true);
                }
            });
        });
    }
    
    static getConnectionInfo() {
        const connection = navigator.connection || 
                          navigator.mozConnection || 
                          navigator.webkitConnection;
        
        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        
        return null;
    }
}

/* ------------------------------------------------------------------ 
 * 12. INITIALIZATION SYSTEM
 * ------------------------------------------------------------------*/

// Toast Notifications (Updated)
function showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    const toastId = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast toast-${type}`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="closeToast('${toastId}')">×</button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
        closeToast(toastId);
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }
}

function getToastIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

// Cache Manager
class CacheManager {
    static cache = new Map();
    static maxSize = 1000;
    static ttl = 5 * 60 * 1000; // 5 minutes
    
    static set(key, value, customTTL = null) {
        const expiry = Date.now() + (customTTL || this.ttl);
        
        this.cache.set(key, {
            value,
            expiry
        });
        
        // Clean up if cache is too large
        if (this.cache.size > this.maxSize) {
            this.cleanup();
        }
    }
    
    static get(key) {
        const item = this.cache.get(key);
        
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    static delete(key) {
        return this.cache.delete(key);
    }
    
    static clear() {
        this.cache.clear();
    }
    
    static cleanup() {
        const now = Date.now();
        const toDelete = [];
        
        for (const [key, item] of this.cache) {
            if (now > item.expiry) {
                toDelete.push(key);
            }
        }
        
        toDelete.forEach(key => this.cache.delete(key));
        
        // If still too large, remove oldest entries
        if (this.cache.size > this.maxSize) {
            const entries = Array.from(this.cache.entries());
            const toRemove = entries.slice(0, this.cache.size - this.maxSize);
            toRemove.forEach(([key]) => this.cache.delete(key));
        }
    }
    
    static startCleanupInterval() {
        setInterval(() => {
            this.cleanup();
        }, 60000); // Cleanup every minute
    }
    
    static clearUserCache() {
        const userPrefix = AuthService.getCurrentUser()?.uid;
        if (!userPrefix) return;
        
        const toDelete = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith(userPrefix)) {
                toDelete.push(key);
            }
        }
        
        toDelete.forEach(key => this.cache.delete(key));
    }
}

// Main Application Initialization
window.SocialHubPro = {
    // Core Systems
    ConfigManager,
    Logger,
    ErrorHandler,
    SecurityManager,
    ValidationEngine,
    CacheManager,
    
    // Services  
    AuthService,
    BulkImportService,
    ScheduledPublishService,
    FileCleanupService,
    PostService,
    
    // Platform Services
    FacebookGraphService,
    InstagramGraphService,
    TwitterService,
    LinkedInService,
    TikTokService,
    
    // Controllers
    DashboardController,
    BulkImportController,
    
    // Utilities
    DateTimeHelper,
    FileHelper,
    NetworkHelper,
    
    // Global Functions
    showToast,
    closeToast,
    
    // Initialize the entire application
    async init() {
        try {
            Logger.info('🚀 Initializing SocialHub Pro v11.0 - Production Ready');
            
            // Validate environment
            ConfigManager.validate();
            
            // Initialize core systems
            Logger.info('📊 Initializing core systems...');
            ErrorHandler.init();
            SecurityManager.init();
            CacheManager.startCleanupInterval();
            
            // Initialize Firebase
            Logger.info('🔥 Initializing Firebase...');
            if (typeof firebase !== 'undefined') {
                if (!firebase.apps.length) {
                    firebase.initializeApp(ConfigManager.get('firebase'));
                }
                Logger.info('Firebase initialized successfully');
            } else {
                throw new Error('Firebase SDK not loaded');
            }
            
            // Initialize services
            Logger.info('🔐 Initializing authentication...');
            await AuthService.init();
            
            Logger.info('📅 Initializing scheduled publishing...');
            ScheduledPublishService.init();
            
            // Setup logger outputs
            if (ConfigManager.isProduction()) {
                Logger.addOutput(new FirebaseLoggerOutput());
            }
            
            // Initialize UI when user is authenticated
            AuthService.subscribe((user) => {
                if (user) {
                    Logger.info('👤 User authenticated, initializing UI...');
                    
                    // Initialize controllers
                    DashboardController.init();
                    BulkImportController.init();
                    
                } else {
                    Logger.info('🚪 User logged out, cleaning up...');
                    
                    // Reset controllers
                    DashboardController.reset();
                    BulkImportController.reset();
                    
                    // Clear user-specific caches
                    CacheManager.clearUserCache();
                }
            });
            
            // Setup network monitoring
            NetworkHelper.onConnectionChange((isOnline) => {
                if (isOnline) {
                    showToast('تم استعادة الاتصال بالإنترنت', 'success');
                } else {
                    showToast('فقد الاتصال بالإنترنت', 'warning');
                }
            });
            
            Logger.info('✅ SocialHub Pro v11.0 initialized successfully');
            showToast('تم تحميل التطبيق بنجاح', 'success');
            
            return true;
            
        } catch (error) {
            Logger.error('❌ Failed to initialize SocialHub Pro', error);
            showToast('فشل في تحميل التطبيق. يرجى إعادة تحميل الصفحة.', 'error');
            throw error;
        }
    },
    
    // Cleanup and destroy
    async destroy() {
        try {
            Logger.info('🧹 Destroying SocialHub Pro...');
            
            // Flush logs
            await Logger.flush();
            
            // Clear cache
            CacheManager.clear();
            
            // Cleanup services
            PostService.cleanup();
            
            // Reset controllers
            DashboardController.reset();
            BulkImportController.reset();
            
            Logger.info('✅ SocialHub Pro destroyed successfully');
            
        } catch (error) {
            Logger.error('❌ Failed to destroy SocialHub Pro', error);
        }
    }
};

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.SocialHubPro.init().catch(console.error);
        });
    } else {
        window.SocialHubPro.init().catch(console.error);
    }
}

// Handle page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        window.SocialHubPro.destroy();
    });
}

// Remove the problematic await statement at the end of the file
// and replace it with a proper initialization call
Logger.info('🎉 SocialHub Pro v11.0 System Ready!');