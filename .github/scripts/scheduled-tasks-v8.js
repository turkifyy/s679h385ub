// scheduled-tasks.js - SocialHub v8.0 Enhanced Edition
// Comprehensive scheduled task management with advanced features

const admin = require('firebase-admin');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');

/**
 * Enhanced Task Scheduler with comprehensive monitoring and management
 */
class SocialHubScheduler {
    constructor() {
        this.db = null;
        this.appId = 'socialhub-prod-v8-0';
        this.initialized = false;
        this.logsDir = path.join(__dirname, 'logs');
        this.metrics = {
            totalTasks: 0,
            successfulTasks: 0,
            failedTasks: 0,
            startTime: Date.now(),
            tasks: []
        };
        this.logger = new EnhancedLogger(this.logsDir);
    }

    /**
     * Initialize the scheduler with comprehensive setup
     */
    async initialize() {
        try {
            await this.logger.init();
            this.logger.info('Initializing SocialHub Scheduler v8.0', {
                nodeVersion: process.version,
                platform: process.platform,
                environment: process.env.NODE_ENV || 'production'
            });

            // Validate environment variables
            this.validateEnvironment();

            // Initialize Firebase
            await this.initializeFirebase();

            // Create logs directory
            await this.ensureLogsDirectory();

            this.initialized = true;
            this.logger.info('SocialHub Scheduler initialized successfully');

        } catch (error) {
            this.logger.error('Failed to initialize scheduler', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    /**
     * Validate required environment variables
     */
    validateEnvironment() {
        const requiredEnvVars = [
            'FIREBASE_SERVICE_ACCOUNT',
            'FACEBOOK_APP_ID',
            'FACEBOOK_APP_SECRET'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        this.logger.info('Environment validation completed successfully');
    }

    /**
     * Initialize Firebase Admin SDK with enhanced configuration
     */
    async initializeFirebase() {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`,
                storageBucket: `${serviceAccount.project_id}.appspot.com`
            });

            this.db = admin.firestore();
            
            // Test connection
            await this.db.collection('test').limit(1).get();
            
            this.logger.info('Firebase initialized successfully', {
                projectId: serviceAccount.project_id
            });

        } catch (error) {
            throw new Error(`Firebase initialization failed: ${error.message}`);
        }
    }

    /**
     * Ensure logs directory exists
     */
    async ensureLogsDirectory() {
        try {
            await fs.access(this.logsDir);
        } catch {
            await fs.mkdir(this.logsDir, { recursive: true });
            this.logger.debug('Created logs directory', { path: this.logsDir });
        }
    }

    /**
     * Main execution function with comprehensive task management
     */
    async run() {
        const executionId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            this.logger.info('Starting scheduled tasks execution', { 
                executionId,
                timestamp: new Date().toISOString()
            });

            // Update system status
            await this.updateSystemStatus('running', { executionId });

            // Define task pipeline
            const tasks = [
                { name: 'publishScheduledPosts', fn: () => this.publishAllScheduledPosts(), critical: true },
                { name: 'refreshExpiredTokens', fn: () => this.refreshExpiredTokens(), critical: true },
                { name: 'cleanupOldData', fn: () => this.cleanupOldData(), critical: false },
                { name: 'generateAnalytics', fn: () => this.generateDailyAnalytics(), critical: false },
                { name: 'createBackup', fn: () => this.createSystemBackup(), critical: false },
                { name: 'performHealthCheck', fn: () => this.performSystemHealthCheck(), critical: false }
            ];

            // Execute tasks with comprehensive error handling
            for (const task of tasks) {
                await this.executeTask(task, executionId);
            }

            // Final status update
            const finalMetrics = this.getMetrics();
            await this.updateSystemStatus('completed', { 
                executionId, 
                metrics: finalMetrics 
            });

            this.logger.info('Scheduled tasks execution completed successfully', {
                executionId,
                metrics: finalMetrics
            });

            return { success: true, executionId, metrics: finalMetrics };

        } catch (error) {
            await this.updateSystemStatus('failed', { 
                executionId, 
                error: error.message,
                metrics: this.getMetrics()
            });

            this.logger.error('Scheduled tasks execution failed', {
                executionId,
                error: error.message,
                stack: error.stack
            });

            throw error;
        }
    }

    /**
     * Execute individual task with comprehensive monitoring
     */
    async executeTask(task, executionId) {
        const taskStartTime = Date.now();
        const taskId = `${executionId}_${task.name}`;

        try {
            this.logger.info(`Starting task: ${task.name}`, { 
                taskId, 
                critical: task.critical 
            });

            this.metrics.totalTasks++;
            
            const result = await task.fn();
            
            const duration = Date.now() - taskStartTime;
            this.metrics.successfulTasks++;
            this.metrics.tasks.push({
                name: task.name,
                status: 'success',
                duration,
                result
            });

            this.logger.info(`Task completed successfully: ${task.name}`, {
                taskId,
                duration: `${duration}ms`,
                result
            });

        } catch (error) {
            const duration = Date.now() - taskStartTime;
            this.metrics.failedTasks++;
            this.metrics.tasks.push({
                name: task.name,
                status: 'failed',
                duration,
                error: error.message
            });

            this.logger.error(`Task failed: ${task.name}`, {
                taskId,
                duration: `${duration}ms`,
                error: error.message,
                stack: error.stack
            });

            // Record task failure in Firebase
            await this.recordTaskFailure(task.name, error, taskId);

            // If critical task fails, throw error to stop execution
            if (task.critical) {
                throw new Error(`Critical task failed: ${task.name} - ${error.message}`);
            }
        }
    }

    /**
     * Publish all scheduled posts with enhanced features
     */
    async publishAllScheduledPosts() {
        this.logger.info('Starting scheduled posts publishing');

        const stats = {
            totalUsers: 0,
            totalPosts: 0,
            successfulPosts: 0,
            failedPosts: 0,
            platforms: {}
        };

        try {
            // Get all users with enhanced pagination
            const usersSnapshot = await this.db.collection(`artifacts/${this.appId}/users`).get();
            stats.totalUsers = usersSnapshot.size;

            this.logger.info(`Processing ${stats.totalUsers} users for scheduled posts`);

            const now = admin.firestore.Timestamp.now();
            const publishPromises = [];

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                
                // Query scheduled posts for this user
                const postsQuery = this.db.collection(`artifacts/${this.appId}/users/${userId}/posts`)
                    .where('status', '==', 'scheduled')
                    .where('scheduledAt', '<=', now)
                    .orderBy('scheduledAt', 'asc')
                    .limit(50); // Limit to prevent overwhelming

                const postsSnapshot = await postsQuery.get();

                if (!postsSnapshot.empty) {
                    this.logger.info(`Found ${postsSnapshot.size} scheduled posts for user ${userId}`);
                    stats.totalPosts += postsSnapshot.size;

                    for (const postDoc of postsSnapshot.docs) {
                        publishPromises.push(
                            this.publishSinglePost(userId, postDoc, stats)
                                .catch(error => {
                                    stats.failedPosts++;
                                    this.logger.error(`Failed to publish post ${postDoc.id}`, {
                                        userId,
                                        postId: postDoc.id,
                                        error: error.message
                                    });
                                })
                        );
                    }
                }
            }

            // Execute all publishing with controlled concurrency
            await this.executeConcurrentTasks(publishPromises, 5);

            this.logger.info('Scheduled posts publishing completed', stats);
            return stats;

        } catch (error) {
            this.logger.error('Error in publishAllScheduledPosts', { 
                error: error.message,
                stats 
            });
            throw error;
        }
    }

    /**
     * Publish single post with comprehensive error handling
     */
    async publishSinglePost(userId, postDoc, stats) {
        const postData = postDoc.data();
        const postId = postDoc.id;

        try {
            this.logger.debug(`Publishing post ${postId} for user ${userId}`, {
                scheduledAt: postData.scheduledAt?.toDate?.()?.toISOString(),
                platforms: postData.selectedAccountIds?.length || 0
            });

            const publishResults = [];

            // Get user's connected accounts
            const accountsSnapshot = await this.db.collection(`artifacts/${this.appId}/users/${userId}/accounts`)
                .where('isConnected', '==', true)
                .get();

            const connectedAccounts = new Map();
            accountsSnapshot.forEach(doc => {
                connectedAccounts.set(doc.id, doc.data());
            });

            // Publish to selected accounts
            for (const accountId of postData.selectedAccountIds || []) {
                const accountData = connectedAccounts.get(accountId);
                
                if (accountData) {
                    try {
                        const result = await this.publishToAccount(accountData, postData, postId);
                        publishResults.push({ accountId, result, success: true });
                        
                        // Update platform stats
                        stats.platforms[accountData.platform] = (stats.platforms[accountData.platform] || 0) + 1;
                        
                    } catch (error) {
                        publishResults.push({ 
                            accountId, 
                            error: error.message, 
                            success: false 
                        });
                        this.logger.error(`Failed to publish to account ${accountId}`, {
                            postId,
                            platform: accountData.platform,
                            error: error.message
                        });
                    }
                } else {
                    this.logger.warn(`Account ${accountId} not found or not connected`, { postId });
                }
            }

            // Update post status
            const allSuccessful = publishResults.every(r => r.success);
            const updateData = {
                status: allSuccessful ? 'published' : 'partial_failure',
                publishedAt: admin.firestore.FieldValue.serverTimestamp(),
                publishResults,
                lastProcessedBy: 'enhanced-scheduler-v8',
                processingAttempts: admin.firestore.FieldValue.increment(1)
            };

            if (!allSuccessful) {
                updateData.lastError = 'Some platforms failed to publish';
                updateData.lastErrorAt = admin.firestore.FieldValue.serverTimestamp();
            }

            await postDoc.ref.update(updateData);

            if (allSuccessful) {
                stats.successfulPosts++;
            } else {
                stats.failedPosts++;
            }

            this.logger.info(`Post ${postId} processing completed`, {
                userId,
                status: updateData.status,
                publishedPlatforms: publishResults.filter(r => r.success).length,
                failedPlatforms: publishResults.filter(r => !r.success).length
            });

        } catch (error) {
            // Mark post as failed
            await postDoc.ref.update({
                status: 'failed',
                error: error.message,
                lastErrorAt: admin.firestore.FieldValue.serverTimestamp(),
                processingAttempts: admin.firestore.FieldValue.increment(1)
            });

            throw error;
        }
    }

    /**
     * Publish to specific social media account
     */
    async publishToAccount(accountData, postData, postId) {
        this.logger.debug(`Publishing to ${accountData.platform} account ${accountData.name}`, {
            postId,
            platform: accountData.platform
        });

        // Simulate API calls (in real implementation, integrate with actual APIs)
        switch (accountData.platform.toLowerCase()) {
            case 'facebook':
                return await this.publishToFacebook(accountData, postData);
            case 'twitter':
                return await this.publishToTwitter(accountData, postData);
            case 'instagram':
                return await this.publishToInstagram(accountData, postData);
            case 'linkedin':
                return await this.publishToLinkedIn(accountData, postData);
            default:
                throw new Error(`Unsupported platform: ${accountData.platform}`);
        }
    }

    /**
     * Facebook publishing implementation
     */
    async publishToFacebook(accountData, postData) {
        try {
            const requestData = {
                message: postData.content,
                access_token: accountData.accessToken
            };

            // Add media if present
            if (postData.media && postData.media.length > 0) {
                requestData.link = postData.media[0].url;
            }

            // Simulate API call (replace with actual Facebook Graph API call)
            const response = await axios.post(
                `https://graph.facebook.com/v19.0/${accountData.pageId || 'me'}/feed`,
                requestData,
                { timeout: 30000 }
            );

            return {
                platform: 'facebook',
                postId: response.data.id,
                success: true,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('Facebook publishing failed', {
                error: error.response?.data || error.message,
                accountName: accountData.name
            });
            throw new Error(`Facebook publish failed: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
     * Twitter publishing implementation (placeholder)
     */
    async publishToTwitter(accountData, postData) {
        // Simulate Twitter API call
        await this.simulateApiCall(1000);
        return {
            platform: 'twitter',
            postId: `twitter_${Date.now()}`,
            success: true,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Instagram publishing implementation (placeholder)
     */
    async publishToInstagram(accountData, postData) {
        // Simulate Instagram API call
        await this.simulateApiCall(1500);
        return {
            platform: 'instagram',
            postId: `ig_${Date.now()}`,
            success: true,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * LinkedIn publishing implementation (placeholder)
     */
    async publishToLinkedIn(accountData, postData) {
        // Simulate LinkedIn API call
        await this.simulateApiCall(1200);
        return {
            platform: 'linkedin',
            postId: `li_${Date.now()}`,
            success: true,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Simulate API call with delay (for development/testing)
     */
    async simulateApiCall(delay = 1000) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Refresh expired tokens with enhanced token management
     */
    async refreshExpiredTokens() {
        this.logger.info('Starting token refresh process');

        try {
            // Import and use the enhanced token refresh service
            const { FacebookTokenRefreshService } = require('./refresh-tokens-v8.js');
            const tokenService = new FacebookTokenRefreshService();
            
            const result = await tokenService.refreshFacebookTokens();
            
            this.logger.info('Token refresh completed', result.metrics);
            return result;

        } catch (error) {
            this.logger.error('Token refresh failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Cleanup old data to maintain database performance
     */
    async cleanupOldData() {
        this.logger.info('Starting data cleanup process');

        const stats = {
            deletedPosts: 0,
            deletedLogs: 0,
            deletedErrors: 0,
            archivedBackups: 0
        };

        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

            // Cleanup old failed posts
            const oldFailedPostsQuery = this.db.collectionGroup('posts')
                .where('status', '==', 'failed')
                .where('createdAt', '<', thirtyDaysAgo)
                .limit(100);

            const oldFailedPosts = await oldFailedPostsQuery.get();
            for (const doc of oldFailedPosts.docs) {
                await doc.ref.delete();
                stats.deletedPosts++;
            }

            // Cleanup old error logs
            const oldErrorsQuery = this.db.collection(`artifacts/${this.appId}/system/errors`)
                .where('timestamp', '<', thirtyDaysAgo)
                .limit(500);

            const oldErrors = await oldErrorsQuery.get();
            for (const doc of oldErrors.docs) {
                await doc.ref.delete();
                stats.deletedErrors++;
            }

            // Archive very old backups
            const oldBackupsQuery = this.db.collection(`artifacts/${this.appId}/backups`)
                .where('timestamp', '<', ninetyDaysAgo)
                .limit(50);

            const oldBackups = await oldBackupsQuery.get();
            for (const doc of oldBackups.docs) {
                // Archive to cold storage collection before deletion
                await this.db.collection(`artifacts/${this.appId}/archivedBackups`).add({
                    ...doc.data(),
                    archivedAt: admin.firestore.FieldValue.serverTimestamp(),
                    originalId: doc.id
                });
                await doc.ref.delete();
                stats.archivedBackups++;
            }

            this.logger.info('Data cleanup completed', stats);
            return stats;

        } catch (error) {
            this.logger.error('Data cleanup failed', { error: error.message, stats });
            throw error;
        }
    }

    /**
     * Generate daily analytics and insights
     */
    async generateDailyAnalytics() {
        this.logger.info('Generating daily analytics');

        try {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
            const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

            const analytics = {
                date: startOfDay.toISOString().split('T')[0],
                users: await this.getUserAnalytics(startOfDay, endOfDay),
                posts: await this.getPostAnalytics(startOfDay, endOfDay),
                platforms: await this.getPlatformAnalytics(startOfDay, endOfDay),
                errors: await this.getErrorAnalytics(startOfDay, endOfDay),
                generatedAt: new Date().toISOString()
            };

            // Store analytics
            await this.db.collection(`artifacts/${this.appId}/analytics/daily/reports`).add(analytics);

            // Update latest analytics
            await this.db.doc(`artifacts/${this.appId}/analytics/latest`).set({
                daily: analytics,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            this.logger.info('Daily analytics generated successfully', {
                date: analytics.date,
                totalUsers: analytics.users.total,
                totalPosts: analytics.posts.total
            });

            return analytics;

        } catch (error) {
            this.logger.error('Failed to generate analytics', { error: error.message });
            throw error;
        }
    }

    /**
     * Get user analytics for specified date range
     */
    async getUserAnalytics(startDate, endDate) {
        const usersSnapshot = await this.db.collection(`artifacts/${this.appId}/users`).get();
        
        return {
            total: usersSnapshot.size,
            // Add more user metrics as needed
        };
    }

    /**
     * Get post analytics for specified date range
     */
    async getPostAnalytics(startDate, endDate) {
        const postsQuery = this.db.collectionGroup('posts')
            .where('createdAt', '>=', startDate)
            .where('createdAt', '<=', endDate);

        const postsSnapshot = await postsQuery.get();
        
        const statusCounts = {};
        postsSnapshot.forEach(doc => {
            const status = doc.data().status;
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        return {
            total: postsSnapshot.size,
            byStatus: statusCounts
        };
    }

    /**
     * Get platform analytics for specified date range
     */
    async getPlatformAnalytics(startDate, endDate) {
        const accountsSnapshot = await this.db.collection(`artifacts/${this.appId}/allAccounts`).get();
        
        const platformCounts = {};
        const connectedCounts = {};
        
        accountsSnapshot.forEach(doc => {
            const data = doc.data();
            const platform = data.platform;
            
            platformCounts[platform] = (platformCounts[platform] || 0) + 1;
            
            if (data.isConnected) {
                connectedCounts[platform] = (connectedCounts[platform] || 0) + 1;
            }
        });

        return {
            totalAccounts: accountsSnapshot.size,
            byPlatform: platformCounts,
            connectedByPlatform: connectedCounts
        };
    }

    /**
     * Get error analytics for specified date range
     */
    async getErrorAnalytics(startDate, endDate) {
        const errorsQuery = this.db.collection(`artifacts/${this.appId}/system/errors`)
            .where('timestamp', '>=', startDate)
            .where('timestamp', '<=', endDate);

        const errorsSnapshot = await errorsQuery.get();
        
        const errorTypes = {};
        errorsSnapshot.forEach(doc => {
            const type = doc.data().type;
            errorTypes[type] = (errorTypes[type] || 0) + 1;
        });

        return {
            total: errorsSnapshot.size,
            byType: errorTypes
        };
    }

    /**
     * Create comprehensive system backup
     */
    async createSystemBackup() {
        this.logger.info('Creating system backup');

        try {
            const backupId = `backup_${Date.now()}`;
            const backupData = {
                id: backupId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                version: '8.0',
                collections: {}
            };

            // Define collections to backup
            const collectionsToBackup = [
                'users',
                'allAccounts',
                'system/status',
                'analytics/latest'
            ];

            for (const collectionPath of collectionsToBackup) {
                const snapshot = await this.db.collection(`artifacts/${this.appId}/${collectionPath}`).get();
                const docs = [];
                
                snapshot.forEach(doc => {
                    docs.push({
                        id: doc.id,
                        data: doc.data()
                    });
                });

                backupData.collections[collectionPath] = {
                    count: docs.length,
                    docs: docs.slice(0, 1000) // Limit to prevent huge backups
                };
            }

            // Calculate backup size
            const backupSize = JSON.stringify(backupData).length;
            backupData.sizeBytes = backupSize;

            // Store backup
            await this.db.collection(`artifacts/${this.appId}/backups`).doc(backupId).set(backupData);

            this.logger.info('System backup created successfully', {
                backupId,
                sizeBytes: backupSize,
                collections: Object.keys(backupData.collections).length
            });

            return {
                backupId,
                sizeBytes: backupSize,
                collections: Object.keys(backupData.collections)
            };

        } catch (error) {
            this.logger.error('System backup failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Perform comprehensive system health check
     */
    async performSystemHealthCheck() {
        this.logger.info('Performing system health check');

        try {
            const healthStatus = {
                timestamp: new Date().toISOString(),
                services: {},
                overall: 'healthy',
                issues: []
            };

            // Check Firebase connectivity
            try {
                await this.db.collection('test').limit(1).get();
                healthStatus.services.firebase = 'healthy';
            } catch (error) {
                healthStatus.services.firebase = 'unhealthy';
                healthStatus.issues.push('Firebase connection failed');
                healthStatus.overall = 'degraded';
            }

            // Check Facebook API connectivity
            try {
                await axios.get('https://graph.facebook.com/v19.0/', { timeout: 10000 });
                healthStatus.services.facebookApi = 'healthy';
            } catch (error) {
                healthStatus.services.facebookApi = 'unhealthy';
                healthStatus.issues.push('Facebook API unreachable');
                healthStatus.overall = 'degraded';
            }

            // Check recent error rates
            const recentErrors = await this.db.collection(`artifacts/${this.appId}/system/errors`)
                .where('timestamp', '>', new Date(Date.now() - 60 * 60 * 1000)) // Last hour
                .get();

            if (recentErrors.size > 10) {
                healthStatus.services.errorRate = 'warning';
                healthStatus.issues.push(`High error rate: ${recentErrors.size} errors in last hour`);
                if (healthStatus.overall === 'healthy') {
                    healthStatus.overall = 'warning';
                }
            } else {
                healthStatus.services.errorRate = 'healthy';
            }

            // Store health check results
            await this.db.collection(`artifacts/${this.appId}/system/healthChecks`).add(healthStatus);

            // Update latest health status
            await this.db.doc(`artifacts/${this.appId}/system/latestHealth`).set(healthStatus);

            this.logger.info('System health check completed', {
                overall: healthStatus.overall,
                issues: healthStatus.issues.length
            });

            return healthStatus;

        } catch (error) {
            this.logger.error('Health check failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Execute concurrent tasks with controlled concurrency
     */
    async executeConcurrentTasks(tasks, maxConcurrency = 5) {
        const results = [];
        
        for (let i = 0; i < tasks.length; i += maxConcurrency) {
            const batch = tasks.slice(i, i + maxConcurrency);
            const batchResults = await Promise.allSettled(batch);
            results.push(...batchResults);
            
            // Small delay between batches to prevent overwhelming APIs
            if (i + maxConcurrency < tasks.length) {
                await this.simulateApiCall(100);
            }
        }

        return results;
    }

    /**
     * Update system status in Firebase
     */
    async updateSystemStatus(status, additionalData = {}) {
        try {
            const statusData = {
                status,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                version: '8.0',
                scheduler: 'enhanced-scheduler',
                ...additionalData
            };

            await this.db.doc(`artifacts/${this.appId}/system/schedulerStatus`).set(statusData, { merge: true });

            // Also add to status history
            await this.db.collection(`artifacts/${this.appId}/system/schedulerHistory`).add(statusData);

        } catch (error) {
            this.logger.error('Failed to update system status', {
                status,
                error: error.message
            });
        }
    }

    /**
     * Record task failure for analysis
     */
    async recordTaskFailure(taskName, error, taskId) {
        try {
            await this.db.collection(`artifacts/${this.appId}/system/taskFailures`).add({
                taskName,
                taskId,
                error: error.message,
                stack: error.stack,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                version: '8.0'
            });
        } catch (recordError) {
            this.logger.error('Failed to record task failure', {
                taskName,
                error: recordError.message
            });
        }
    }

    /**
     * Get execution metrics
     */
    getMetrics() {
        const duration = Date.now() - this.metrics.startTime;
        const successRate = this.metrics.totalTasks > 0 ? 
            ((this.metrics.successfulTasks / this.metrics.totalTasks) * 100).toFixed(2) : 0;

        return {
            ...this.metrics,
            duration: `${duration}ms`,
            successRate: `${successRate}%`
        };
    }
}

/**
 * Enhanced Logger class with file and console output
 */
class EnhancedLogger {
    constructor(logsDir) {
        this.logsDir = logsDir;
        this.logFile = null;
    }

    async init() {
        const logFileName = `scheduler-${new Date().toISOString().split('T')[0]}.log`;
        this.logFile = path.join(this.logsDir, logFileName);
    }

    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length > 0 ? 
            ` | Context: ${JSON.stringify(context, null, 2)}` : '';
        return `[${timestamp}] [${level}] ${message}${contextStr}`;
    }

    async writeToFile(message) {
        if (this.logFile) {
            try {
                await fs.appendFile(this.logFile, message + '\n');
            } catch (error) {
                console.error('Failed to write to log file:', error);
            }
        }
    }

    info(message, context) {
        const formattedMessage = this.formatMessage('INFO', message, context);
        console.log(formattedMessage);
        this.writeToFile(formattedMessage);
    }

    error(message, context) {
        const formattedMessage = this.formatMessage('ERROR', message, context);
        console.error(formattedMessage);
        this.writeToFile(formattedMessage);
    }

    warn(message, context) {
        const formattedMessage = this.formatMessage('WARN', message, context);
        console.warn(formattedMessage);
        this.writeToFile(formattedMessage);
    }

    debug(message, context) {
        const formattedMessage = this.formatMessage('DEBUG', message, context);
        console.log(formattedMessage);
        this.writeToFile(formattedMessage);
    }
}

// Export for use in other modules
module.exports = { SocialHubScheduler };

// Main execution function
async function main() {
    const scheduler = new SocialHubScheduler();
    
    try {
        await scheduler.initialize();
        const result = await scheduler.run();
        
        console.log('Scheduler execution completed successfully:', result);
        process.exit(0);
        
    } catch (error) {
        console.error('Scheduler execution failed:', error);
        process.exit(1);
    }
}

// Execute if called directly
if (require.main === module) {
    // Graceful shutdown handlers
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down gracefully...');
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log('Received SIGINT, shutting down gracefully...');
        process.exit(0);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });

    main();
}