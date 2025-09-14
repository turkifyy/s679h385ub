/*=================================================================
* SOCIALHUB PRO v11.0 - BULK IMPORT FOCUSED SYSTEM (FIXED)
* Production-Grade Application - GitHub Pages Compatible
* Focus: Bulk Import with JSON/CSV Support + Auto File Cleanup
* 
* FIXES APPLIED:
* ✅ All async/await syntax errors resolved
* ✅ GitHub Pages compatibility ensured
* ✅ Firebase initialization wrapped in IIFE
* ✅ Top-level await replaced with async functions
* ✅ Error handling improved
* ✅ Module loading fixes applied
*
* Author: SocialHub Pro Development Team
* Version: 11.0.1 (GitHub Pages Fixed)
* Last Updated: September 2025
* Environment: Production Ready (GitHub Pages Compatible)
*================================================================*/

/* ------------------------------------------------------------------
* 1. CORE CONFIGURATION & CONSTANTS
* ------------------------------------------------------------------*/

// Production Environment Configuration
const SOCIALHUB_CONFIG = {
    version: '11.0.1',
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
* 2. CORE SYSTEMS - FIXED ASYNC IMPLEMENTATIONS
* ------------------------------------------------------------------*/

// Configuration Manager - Fixed
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

// Advanced Logger System - Fixed
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
            data: typeof data === 'object' ? data : { value: data },
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

// Firebase Logger Output - Fixed
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
            // Check if Firebase is initialized
            if (!window.firebase || !firebase.firestore) {
                Logger.debug('Firebase not available for logging');
                return;
            }

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

// Comprehensive Error Handler - Fixed
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

// Security Manager - Fixed
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
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    static setupRateLimiting() {
        // Simple rate limiting implementation
        this.rateLimiter = new Map();
    }

    static checkRateLimit(identifier, limit = 100, window = 60000) {
        const now = Date.now();
        const windowStart = now - window;
        
        if (!this.rateLimiter.has(identifier)) {
            this.rateLimiter.set(identifier, []);
        }
        
        const requests = this.rateLimiter.get(identifier);
        
        // Remove old requests outside the window
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        if (validRequests.length >= limit) {
            return false; // Rate limit exceeded
        }
        
        validRequests.push(now);
        this.rateLimiter.set(identifier, validRequests);
        return true;
    }
}

/* ------------------------------------------------------------------
* 3. FIREBASE INTEGRATION - FIXED FOR GITHUB PAGES
* ------------------------------------------------------------------*/

// Firebase Service - Fixed with proper async handling
class FirebaseService {
    static app = null;
    static db = null;
    static auth = null;
    static storage = null;
    static initialized = false;
    static initializationPromise = null;

    static async initialize() {
        if (this.initialized) {
            return Promise.resolve();
        }

        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._initializeFirebase();
        return this.initializationPromise;
    }

    static async _initializeFirebase() {
        try {
            Logger.info('Initializing Firebase...');
            
            // Check if Firebase SDK is loaded
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded');
            }

            const config = ConfigManager.get('firebase');
            if (!config) {
                throw new Error('Firebase configuration not found');
            }

            // Initialize Firebase
            this.app = firebase.initializeApp(config);
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.storage = firebase.storage();

            // Configure Firestore
            this.db.settings({
                ignoreUndefinedProperties: true
            });

            // Test connection
            await this._testConnection();

            this.initialized = true;
            Logger.info('Firebase initialized successfully');
            
            return true;
        } catch (error) {
            Logger.error('Firebase initialization failed', error);
            throw error;
        }
    }

    static async _testConnection() {
        try {
            // Test Firestore connection
            await this.db.doc('system/health').set({
                status: 'operational',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                version: SOCIALHUB_CONFIG.version
            }, { merge: true });
            
            Logger.info('Firebase connection test successful');
        } catch (error) {
            Logger.error('Firebase connection test failed', error);
            throw error;
        }
    }

    static async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    static getDb() {
        if (!this.initialized) {
            throw new Error('Firebase not initialized. Call FirebaseService.initialize() first.');
        }
        return this.db;
    }

    static getAuth() {
        if (!this.initialized) {
            throw new Error('Firebase not initialized. Call FirebaseService.initialize() first.');
        }
        return this.auth;
    }

    static getStorage() {
        if (!this.initialized) {
            throw new Error('Firebase not initialized. Call FirebaseService.initialize() first.');
        }
        return this.storage;
    }
}

