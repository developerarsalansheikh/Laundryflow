const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// 1. Try parsing from FIREBASE_SERVICE_ACCOUNT_JSON environment variable (Render / Production)
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
        if (raw.startsWith("{")) {
            serviceAccount = JSON.parse(raw);
        } else {
            // Support base64 encoded JSON string
            const decoded = Buffer.from(raw, "base64").toString("utf8");
            serviceAccount = JSON.parse(decoded);
        }
        console.log("[Firebase] Service account loaded from FIREBASE_SERVICE_ACCOUNT_JSON environment variable.");
    } catch (err) {
        console.warn("[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON environment variable:", err.message);
    }
}

// 2. Fallback to local files for local development
if (!serviceAccount) {
    const possiblePaths = [
        path.resolve(__dirname, "../../firebase-service-account.json"),
        path.resolve(__dirname, "../firebase-service-account.json"),
        path.resolve(process.cwd(), "firebase-service-account.json"),
        path.resolve(process.cwd(), "Backend/firebase-service-account.json"),
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            try {
                serviceAccount = require(p);
                console.log("[Firebase] Service account loaded from local file:", path.basename(p));
                break;
            } catch (_) {}
        }
    }
}

const hasApps = typeof admin.getApps === 'function' ? admin.getApps().length > 0 : Boolean(admin.apps && admin.apps.length);
if (serviceAccount && !hasApps) {
    try {
        const certFn = admin.credential?.cert || admin.cert;
        admin.initializeApp({
            credential: certFn(serviceAccount),
        });
        console.log("[Firebase] Firebase Admin SDK successfully initialized.");
    } catch (initErr) {
        console.error("[Firebase] Initialization error:", initErr.message);
    }
} else if (!serviceAccount) {
    console.warn("[Firebase] Notice: Service account not configured. Push notifications will be skipped safely.");
}

module.exports = admin;