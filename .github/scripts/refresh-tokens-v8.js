// refresh-tokens.js - SocialHub v8.0 Enhanced Edition
// Enhanced with modern JavaScript, comprehensive logging, and robust error handling

const axios = require('axios');
const admin = require('firebase-admin');

/**
 * Enhanced logger with structured logging capabilities
 * Provides different log levels and formats for better debugging
 */
class Logger {
    constructor() {
        this.logLevels = {
            ERROR: 0,
            WARN: 1, 
            INFO: 2,
            DEBUG: 3
        };
        this.currentLevel = this.logLevels.INFO;
    }

    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length ? ` | Context: ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level}] ${message}${contextStr}`;
    }

    error(message, context) {
        if (this.currentLevel >= this.logLevels.ERROR) {
            console.error(this.formatMessage('ERROR', message, context));
        }
    }

    warn(message, context) {
        if (this.currentLevel >= this.logLevels.WARN) {
            console.warn(this.formatMessage('WARN', message, context));
        }
    }

    info(message, context) {
        if (this.currentLevel >= this.logLevels.INFO) {
            console.log(this.formatMessage('INFO', message, context));
        }
    }

    debug(message, context) {
        if (this.currentLevel >= this.logLevels.DEBUG) {
            console.log(this.formatMessage('DEBUG', message, context));
        }
    }
}

/**
 * Enhanced retry mechanism with exponential backoff
 * Provides robust handling of temporary failures
 */
class RetryHandler {
    constructor(maxRetries = 3, baseDelay = 1000, maxDelay = 30000) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
    }

    async executeWithRetry(operation, context = '') {
        let lastError;
        
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                logger.debug(`Attempting operation: ${context}`, { attempt: attempt + 1 });
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt === this.maxRetries) {
                    logger.error(`Operation failed after ${this.maxRetries + 1} attempts: ${context}`, {
                        error: error.message,
                        attempts: attempt + 1
                    });
                    throw error;
                }

                const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
                logger.warn(`Operation failed, retrying in ${delay}ms: ${context}`, {
                    attempt: attempt + 1,
                    error: error.message,
                    nextDelay: delay
                });

                await this.sleep(delay);
            }
        }

        throw lastError;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Configuration manager for centralized settings
 * Allows easy modification of application parameters
 */
class Config {
    constructor() {
        this.settings = {
            appId: 'socialhub-prod-v8-0',
            facebookApiVersion: 'v19.0', // Updated to latest version
            tokenExpirationThreshold: 24 * 60 * 60 * 1000, // 24 hours in ms
            rateLimitDelay: 1000, // 1 second between API calls
            batchSize: 10, // Process accounts in batches
            maxConcurrentRequests: 3
        };
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
    }
}

/**
 * Input validation utilities
 * Ensures data integrity and security
 */