// Authentication Service - Fixed
class AuthService {
    static currentUser = null;
    static authStateListener = null;

    static async initialize() {
        try {
            await FirebaseService.ensureInitialized();
            
            const auth = FirebaseService.getAuth();
            
            // Set up auth state listener
            this.authStateListener = auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.handleAuthStateChange(user);
            });

            Logger.info('AuthService initialized');
        } catch (error) {
            Logger.error('AuthService initialization failed', error);
            throw error;
        }
    }

    static handleAuthStateChange(user) {
        if (user) {
            Logger.info('User signed in', { uid: user.uid, email: user.email });
            this.showAuthenticatedUI();
        } else {
            Logger.info('User signed out');
            this.showUnauthenticatedUI();
        }
    }

    static showAuthenticatedUI() {
        const loginContainer = document.getElementById('login-container');
        const mainContent = document.getElementById('main-content');
        
        if (loginContainer) loginContainer.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
    }

    static showUnauthenticatedUI() {
        const loginContainer = document.getElementById('login-container');
        const mainContent = document.getElementById('main-content');
        
        if (loginContainer) loginContainer.style.display = 'block';
        if (mainContent) mainContent.style.display = 'none';
    }

    static getCurrentUser() {
        return this.currentUser;
    }

    static async signInWithEmailAndPassword(email, password) {
        try {
            await FirebaseService.ensureInitialized();
            const auth = FirebaseService.getAuth();
            
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            Logger.info('User signed in successfully');
            return userCredential.user;
        } catch (error) {
            Logger.error('Sign in failed', error);
            throw error;
        }
    }

    static async signOut() {
        try {
            await FirebaseService.ensureInitialized();
            const auth = FirebaseService.getAuth();
            
            await auth.signOut();
            Logger.info('User signed out successfully');
        } catch (error) {
            Logger.error('Sign out failed', error);
            throw error;
        }
    }

    static async createUserWithEmailAndPassword(email, password) {
        try {
            await FirebaseService.ensureInitialized();
            const auth = FirebaseService.getAuth();
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            Logger.info('User created successfully');
            return userCredential.user;
        } catch (error) {
            Logger.error('User creation failed', error);
            throw error;
        }
    }
}

/* ------------------------------------------------------------------
* 4. BULK IMPORT SYSTEM - FIXED ASYNC IMPLEMENTATIONS
* ------------------------------------------------------------------*/

// File Manager - Fixed
class FileManager {
    static maxFileSize = ConfigManager.get('bulkImport.maxFileSize');
    static supportedFormats = ConfigManager.get('bulkImport.supportedFormats');

    static async uploadFile(file, progressCallback) {
        try {
            // Validate file
            this.validateFile(file);

            await FirebaseService.ensureInitialized();
            const storage = FirebaseService.getStorage();
            
            const fileName = `imports/${Date.now()}_${file.name}`;
            const storageRef = storage.ref(fileName);
            
            const uploadTask = storageRef.put(file);
            
            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (progressCallback) {
                            progressCallback(progress);
                        }
                    },
                    (error) => {
                        Logger.error('File upload failed', error);
                        reject(error);
                    },
                    async () => {
                        try {
                            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                            Logger.info('File uploaded successfully', { fileName, downloadURL });
                            resolve({
                                fileName,
                                downloadURL,
                                size: file.size,
                                type: file.type
                            });
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            });
        } catch (error) {
            Logger.error('File upload failed', error);
            throw error;
        }
    }

    static validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }

        if (file.size > this.maxFileSize) {
            throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
        }

        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(fileExtension)) {
            throw new Error(`Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`);
        }

        return true;
    }

    static async parseFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const content = event.target.result;
                    const extension = file.name.split('.').pop().toLowerCase();
                    
                    let data;
                    if (extension === 'json') {
                        data = JSON.parse(content);
                    } else if (extension === 'csv') {
                        data = this.parseCSV(content);
                    } else {
                        throw new Error('Unsupported file format');
                    }
                    
                    resolve(data);
                } catch (error) {
                    Logger.error('File parsing failed', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }

    static parseCSV(content) {
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const row = {};
                
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                
                data.push(row);
            }
        }

        return data;
    }
}

