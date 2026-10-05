const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let serviceAccount = null;
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
            break;
        } catch (_) {}
    }
}

const hasApps = typeof admin.getApps === 'function' ? admin.getApps().length > 0 : Boolean(admin.apps && admin.apps.length);
if (serviceAccount && !hasApps) {
    const certFn = admin.credential?.cert || admin.cert;
    admin.initializeApp({
        credential: certFn(serviceAccount),
    });
}

module.exports = admin;