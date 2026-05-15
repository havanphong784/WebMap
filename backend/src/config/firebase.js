import admin from "firebase-admin";
import "dotenv/config";

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
  }

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Firebase Error: Thiếu biến môi trường!");
    console.error("  FIREBASE_PROJECT_ID:", projectId ? "✅" : "❌ MISSING");
    console.error("  FIREBASE_CLIENT_EMAIL:", clientEmail ? "✅" : "❌ MISSING");
    console.error("  FIREBASE_PRIVATE_KEY:", privateKey ? `✅ (${privateKey.length} chars)` : "❌ MISSING");
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("✅ Firebase Admin initialized successfully");
    } catch (error) {
      console.error("❌ Firebase Initialization Error:", error.message);
    }
  }
}

export default admin;
