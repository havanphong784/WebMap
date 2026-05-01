import admin from "firebase-admin";
import "dotenv/config";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Firebase Error: Thiếu biến môi trường! Vui lòng kiểm tra FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, và FIREBASE_PRIVATE_KEY trên Render.");
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("✅ Firebase Admin đã được khởi tạo thành công!");
    } catch (error) {
      console.error("❌ Firebase Initialization Error:", error.message);
    }
  }
}

export default admin;
