# LaundryFlow — Payments & Push Notifications Configuration Guide (RN-8)

This guide documents the environment configuration and credentials setup required for **Razorpay Online Payments** and **Firebase Cloud Messaging (FCM) Push Notifications**.

---

## 1. Razorpay Payment Gateway Configuration

### 1.1 Backend Environment (`Backend/.env`)
Configure the following variables in `Backend/.env`:

```env
# Razorpay Credentials (from https://dashboard.razorpay.com/app/keys)
RAZORPAY_KEY_ID=rzp_test_Sr9g59bK1Ds80A
RAZORPAY_KEY_SECRET=k5TsKJIuJPoVdVRLx1ODqYOn

# Razorpay Webhook Secret (from https://dashboard.razorpay.com/app/webhooks)
RAZORPAY_WEBHOOK_SECRET=laundry_secret_123
```

> [!CAUTION]
> **SECURITY MANDATE**:
> `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` must **NEVER** be committed to version control or included in client applications (Mobile or Web). Only the public `RAZORPAY_KEY_ID` may be supplied to client devices.

### 1.2 Webhook Configuration (Razorpay Dashboard)
To receive automated payment capture and refund updates:
1. Navigate to **Razorpay Dashboard > Settings > Webhooks**.
2. Click **Add New Webhook**.
3. Set **Webhook URL**: `https://api.yourdomain.com/api/payments/webhook` (or ngrok URL for local dev).
4. Enter **Secret**: Same value as `RAZORPAY_WEBHOOK_SECRET`.
5. Select active events:
   - `payment.captured`
   - `order.paid`
   - `payment.failed`
   - `refund.processed`
6. Save webhook.

---

## 2. Firebase Cloud Messaging (FCM) Configuration

### 2.1 Backend Push Notification Setup

LaundryFlow uses **Firebase Admin SDK** (FCM HTTP v1) for push notifications.
**No legacy Server Key is required.** Authentication is handled via `firebase-service-account.json`.

**Setup Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com/) → your project → **Project Settings** → **Service Accounts**
2. Click **Generate new private key** → download the JSON file
3. Place it at: `Backend/server/firebase-service-account.json`
4. The file is already listed in `Backend/.gitignore` and will **never** be committed

```js
// Backend/server/config/firebase.js — already configured
const admin = require("firebase-admin");
const serviceAccount = require("../firebase-service-account.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
module.exports = admin;
```

> [!IMPORTANT]
> **No `.env` variable needed for FCM.** The `firebase-service-account.json` file IS the credential.
> Never put the service account JSON inside the mobile app or commit it to git.

- **In Development Mode**:
  If Firebase Admin SDK fails to load (e.g. missing `firebase-service-account.json`), notifications are safely stored in MongoDB (`Notification` collection) and logged to the console (`[Push-DEV]`). No crash occurs.
- **In Production Mode**:
  `notificationService` uses `admin.messaging().send()` (FCM HTTP v1) to dispatch push notifications to all registered device tokens. Expired or invalid tokens are automatically pruned.
- **Non-Blocking Safety**:
  Failed push notifications will **NEVER** abort or fail an order creation or payment database transaction.

### 2.2 Android Mobile App Configuration (`mobile/`)
1. Firebase project: `laundry-app-ebf6a` (already configured)
2. Android package name: `com.laundryflow`
3. `google-services.json` already placed at: `mobile/android/app/google-services.json`
4. Google Services Gradle plugin already configured:
   - `mobile/android/build.gradle`: `classpath("com.google.gms:google-services:4.4.2")`
   - `mobile/android/app/build.gradle`: `apply plugin: "com.google.gms.google-services"`

### 2.3 iOS Mobile App Configuration (`mobile/`)
1. `GoogleService-Info.plist` already placed at: `mobile/ios/mobile/GoogleService-Info.plist`
2. Bundle ID: `com.laundryflow`

---

## 3. Endpoints Reference

### Payments (`/api/payments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/create-order` | Private/Customer | Creates Razorpay order based on authoritative server amount |
| `POST` | `/api/payments/verify` | Private/Customer | Verifies payment HMAC signature and marks order paid |
| `POST` | `/api/payments/webhook` | Public | Razorpay webhook listener with HMAC validation and idempotency |
| `PUT` | `/api/payments/confirm-cod/:orderId` | Private/Admin/Driver | Confirms physical cash collection for COD orders |
| `POST` | `/api/payments/refund/:orderId` | Private/Admin | Initiates online refund for cancelled paid orders |
| `GET` | `/api/payments/:orderId` | Private | Retrieves payment transaction record |
| `GET` | `/api/payments` | Private/Admin/SuperAdmin | Lists payment transactions (scoped to laundry or global) |

### Device Tokens & Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/notifications/register-token` | Private | Registers/refreshes FCM device token for authenticated user |
| `POST` | `/api/notifications/unregister-token` | Private | Unregisters FCM token on logout or permission revocation |
| `DELETE` | `/api/notifications/remove-token` | Private | Removes FCM token (DELETE alias for unregister) |
| `GET` | `/api/notifications` | Private | Retrieves paginated user notification history |
| `GET` | `/api/notifications/unread-count` | Private | Retrieves unread notification counter badge |
| `PUT` | `/api/notifications/:id/read` | Private | Marks individual notification as read |
| `PUT` | `/api/notifications/read-all` | Private | Marks all user notifications as read |
| `DELETE` | `/api/notifications/:id` | Private | Deletes notification record |

