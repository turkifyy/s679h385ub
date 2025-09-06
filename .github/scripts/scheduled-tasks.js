const admin = require('firebase-admin');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// إنشاء مجلد للسجلات إذا لم يكن موجوداً
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mmkdirSync(logsDir, { recursive: true });
}

// تهيئة نظام التسجيل
const logFile = path.join(logsDir, `scheduler-${new Date().toISOString().split('T')[0]}.log`);

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  
  // التسجيل في الملف
  fs.appendFileSync(logFile, logMessage);
  
  // أيضًا التسجيل في console
  console.log(logMessage.trim());
}

// تهيئة Firebase
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  log('تم تهيئة Firebase بنجاح');
} catch (error) {
  log(`فشل تهيئة Firebase: ${error.message}`, 'ERROR');
  process.exit(1);
}

const db = admin.firestore();
const appId = 'socialhub-prod-v7-5';

async function main() {
  log('بدء تنفيذ المهام المجدولة لـ SocialHub');
  
  try {
    // تحديث حالة الخادم لتظهر للمستخدمين أنه نشط
    await db.doc(`artifacts/${appId}/system/status`).set({
      schedulerActive: true,
      lastRun: new Date(),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
      version: '7.5'
    }, { merge: true });

    // 1. نشر المنشورات المجدولة لجميع المستخدمين
    await publishAllScheduledPosts();
    
    // 2. تجديد التوكنات المنتهية
    await refreshExpiredTokens();
    
    // 3. النسخ الاحتياطي
    await createBackup();
    
    log('تم الانتهاء من جميع المهام المجدولة بنجاح');
    
  } catch (error) {
    log(`حدث خطأ في المهام المجدولة: ${error.message}`, 'ERROR');
    
    // تسجيل الخطأ في Firebase للإطلاع عليه لاحقاً
    try {
      await db.collection(`artifacts/${appId}/system/errors`).add({
        type: 'scheduled_tasks_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date()
      });
    } catch (dbError) {
      log(`فشل تسجيل الخطأ في Firebase: ${dbError.message}`, 'ERROR');
    }
  }
}

async function publishAllScheduledPosts() {
  log('بدء نشر المنشورات المجدولة');
  
  try {
    const usersSnapshot = await db.collection(`artifacts/${appId}/users`).get();
    log(`تم العثور على ${usersSnapshot.size} مستخدم`);
    
    let totalPublished = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const now = new Date();
      
      const postsQuery = db.collection(`artifacts/${appId}/users/${userId}/posts`)
        .where('status', '==', 'scheduled')
        .where('scheduledAt', '<=', now);
      
      const postsSnapshot = await postsQuery.get();
      
      if (!postsSnapshot.empty) {
        log(`وجد ${postsSnapshot.size} منشور مجدول للمستخدم ${userId}`);
        
        for (const postDoc of postsSnapshot.docs) {
          await publishPostForUser(userId, postDoc);
          totalPublished++;
        }
      }
    }
    
    log(`تم نشر ${totalPublished} منشور بنجاح`);
    
  } catch (error) {
    log(`خطأ في نشر المنشورات المجدولة: ${error.message}`, 'ERROR');
    throw error;
  }
}

async function publishPostForUser(userId, postDoc) {
  const postData = postDoc.data();
  
  try {
    log(`معالجة المنشور ${postDoc.id} للمستخدم ${userId}`);
    
    // النشر على جميع المنصات المتصلة
    for (const accountId of postData.selectedAccountIds || []) {
      const accountDoc = await db.doc(`artifacts/${appId}/users/${userId}/accounts/${accountId}`).get();
      
      if (accountDoc.exists() && accountDoc.data().isConnected) {
        await publishToPlatform(accountDoc.data(), postData);
        log(`تم النشر على الحساب ${accountId} للمنشور ${postDoc.id}`);
      }
    }
    
    // تحديث حالة المنشور
    await postDoc.ref.update({
      status: 'published',
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastProcessedBy: 'github-actions-scheduler'
    });
    
    log(`تم تحديث حالة المنشور ${postDoc.id} إلى "منشور"`);
    
  } catch (error) {
    log(`خطأ في نشر المنشور ${postDoc.id}: ${error.message}`, 'ERROR');
    
    // تحديث حالة المنشور إلى فاشل
    await postDoc.ref.update({
      status: 'failed',
      error: error.message,
      lastErrorAt: new Date()
    });
    
    throw error;
  }
}

