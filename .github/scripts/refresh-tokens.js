// refresh-tokens.js - الإصدار المصحح
const axios = require('axios');
const admin = require('firebase-admin');

// تهيئة Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); // تم إزالة _KEY

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const appId = 'socialhub-prod-v7-5';

async function refreshFacebookTokens() {
  try {
    console.log('بدء عملية تجديد توكنات فيسبوك...');
    
    // الحصول على جميع حسابات فيسبوك من Firebase
    const accountsSnapshot = await db.collection(`artifacts/${appId}/allAccounts`)
      .where('platform', '==', 'facebook')
      .where('isConnected', '==', true)
      .get();

    if (accountsSnapshot.empty) {
      console.log('لا توجد حسابات فيسبوك متصلة.');
      return;
    }

    console.log(`تم العثور على ${accountsSnapshot.size} حساب فيسبوك.`);

    for (const doc of accountsSnapshot.docs) {
      const accountData = doc.data();
      
      // التحقق إذا كان التوكن على وشك الانتهاء (أقل من 24 ساعة)
      const expirationTime = accountData.tokenExpiration || 0;
      const timeUntilExpiration = expirationTime - Date.now();
      
      if (timeUntilExpiration < 24 * 60 * 60 * 1000) {
        console.log(`تجديد توكن للحساب: ${accountData.name}`);
        
        try {
          // تجديد التوكن باستخدام Facebook Graph API
          const response = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
            params: {
              grant_type: 'fb_exchange_token',
              client_id: process.env.FACEBOOK_APP_ID,
              client_secret: process.env.FACEBOOK_APP_SECRET,
              fb_exchange_token: accountData.accessToken
            }
          });

          const newToken = response.data.access_token;
          const expiresIn = response.data.expires_in;
          const newExpirationTime = Date.now() + (expiresIn * 1000);

          // تحديث البيانات في Firebase
          await doc.ref.update({
            accessToken: newToken,
            tokenExpiration: newExpirationTime,
            tokenExpirationDate: new Date(newExpirationTime),
            lastTokenRefresh: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`✓ تم تجديد توكن للحساب: ${accountData.name}`);

          // أيضًا تحديث الحساب في مجموعة المستخدم
          const userAccountRef = db.doc(`artifacts/${appId}/users/${accountData.userId}/accounts/${doc.id}`);
          await userAccountRef.update({
            accessToken: newToken,
            tokenExpiration: newExpirationTime,
            tokenExpirationDate: new Date(newExpirationTime),
            lastTokenRefresh: admin.firestore.FieldValue.serverTimestamp()
          });

        } catch (error) {
          console.error(`✗ فشل تجديد توكن للحساب: ${accountData.name}`, error.response?.data || error.message);
          
          // إذا فشل التجديد، تعطيل الحساب
          await doc.ref.update({
            isConnected: false,
            connectionError: error.response?.data || error.message,
            lastErrorAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } else {
        const hoursRemaining = Math.round(timeUntilExpiration / (60 * 60 * 1000));
        console.log(`توكن الحساب ${accountData.name} لا يزال صالحاً لمدة ${hoursRemaining} ساعة.`);
      }
    }

    console.log('تم الانتهاء من عملية تجديد التوكنات.');
    
  } catch (error) {
    console.error('حدث خطأ أثناء عملية التجديد:', error);
    // تسجيل الخطأ في Firebase للتحليل لاحقاً
    await db.collection(`artifacts/${appId}/system/errors`).add({
      type: 'token_refresh_error',
      message: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    throw error;
  }
}

// إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  refreshFacebookTokens()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('فشل تنفيذ تجديد التوكنات:', error);
      process.exit(1);
    });
}

module.exports = { refreshFacebookTokens };