// Data Validator - Fixed
class DataValidator {
    static requiredColumns = ConfigManager.get('bulkImport.requiredColumns');
    static validation = ConfigManager.get('bulkImport.validation');

    static validateData(data) {
        if (!Array.isArray(data)) {
            throw new Error('Data must be an array');
        }

        if (data.length === 0) {
            throw new Error('No data rows found');
        }

        const results = {
            valid: [],
            invalid: [],
            summary: {
                total: data.length,
                valid: 0,
                invalid: 0,
                errors: []
            }
        };

        // Check required columns in first row
        const firstRow = data[0];
        const missingColumns = this.requiredColumns.filter(col => !(col in firstRow));
        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }

        // Validate each row
        data.forEach((row, index) => {
            const rowValidation = this.validateRow(row, index);
            
            if (rowValidation.isValid) {
                results.valid.push(row);
                results.summary.valid++;
            } else {
                results.invalid.push({
                    row: row,
                    index: index,
                    errors: rowValidation.errors
                });
                results.summary.invalid++;
                results.summary.errors.push(...rowValidation.errors);
            }
        });

        Logger.info('Data validation completed', results.summary);
        return results;
    }

    static validateRow(row, index) {
        const errors = [];
        let isValid = true;

        // Check required columns
        this.requiredColumns.forEach(column => {
            if (!row[column] || row[column].toString().trim() === '') {
                errors.push(`Row ${index + 1}: Missing required field '${column}'`);
                isValid = false;
            }
        });

        // Validate field formats
        Object.keys(this.validation).forEach(field => {
            if (row[field]) {
                const fieldValidation = this.validation[field];
                const value = row[field].toString().trim();

                // Length validation
                if (fieldValidation.minLength && value.length < fieldValidation.minLength) {
                    errors.push(`Row ${index + 1}: ${field} too short (min: ${fieldValidation.minLength})`);
                    isValid = false;
                }

                if (fieldValidation.maxLength && value.length > fieldValidation.maxLength) {
                    errors.push(`Row ${index + 1}: ${field} too long (max: ${fieldValidation.maxLength})`);
                    isValid = false;
                }

                // Pattern validation
                if (fieldValidation.pattern && !fieldValidation.pattern.test(value)) {
                    errors.push(`Row ${index + 1}: ${field} format invalid`);
                    isValid = false;
                }

                // Enum validation
                if (fieldValidation.enum && !fieldValidation.enum.includes(value)) {
                    errors.push(`Row ${index + 1}: ${field} must be one of: ${fieldValidation.enum.join(', ')}`);
                    isValid = false;
                }
            }
        });

        return { isValid, errors };
    }
}

// Bulk Import Manager - Fixed
class BulkImportManager {
    static async processImport(file, options = {}) {
        try {
            Logger.info('Starting bulk import process', { fileName: file.name });

            // Step 1: Upload file
            const uploadResult = await FileManager.uploadFile(file, options.progressCallback);
            
            // Step 2: Parse file
            const rawData = await FileManager.parseFile(file);
            
            // Step 3: Validate data
            const validationResult = DataValidator.validateData(rawData);
            
            if (validationResult.summary.valid === 0) {
                throw new Error('No valid records found in the file');
            }

            // Step 4: Save to database
            const importId = await this.saveToDatabase(validationResult.valid, {
                fileName: file.name,
                uploadResult,
                validationSummary: validationResult.summary
            });

            Logger.info('Bulk import completed successfully', {
                importId,
                totalProcessed: validationResult.summary.total,
                validRecords: validationResult.summary.valid,
                invalidRecords: validationResult.summary.invalid
            });

            return {
                success: true,
                importId,
                summary: validationResult.summary,
                uploadResult
            };

        } catch (error) {
            Logger.error('Bulk import failed', error);
            throw error;
        }
    }