class Validator {
    static validateEnvironmentVariables() {
        const required = ['FIREBASE_SERVICE_ACCOUNT', 'FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'];
        const missing = required.filter(env => !process.env[env]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        logger.info('Environment variables validated successfully');
        return true;
    }

    static validateAccountData(accountData) {
        const requiredFields = ['name', 'accessToken', 'userId'];
        const missingFields = requiredFields.filter(field => !accountData[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Invalid account data: missing fields ${missingFields.join(', ')}`);
        }

        return true;
    }

    static validateTokenResponse(response) {
        if (!response.data || !response.data.access_token) {
            throw new Error('Invalid token response: missing access_token');
        }

        if (!response.data.expires_in) {
            logger.warn('Token response missing expires_in field, using default');
        }

        return true;
    }
}

/**
 * Metrics collection for monitoring and analytics
 * Tracks performance and success rates
 */
class Metrics {
    constructor() {
        this.reset();
    }

    reset() {
        this.data = {
            totalAccounts: 0,
            processedAccounts: 0,
            successfulRefreshes: 0,
            failedRefreshes: 0,
            skippedAccounts: 0,
            startTime: Date.now(),
            errors: []
        };
    }

    increment(metric) {
        if (this.data.hasOwnProperty(metric)) {
            this.data[metric]++;
        }
    }

    addError(error, context) {
        this.data.errors.push({
            message: error.message,
            context,
            timestamp: Date.now()
        });
    }

    getReport() {
        const duration = Date.now() - this.data.startTime;
        return {
            ...this.data,
            duration,
            successRate: this.data.processedAccounts > 0 ? 
                (this.data.successfulRefreshes / this.data.processedAccounts * 100).toFixed(2) + '%' : '0%'
        };
    }
}

// Initialize global instances
const logger = new Logger();
const retryHandler = new RetryHandler();
const config = new Config();
const metrics = new Metrics();

/**
 * Enhanced Facebook Token Refresh Service
 * Handles token refresh with comprehensive error handling and logging
 */
class FacebookTokenRefreshService {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    /**
     * Initialize Firebase Admin SDK with enhanced error handling
     */
    async initialize() {
        try {
            logger.info('Initializing Firebase Admin SDK...');
            
            // Validate environment variables first
            Validator.validateEnvironmentVariables();

            // Parse and validate service account
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            
            if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
                throw new Error('Invalid Firebase service account: missing required fields');
            }

            // Initialize Firebase with enhanced configuration
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
            });

            this.db = admin.firestore();
            
            // Test Firebase connection
            await this.db.collection('test').limit(1).get();
            
            this.initialized = true;
            logger.info('Firebase Admin SDK initialized successfully', {
                projectId: serviceAccount.project_id
            });

        } catch (error) {
            logger.error('Failed to initialize Firebase Admin SDK', {
                error: error.message,
                stack: error.stack
            });
            throw new Error(`Firebase initialization failed: ${error.message}`);
        }
    }

    /**
     * Main function to refresh Facebook tokens with enhanced features
     */
    async refreshFacebookTokens() {
        try {
            logger.info('Starting Facebook token refresh process...', {
                version: 'v8.0',
                timestamp: new Date().toISOString()
            });

            // Ensure initialization
            if (!this.initialized) {
                await this.initialize();
            }

            // Reset metrics for this run
            metrics.reset();

            // Get Facebook accounts with enhanced filtering
            const accounts = await this.getFacebookAccounts();
            metrics.data.totalAccounts = accounts.length;

            if (accounts.length === 0) {
                logger.info('No Facebook accounts found that require token refresh');
                await this.recordSystemStatus('no_accounts');
                return { success: true, message: 'No accounts to process', metrics: metrics.getReport() };
            }

            logger.info(`Found ${accounts.length} Facebook accounts to process`);

            // Process accounts in batches to avoid overwhelming APIs
            const batchSize = config.get('batchSize');
            const results = [];

            for (let i = 0; i < accounts.length; i += batchSize) {
                const batch = accounts.slice(i, i + batchSize);
                logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(accounts.length / batchSize)}`, {
                    batchSize: batch.length,
                    totalRemaining: accounts.length - i
                });

                const batchResults = await Promise.allSettled(
                    batch.map(account => this.processAccount(account))
                );

                results.push(...batchResults);

                // Rate limiting between batches
                if (i + batchSize < accounts.length) {
                    await retryHandler.sleep(config.get('rateLimitDelay'));
                }
            }

            // Process results and update metrics
            this.processBatchResults(results);

            // Record final status
            const finalReport = metrics.getReport();
            await this.recordSystemStatus('completed', finalReport);

            logger.info('Facebook token refresh process completed', finalReport);

            return {
                success: true,
                message: 'Token refresh completed successfully',
                metrics: finalReport
            };

        } catch (error) {
            logger.error('Token refresh process failed', {
                error: error.message,
                stack: error.stack
            });

            const errorReport = metrics.getReport();
            await this.recordSystemStatus('failed', { error: error.message, ...errorReport });

            throw error;
        }
    }

    /**
     * Get Facebook accounts that need token refresh
     */
    async getFacebookAccounts() {
        return await retryHandler.executeWithRetry(async () => {
            logger.debug('Querying Facebook accounts from Firestore...');

            const accountsSnapshot = await this.db.collection(`artifacts/${config.get('appId')}/allAccounts`)
                .where('platform', '==', 'facebook')
                .where('isConnected', '==', true)
                .get();

            const accounts = [];
            const now = Date.now();
            const threshold = config.get('tokenExpirationThreshold');

            for (const doc of accountsSnapshot.docs) {
                const accountData = doc.data();
                
                try {
                    Validator.validateAccountData(accountData);

                    const expirationTime = accountData.tokenExpiration || 0;
                    const timeUntilExpiration = expirationTime - now;

                    // Only include accounts that need refresh (expiring within threshold)
                    if (timeUntilExpiration < threshold) {
                        accounts.push({
                            id: doc.id,
                            ref: doc.ref,
                            ...accountData,
                            timeUntilExpiration
                        });
                    }

                } catch (error) {
                    logger.warn(`Skipping invalid account ${doc.id}`, {
                        error: error.message,
                        accountId: doc.id
                    });
                    metrics.increment('skippedAccounts');
                }
            }

            logger.info(`Filtered ${accounts.length} accounts needing refresh from ${accountsSnapshot.size} total accounts`);
            return accounts;

        }, 'getFacebookAccounts');
    }