async function publishToPlatform(accountData, postData) {
  // محاكاة عملية النشر (ستحتاج إلى التكامل مع واجهات برمجة التطبيقات الفعلية)
  log(`محاكاة النشر على ${accountData.platform} للحساب ${accountData.name}`);
  
  // إضافة تأخير لمحاكاة عملية النشر
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // في التطبيق الفعلي، هنا تكامل مع واجهات برمجة التطبيقات الخاصة بكل منصة
  return { success: true, message: 'تم النشر بنجاح' };
}

async function refreshExpiredTokens() {
  log('بدء تجديد التوكنات المنتهية الصلاحية');
  
  try {
    const accountsSnapshot = await db.collection(`artifacts/${appId}/allAccounts`)
      .where('isConnected', '==', true)
      .get();
    
    log(`تم العثور على ${accountsSnapshot.size} حساب متصل`);
    
    let totalRefreshed = 0;
    
    for (const doc of accountsSnapshot.docs) {
      const accountData = doc.data();
      const expirationTime = accountData.tokenExpiration || 0;
      
      // إذا بقي أقل من 24 ساعة على الانتهاء
      if (expirationTime - Date.now() < 24 * 60 * 60 * 1000) {
        log(`تجديد توكن الحساب ${accountData.name} (${accountData.platform})`);
        
        try {
          const newTokenData = await refreshToken(accountData);
          
          // تحديث البيانات في Firebase
          await doc.ref.update({
            accessToken: newTokenData.access_token,
            tokenExpiration: Date.now() + (newTokenData.expires_in * 1000),
            tokenExpirationDate: new Date(Date.now() + (newTokenData.expires_in * 1000)),
            lastTokenRefresh: new Date()
          });
          
          totalRefreshed++;
          log(`تم تجديد توكن الحساب ${accountData.name} بنجاح`);
          
        } catch (error) {
          log(`فشل تجديد توكن الحساب ${accountData.name}: ${error.message}`, 'ERROR');
          
          // تعطيل الحساب إذا فشل التجديد
          await doc.ref.update({
            isConnected: false,
            connectionError: error.message
          });
        }
      }
    }
    
    log(`تم تجديد ${totalRefreshed} توكن بنجاح`);
    
  } catch (error) {
    log(`خطأ في تجديد التوكنات: ${error.message}`, 'ERROR');
    throw error;
  }
}

async function refreshToken(accountData) {
  // محاكاة تجديد التوكن (ستحتاج إلى التكامل مع واجهات برمجة التطبيقات الفعلية)
  log(`محاكاة تجديد التوكن للحساب ${accountData.name}`);
  
  if (accountData.platform === 'facebook') {
    // تجديد توكن فيسبوك
    const response = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: accountData.accessToken
      }
    });
    
    return response.data;
  }
  
  // إضافة منصات أخرى هنا
  throw new Error(`منصة غير مدعومة: ${accountData.platform}`);
}

async function createBackup() {
  log('بدء إنشاء نسخة احتياطية');
  
  try {
    const backupData = {
      timestamp: new Date(),
      users: [],
      posts: [],
      accounts: []
    };
    
    // نسخ احتياطي للمستخدمين
    const usersSnapshot = await db.collection(`artifacts/${appId}/users`).get();
    usersSnapshot.forEach(doc => {
      backupData.users.push({ id: doc.id, ...doc.data() });
    });
    
    // نسخ احتياطي للمنشورات (آخر 1000 منشور)
    const postsQuery = db.collectionGroup('posts').orderBy('createdAt', 'desc').limit(1000);
    const postsSnapshot = await postsQuery.get();
    postsSnapshot.forEach(doc => {
      backupData.posts.push({ id: doc.id, ...doc.data() });
    });
    
    // نسخ احتياطي للحسابات
    const accountsSnapshot = await db.collection(`artifacts/${appId}/allAccounts`).get();
    accountsSnapshot.forEach(doc => {
      backupData.accounts.push({ id: doc.id, ...doc.data() });
    });
    
    // حفظ النسخة الاحتياطية في Firebase
    const backupRef = db.collection(`artifacts/${appId}/backups`).doc();
    await backupRef.set({
      ...backupData,
      size: JSON.stringify(backupData).length,
      createdBy: 'github-actions-scheduler'
    });
    
    log(`تم إنشاء نسخة احتياطية تحتوي على: ${backupData.users.length} مستخدم، ${backupData.posts.length} منشور، ${backupData.accounts.length} حساب`);
    
  } catch (error) {
    log(`خطأ في إنشاء النسخة الاحتياطية: ${error.message}`, 'ERROR');
    throw error;
  }
}

// تشغيل الوظيفة الرئيسية
main().catch(error => {
  log(`فشل تنفيذ المهام المجدولة: ${error.message}`, 'ERROR');
  process.exit(1);
});
