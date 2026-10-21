import 'dotenv/config';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Handle different formats of private key from env
  if (privateKey) {
    // Remove surrounding quotes if present
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    // Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    // If key still doesn't have proper PEM format, try base64 decode
    if (!privateKey.includes('-----BEGIN')) {
      console.error("❌ FIREBASE_PRIVATE_KEY doesn't look like a PEM key");
    }
  }

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Firebase Error: Thiếu biến môi trường!');
    console.error('  FIREBASE_PROJECT_ID:', projectId ? '✅' : '❌ MISSING');
    console.error('  FIREBASE_CLIENT_EMAIL:', clientEmail ? '✅' : '❌ MISSING');
    console.error(
      '  FIREBASE_PRIVATE_KEY:',
      privateKey
        ? `✅ (${privateKey.length} chars, starts with: ${privateKey.substring(0, 30)}...)`
        : '❌ MISSING',
    );
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
      const err = error as Error;
      console.error('❌ Firebase Initialization Error:', err.message);
    }
  }
}

export default admin;