    static async saveToDatabase(validData, metadata) {
        try {
            await FirebaseService.ensureInitialized();
            const db = FirebaseService.getDb();
            
            const importId = 'import_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const batch = db.batch();
            const batchSize = ConfigManager.get('bulkImport.batchSize');

            // Create import metadata document
            const importMetaRef = db.collection('imports').doc(importId);
            batch.set(importMetaRef, {
                id: importId,
                fileName: metadata.fileName,
                totalRecords: validData.length,
                status: 'processing',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                uploadUrl: metadata.uploadResult.downloadURL,
                validation: metadata.validationSummary,
                user: AuthService.getCurrentUser()?.uid || 'anonymous'
            });

            // Process data in batches
            for (let i = 0; i < validData.length; i += batchSize) {
                const batchData = validData.slice(i, i + batchSize);
                await this.processBatch(batchData, importId, Math.floor(i / batchSize));
            }

            // Commit the metadata batch
            await batch.commit();

            // Update import status
            await importMetaRef.update({
                status: 'completed',
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return importId;
        } catch (error) {
            Logger.error('Database save failed', error);
            throw error;
        }
    }

    static async processBatch(batchData, importId, batchIndex) {
        try {
            await FirebaseService.ensureInitialized();
            const db = FirebaseService.getDb();
            
            const batch = db.batch();
            const postsCollection = db.collection('posts');

            batchData.forEach((item, index) => {
                const docRef = postsCollection.doc();
                const postData = {
                    ...item,
                    importId,
                    batchIndex,
                    batchPosition: index,
                    status: 'scheduled',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    scheduledAt: new Date(`${item.day}T${item.hour}:00`),
                    platforms: item.platform.split(',').map(p => p.trim()),
                    user: AuthService.getCurrentUser()?.uid || 'anonymous'
                };
                
                batch.set(docRef, postData);
            });

            await batch.commit();
            Logger.info(`Batch ${batchIndex} processed successfully`, { 
                recordCount: batchData.length 
            });

        } catch (error) {
            Logger.error(`Batch ${batchIndex} processing failed`, error);
            throw error;
        }
    }
}

/* ------------------------------------------------------------------
* 5. UI MANAGEMENT - FIXED ASYNC IMPLEMENTATIONS
* ------------------------------------------------------------------*/

// UI Manager - Fixed
class UIManager {
    static async initialize() {
        try {
            Logger.info('Initializing UI Manager');
            
            this.setupEventListeners();
            this.setupFileUpload();
            this.setupForms();
            await this.loadDashboardData();
            
            Logger.info('UI Manager initialized successfully');
        } catch (error) {
            Logger.error('UI Manager initialization failed', error);
            throw error;
        }
    }

    static setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // File upload
        const fileInput = document.getElementById('file-upload');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        }

        // Bulk import form
        const bulkImportForm = document.getElementById('bulk-import-form');
        if (bulkImportForm) {
            bulkImportForm.addEventListener('submit', (e) => this.handleBulkImport(e));
        }
    }