    /**
     * Process individual account token refresh
     */
    async processAccount(account) {
        const startTime = Date.now();
        
        try {
            logger.info(`Processing token refresh for account: ${account.name}`, {
                accountId: account.id,
                userId: account.userId,
                hoursUntilExpiration: Math.round(account.timeUntilExpiration / (60 * 60 * 1000))
            });

            metrics.increment('processedAccounts');

            // Refresh the token with retry mechanism
            const newTokenData = await this.refreshTokenWithFacebook(account);

            // Update account data in Firebase
            await this.updateAccountData(account, newTokenData);

            const duration = Date.now() - startTime;
            metrics.increment('successfulRefreshes');

            logger.info(`Successfully refreshed token for account: ${account.name}`, {
                accountId: account.id,
                duration: `${duration}ms`,
                newExpiresIn: newTokenData.expires_in
            });

            return {
                success: true,
                accountId: account.id,
                accountName: account.name,
                duration
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            metrics.increment('failedRefreshes');
            metrics.addError(error, { accountId: account.id, accountName: account.name });

            logger.error(`Failed to refresh token for account: ${account.name}`, {
                accountId: account.id,
                error: error.message,
                duration: `${duration}ms`
            });

            // Disable account on failure
            await this.disableAccount(account, error);

            throw error;
        }
    }

    /**
     * Refresh token using Facebook Graph API with enhanced error handling
     */
    async refreshTokenWithFacebook(account) {
        return await retryHandler.executeWithRetry(async () => {
            logger.debug(`Making token refresh request to Facebook API`, {
                accountId: account.id,
                apiVersion: config.get('facebookApiVersion')
            });

            const response = await axios.get(
                `https://graph.facebook.com/${config.get('facebookApiVersion')}/oauth/access_token`,
                {
                    params: {
                        grant_type: 'fb_exchange_token',
                        client_id: process.env.FACEBOOK_APP_ID,
                        client_secret: process.env.FACEBOOK_APP_SECRET,
                        fb_exchange_token: account.accessToken
                    },
                    timeout: 30000, // 30 second timeout
                    headers: {
                        'User-Agent': 'SocialHub-TokenRefresh/8.0'
                    }
                }
            );

            // Validate response
            Validator.validateTokenResponse(response);

            logger.debug(`Received token response from Facebook`, {
                accountId: account.id,
                hasAccessToken: !!response.data.access_token,
                expiresIn: response.data.expires_in
            });

            return response.data;

        }, `refreshTokenWithFacebook-${account.id}`);
    }

    /**
     * Update account data in Firebase with enhanced error handling
     */
    async updateAccountData(account, tokenData) {
        const newToken = tokenData.access_token;
        const expiresIn = tokenData.expires_in || (60 * 24 * 60 * 60); // Default 60 days if not provided
        const newExpirationTime = Date.now() + (expiresIn * 1000);

        const updateData = {
            accessToken: newToken,
            tokenExpiration: newExpirationTime,
            tokenExpirationDate: new Date(newExpirationTime),
            lastTokenRefresh: admin.firestore.FieldValue.serverTimestamp(),
            refreshCount: admin.firestore.FieldValue.increment(1),
            isConnected: true, // Re-enable if it was disabled
            connectionError: admin.firestore.FieldValue.delete(), // Clear any previous errors
            lastSuccessfulRefresh: admin.firestore.FieldValue.serverTimestamp()
        };

        // Update main account record
        await retryHandler.executeWithRetry(async () => {
            await account.ref.update(updateData);
        }, `updateMainAccount-${account.id}`);

        // Update user-specific account record
        if (account.userId) {
            await retryHandler.executeWithRetry(async () => {
                const userAccountRef = this.db.doc(
                    `artifacts/${config.get('appId')}/users/${account.userId}/accounts/${account.id}`
                );
                await userAccountRef.update(updateData);
            }, `updateUserAccount-${account.id}`);
        }

        logger.info(`Updated account data in Firebase`, {
            accountId: account.id,
            newExpirationTime: new Date(newExpirationTime).toISOString(),
            expiresInDays: Math.round(expiresIn / (24 * 60 * 60))
        });
    }

    /**
     * Disable account when token refresh fails
     */
    async disableAccount(account, error) {
        const disableData = {
            isConnected: false,
            connectionError: error.message,
            lastErrorAt: admin.firestore.FieldValue.serverTimestamp(),
            errorCount: admin.firestore.FieldValue.increment(1),
            lastFailedRefresh: admin.firestore.FieldValue.serverTimestamp()
        };

        try {
            await account.ref.update(disableData);

            if (account.userId) {
                const userAccountRef = this.db.doc(
                    `artifacts/${config.get('appId')}/users/${account.userId}/accounts/${account.id}`
                );
                await userAccountRef.update(disableData);
            }

            logger.warn(`Disabled account due to token refresh failure`, {
                accountId: account.id,
                accountName: account.name,
                error: error.message
            });

        } catch (updateError) {
            logger.error(`Failed to disable account after token refresh failure`, {
                accountId: account.id,
                originalError: error.message,
                updateError: updateError.message
            });
        }
    }

    /**
     * Process batch results and update metrics
     */
    processBatchResults(results) {
        let fulfilled = 0;
        let rejected = 0;

        for (const result of results) {
            if (result.status === 'fulfilled') {
                fulfilled++;
            } else {
                rejected++;
                logger.error(`Batch item failed`, {
                    error: result.reason?.message || 'Unknown error'
                });
            }
        }

        logger.info(`Batch processing completed`, {
            fulfilled,
            rejected,
            total: results.length
        });
    }

    /**
     * Record system status and metrics in Firebase
     */
    async recordSystemStatus(status, additionalData = {}) {
        try {
            const statusData = {
                status,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                version: 'v8.0',
                environment: process.env.NODE_ENV || 'production',
                ...additionalData
            };

            await this.db.collection(`artifacts/${config.get('appId')}/system/tokenRefreshStatus`).add(statusData);

            // Also update the latest status document
            await this.db.doc(`artifacts/${config.get('appId')}/system/latestTokenRefreshStatus`).set(statusData, { merge: true });

        } catch (error) {
            logger.error('Failed to record system status', {
                status,
                error: error.message
            });
        }
    }
}

// Export enhanced service for use in other modules
const tokenRefreshService = new FacebookTokenRefreshService();

/**
 * Main execution function with comprehensive error handling
 */
async function main() {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        logger.info('Starting Facebook token refresh execution', {
            executionId,
            nodeVersion: process.version,
            platform: process.platform,
            environment: process.env.NODE_ENV || 'production'
        });

        const result = await tokenRefreshService.refreshFacebookTokens();
        
        logger.info('Token refresh execution completed successfully', {
            executionId,
            result
        });

        return result;

    } catch (error) {
        logger.error('Token refresh execution failed', {
            executionId,
            error: error.message,
            stack: error.stack
        });

        // Exit with error code for process monitoring
        process.exit(1);
    }
}

// Enhanced module export with additional utilities
module.exports = {
    FacebookTokenRefreshService,
    refreshFacebookTokens: () => tokenRefreshService.refreshFacebookTokens(),
    Logger,
    RetryHandler,
    Config,
    Validator,
    Metrics,
    main
};

// Execute if called directly with enhanced error handling
if (require.main === module) {
    // Handle process signals gracefully
    process.on('SIGTERM', () => {
        logger.info('Received SIGTERM signal, gracefully shutting down...');
        process.exit(0);
    });

    process.on('SIGINT', () => {
        logger.info('Received SIGINT signal, gracefully shutting down...');
        process.exit(0);
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at Promise', {
            promise: promise.toString(),
            reason: reason?.message || reason
        });
        process.exit(1);
    });

    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception thrown', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    });

    // Execute main function
    main().then(() => {
        logger.info('Process completed successfully');
        process.exit(0);
    }).catch((error) => {
        logger.error('Process failed', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    });
}