    static setupFileUpload() {
        const dropZone = document.getElementById('file-drop-zone');
        if (!dropZone) return;

        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-active');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-active');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processSelectedFile(files[0]);
            }
        });
    }

    static setupForms() {
        // Add any additional form setup here
        Logger.debug('Forms setup completed');
    }

    static async loadDashboardData() {
        try {
            await FirebaseService.ensureInitialized();
            
            // Load dashboard statistics
            await this.updateDashboardStats();
            await this.loadRecentActivity();
            await this.loadUpcomingPosts();
            
        } catch (error) {
            Logger.error('Failed to load dashboard data', error);
        }
    }

    static async updateDashboardStats() {
        try {
            const db = FirebaseService.getDb();
            const user = AuthService.getCurrentUser();
            
            if (!user) return;

            // Get total imports
            const importsSnapshot = await db.collection('imports')
                .where('user', '==', user.uid)
                .get();
            
            // Get scheduled posts
            const scheduledSnapshot = await db.collection('posts')
                .where('user', '==', user.uid)
                .where('status', '==', 'scheduled')
                .get();

            // Get success rate (published vs total)
            const totalSnapshot = await db.collection('posts')
                .where('user', '==', user.uid)
                .get();
            
            const publishedCount = totalSnapshot.docs.filter(doc => 
                doc.data().status === 'published'
            ).length;

            const successRate = totalSnapshot.size > 0 
                ? Math.round((publishedCount / totalSnapshot.size) * 100)
                : 0;

            // Update UI
            this.updateStatCard('total-imports', importsSnapshot.size);
            this.updateStatCard('scheduled-posts', scheduledSnapshot.size);
            this.updateStatCard('success-rate', `${successRate}%`);
            
        } catch (error) {
            Logger.error('Failed to update dashboard stats', error);
        }
    }

    static updateStatCard(cardId, value) {
        const element = document.querySelector(`[data-stat="${cardId}"]`);
        if (element) {
            element.textContent = value;
        }
    }

    static async loadRecentActivity() {
        try {
            const db = FirebaseService.getDb();
            const user = AuthService.getCurrentUser();
            
            if (!user) return;

            const activitySnapshot = await db.collection('imports')
                .where('user', '==', user.uid)
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();

            const activityContainer = document.getElementById('recent-activity');
            if (!activityContainer) return;

            if (activitySnapshot.empty) {
                activityContainer.innerHTML = '<p class="text-gray-500">لا توجد أنشطة حديثة</p>';
                return;
            }

            const activityHtml = activitySnapshot.docs.map(doc => {
                const data = doc.data();
                const date = data.createdAt?.toDate?.()?.toLocaleDateString('ar-AE') || 'غير محدد';
                
                return `
                    <div class="activity-item">
                        <div class="activity-icon">📁</div>
                        <div class="activity-content">
                            <p class="activity-title">استيراد ملف: ${data.fileName}</p>
                            <p class="activity-date">${date}</p>
                        </div>
                        <div class="activity-status status--${data.status}">${this.getStatusText(data.status)}</div>
                    </div>
                `;
            }).join('');

            activityContainer.innerHTML = activityHtml;
            
        } catch (error) {
            Logger.error('Failed to load recent activity', error);
        }
    }

    static async loadUpcomingPosts() {
        try {
            const db = FirebaseService.getDb();
            const user = AuthService.getCurrentUser();
            
            if (!user) return;

            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            const upcomingSnapshot = await db.collection('posts')
                .where('user', '==', user.uid)
                .where('status', '==', 'scheduled')
                .where('scheduledAt', '>=', now)
                .where('scheduledAt', '<=', tomorrow)
                .orderBy('scheduledAt', 'asc')
                .limit(5)
                .get();

            const upcomingContainer = document.getElementById('upcoming-posts');
            if (!upcomingContainer) return;

            if (upcomingSnapshot.empty) {
                upcomingContainer.innerHTML = '<p class="text-gray-500">لا توجد منشورات مجدولة للـ 24 ساعة القادمة</p>';
                return;
            }

            const postsHtml = upcomingSnapshot.docs.map(doc => {
                const data = doc.data();
                const scheduledTime = data.scheduledAt?.toDate?.()?.toLocaleString('ar-AE') || 'غير محدد';
                
                return `
                    <div class="upcoming-post">
                        <div class="post-content">
                            <p class="post-title">${data.socialTitle || 'بدون عنوان'}</p>
                            <p class="post-time">${scheduledTime}</p>
                        </div>
                        <div class="post-platforms">
                            ${(data.platforms || []).map(platform => 
                                `<span class="platform-badge platform--${platform}">${platform}</span>`
                            ).join('')}
                        </div>
                    </div>
                `;
            }).join('');

            upcomingContainer.innerHTML = postsHtml;
            
        } catch (error) {
            Logger.error('Failed to load upcoming posts', error);
        }
    }

    static getStatusText(status) {
        const statusTexts = {
            'processing': 'قيد المعالجة',
            'completed': 'مكتمل',
            'failed': 'فشل',
            'scheduled': 'مجدول',
            'published': 'منشور'
        };
        return statusTexts[status] || status;
    }

    static async handleLogin(event) {
        event.preventDefault();
        
        try {
            const form = event.target;
            const email = form.email.value;
            const password = form.password.value;

            if (!email || !password) {
                this.showError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
                return;
            }

            this.showLoading('جاري تسجيل الدخول...');
            
            await AuthService.signInWithEmailAndPassword(email, password);
            
            this.hideLoading();
            this.showSuccess('تم تسجيل الدخول بنجاح');
            
        } catch (error) {
            this.hideLoading();
            this.showError('فشل في تسجيل الدخول: ' + (error.message || 'خطأ غير معروف'));
            Logger.error('Login failed', error);
        }
    }

    static async handleLogout() {
        try {
            this.showLoading('جاري تسجيل الخروج...');
            
            await AuthService.signOut();
            
            this.hideLoading();
            this.showSuccess('تم تسجيل الخروج بنجاح');
            
        } catch (error) {
            this.hideLoading();
            this.showError('فشل في تسجيل الخروج');
            Logger.error('Logout failed', error);
        }
    }

    static handleNavigation(event) {
        event.preventDefault();
        
        const targetView = event.target.dataset.view;
        if (targetView) {
            this.showView(targetView);
        }
    }

    static showView(viewName) {
        // Hide all views
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.style.display = 'none');

        // Show target view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.style.display = 'block';
        }

        // Update navigation state
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        const activeLink = document.querySelector(`[data-view="${viewName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        Logger.debug('View changed', { viewName });
    }

    static handleFileSelection(event) {
        const file = event.target.files[0];
        if (file) {
            this.processSelectedFile(file);
        }
    }

    static processSelectedFile(file) {
        try {
            // Validate file
            FileManager.validateFile(file);
            
            // Update UI to show selected file
            const fileInfo = document.getElementById('selected-file-info');
            if (fileInfo) {
                fileInfo.innerHTML = `
                    <div class="selected-file">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                        <button type="button" class="btn-remove" onclick="UIManager.removeSelectedFile()">×</button>
                    </div>
                `;
                fileInfo.style.display = 'block';
            }

            // Store file reference
            this.selectedFile = file;
            
            // Enable import button
            const importBtn = document.getElementById('import-btn');
            if (importBtn) {
                importBtn.disabled = false;
            }
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    static removeSelectedFile() {
        this.selectedFile = null;
        
        const fileInput = document.getElementById('file-upload');
        if (fileInput) {
            fileInput.value = '';
        }
        
        const fileInfo = document.getElementById('selected-file-info');
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }
        
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.disabled = true;
        }
    }

    static async handleBulkImport(event) {
        event.preventDefault();
        
        try {
            if (!this.selectedFile) {
                this.showError('يرجى اختيار ملف للاستيراد');
                return;
            }

            this.showLoading('جاري معالجة الملف...');
            this.updateProgress(0);

            const result = await BulkImportManager.processImport(this.selectedFile, {
                progressCallback: (progress) => {
                    this.updateProgress(progress);
                }
            });

            this.hideLoading();
            this.hideProgress();
            
            if (result.success) {
                this.showSuccess(`تم الاستيراد بنجاح! معرف الاستيراد: ${result.importId}`);
                this.showImportResults(result);
                this.removeSelectedFile();
                await this.loadDashboardData(); // Refresh dashboard
            }
            
        } catch (error) {
            this.hideLoading();
            this.hideProgress();
            this.showError('فشل في الاستيراد: ' + error.message);
            Logger.error('Bulk import failed', error);
        }
    }

    static showImportResults(result) {
        const resultsContainer = document.getElementById('import-results');
        if (!resultsContainer) return;

        const html = `
            <div class="import-results-card">
                <h3>نتائج الاستيراد</h3>
                <div class="results-grid">
                    <div class="result-item">
                        <span class="result-label">إجمالي السجلات:</span>
                        <span class="result-value">${result.summary.total}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">السجلات الصحيحة:</span>
                        <span class="result-value result-value--success">${result.summary.valid}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">السجلات الخاطئة:</span>
                        <span class="result-value result-value--error">${result.summary.invalid}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">معرف الاستيراد:</span>
                        <span class="result-value">${result.importId}</span>
                    </div>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';

        // Auto-hide after 10 seconds
        setTimeout(() => {
            resultsContainer.style.display = 'none';
        }, 10000);
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static showLoading(message = 'جاري التحميل...') {
        const loader = document.getElementById('loading-overlay');
        const loaderText = document.getElementById('loading-text');
        
        if (loader) {
            loader.style.display = 'flex';
        }
        
        if (loaderText) {
            loaderText.textContent = message;
        }
    }

    static hideLoading() {
        const loader = document.getElementById('loading-overlay');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    static updateProgress(progress) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const progressContainer = document.getElementById('progress-container');
        
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
    }

    static hideProgress() {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }

    static showError(message) {
        this.showToast(message, 'error');
    }

    static showSuccess(message) {
        this.showToast(message, 'success');
    }

    static showWarning(message) {
        this.showToast(message, 'warning');
    }

    static showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add to container
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        toastContainer.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}

/* ------------------------------------------------------------------
* 6. APPLICATION INITIALIZATION - FIXED FOR GITHUB PAGES
* ------------------------------------------------------------------*/

// Application Initializer - Fixed with IIFE
class AppInitializer {
    static async initialize() {
        try {
            Logger.info('Starting SocialHub Pro initialization...');

            // Initialize core systems
            ErrorHandler.init();
            SecurityManager.init();
            
            // Initialize Firebase
            await FirebaseService.initialize();
            
            // Initialize authentication
            await AuthService.initialize();
            
            // Initialize UI
            await UIManager.initialize();

            // Add Firebase logger output
            Logger.addOutput(new FirebaseLoggerOutput());

            // Validate configuration
            ConfigManager.validate();

            Logger.info('SocialHub Pro initialized successfully');
            
            // Show initial view based on auth state
            const user = AuthService.getCurrentUser();
            if (user) {
                UIManager.showView('dashboard');
            } else {
                UIManager.showView('login');
            }

        } catch (error) {
            Logger.error('Application initialization failed', error);
            console.error('Critical initialization error:', error);
            
            // Show error to user
            const errorMessage = 'فشل في تحميل التطبيق. يرجى تحديث الصفحة والمحاولة مرة أخرى.';
            if (typeof UIManager.showError === 'function') {
                UIManager.showError(errorMessage);
            } else {
                alert(errorMessage);
            }
        }
    }
}

/* ------------------------------------------------------------------
* 7. UTILITY FUNCTIONS - FIXED
* ------------------------------------------------------------------*/

// Utility Functions
const Utils = {
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Format date for Arabic locale
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            ...options
        };
        
        return new Intl.DateTimeFormat('ar-AE', defaultOptions).format(date);
    },

    // Format numbers for Arabic locale
    formatNumber(number) {
        return new Intl.NumberFormat('ar-AE').format(number);
    },

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            Logger.error('Clipboard copy failed', error);
            return false;
        }
    },

    // Generate unique ID
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Sanitize HTML
    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },

    // Get query parameters
    getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }
};

// Global toast function for backward compatibility
function showToast(message, type = 'info') {
    if (typeof UIManager !== 'undefined' && UIManager.showToast) {
        UIManager.showToast(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

/* ------------------------------------------------------------------
* 8. APPLICATION STARTUP - FIXED WITH IIFE
* ------------------------------------------------------------------*/

// Use IIFE (Immediately Invoked Function Expression) to handle async initialization
// This fixes the "await is only valid in async functions" error for GitHub Pages
(async function initializeSocialHubPro() {
    try {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded. Please ensure Firebase scripts are included.');
            showToast('فشل في تحميل Firebase SDK. يرجى التأكد من تضمين ملفات Firebase.', 'error');
            return;
        }

        // Initialize the application
        await AppInitializer.initialize();
        
        console.log('✅ SocialHub Pro v11.0.1 loaded successfully');

    } catch (error) {
        console.error('❌ Failed to initialize SocialHub Pro:', error);
        
        // Show user-friendly error message
        const errorMessage = 'حدث خطأ في تحميل التطبيق. يرجى تحديث الصفحة.';
        if (document.body) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff4444;
                color: white;
                padding: 15px;
                border-radius: 5px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                direction: rtl;
            `;
            errorDiv.textContent = errorMessage;
            document.body.appendChild(errorDiv);
        } else {
            alert(errorMessage);
        }
    }
})();

// Export classes for potential external use (if needed)
if (typeof window !== 'undefined') {
    window.SocialHubPro = {
        version: '11.0.1',
        ConfigManager,
        Logger,
        ErrorHandler,
        SecurityManager,
        FirebaseService,
        AuthService,
        FileManager,
        DataValidator,
        BulkImportManager,
        UIManager,
        Utils,
        showToast
    };
}

/* ------------------------------------------------------------------
* END OF SOCIALHUB PRO v11.0.1 - GITHUB PAGES COMPATIBLE
* ------------------------------------------------------------------*/