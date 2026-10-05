# LaundryFlow Socket.IO Real-Time & Live Delivery Tracking Architecture (RN-7)

This document describes the production-ready real-time communication, room architecture, and live delivery tracking layer built with Socket.IO in the LaundryFlow platform.

---

## 1. Authentication & Security

### Handshake Authentication
Every client connection must provide a valid JWT token in either:
- `socket.handshake.auth.token`
- `socket.handshake.headers.authorization` (`Bearer <token>`)

```javascript
// Example client connection:
const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  auth: { token: 'jwt_token_here' },
});
```

### Server-Side Identity Verification
- The server verifies the token with `process.env.JWT_SECRET`.
- The user is retrieved from MongoDB (`User.findById(decoded.id)`).
- Deactivated (`isActive === false`) or unverified (`isVerified === false`) accounts are rejected.
- Verified user is attached to `socket.user`.
- **Zero Client Trust**: All authorization checks derive identity strictly from `socket.user`. The server never trusts client-supplied `userId`, `role`, `laundryId`, or `driverId`.

---

## 2. Room Architecture

### Logical Room Naming Conventions
To maintain strict multi-tenant isolation and 100% backward compatibility, rooms support both colon (`:`) and legacy underscore (`_`) formats:

| Room Pattern | Description | Auto-Joined on Connect? |
|---|---|---|
| `user:{userId}` / `user_{userId}` | Private user room for customer notifications | Yes (for that user) |
| `customer:{userId}` / `customer_{userId}` | Customer-specific room | Yes (for customers) |
| `driver:{driverId}` / `driver_{driverId}` | Driver private room | Yes (for delivery partners) |
| `laundry:{laundryId}` / `admin_{laundryId}` | Laundry tenant room | Yes (for laundry admin) |
| `order:{orderId}` / `order_{orderId}` | Ephemeral order tracking room | On-demand via `order:track` or `room:join` |
| `superadmin:global` | Global oversight room | Yes (for superadmins) |

### Room Join Authorization Rules (`room:join` / `order:track`)
- **Customer**:
  - Can join `user:{userId}` (only their own ID).
  - Can join `order:{orderId}` **only** if `order.user === customer.id`. Blocked from other customers' orders.
- **Delivery Partner**:
  - Can join `driver:{driverId}` (only their own ID).
  - Can join `order:{orderId}` **only** if order is explicitly assigned to them (`order.deliveryPartner === driver.id`). Blocked from unassigned or other drivers' orders.
- **Laundry Admin**:
  - Can join `laundry:{laundryId}` (only their own laundry).
  - Can join `order:{orderId}` **only** if `order.laundryId === admin.laundryId`. Blocked from other laundries' orders.
- **Super Admin**:
  - Global authorization to join any room.

---

## 3. Real-Time Events Catalog

### Order Lifecycle Events

#### `order:created`
- **Trigger**: Emitted after a new order is saved in MongoDB (`placeOrder` or `createDeliveryPickupOrder`).
- **Recipients**: `user:{customerId}`, `laundry:{laundryId}`, `superadmin:global`.
- **Payload**:
  ```json
  {
    "orderId": "651a2b3c4d5e6f7a8b9c0d1e",
    "order": { ... },
    "status": "pending",
    "totalAmount": 450,
    "timestamp": "2026-09-17T08:00:00.000Z"
  }
  ```

#### `order:assigned`
- **Trigger**: Admin assigns a delivery partner or driver accepts dispatch.
- **Recipients**: `order:{orderId}`, `user:{customerId}`, `driver:{driverId}`, `laundry:{laundryId}`.
- **Payload**:
  ```json
  {
    "orderId": "651a2b3c4d5e6f7a8b9c0d1e",
    "deliveryPartner": {
      "_id": "651a2b...",
      "name": "Ramesh Kumar",
      "phone": "9876543210",
      "currentLocation": { "lat": 12.9716, "lng": 77.5946 },
      "isAvailable": true
    },
    "status": "ready",
    "timestamp": "2026-09-17T08:05:00.000Z"
  }
  ```

#### `order:statusChanged`
- **Trigger**: Order moves to a new status (`picked_up`, `in_progress`, `ready`, `out_for_delivery`, `delivered`, `cancelled`).
- **Recipients**: `order:{orderId}`, `user:{customerId}`, `driver:{driverId}`, `laundry:{laundryId}`.
- **Payload**:
  ```json
  {
    "orderId": "651a2b3c4d5e6f7a8b9c0d1e",
    "previousStatus": "ready",
    "status": "out_for_delivery",
    "message": "Delivery partner is on the way to you!",
    "timestamp": "2026-09-17T08:10:00.000Z"
  }
  ```

#### `order:delivered`
- **Trigger**: Delivery confirmed via OTP or direct driver completion.
- **Recipients**: `order:{orderId}`, `user:{customerId}`, `driver:{driverId}`, `laundry:{laundryId}`.
- **Payload**:
  ```json
  {
    "orderId": "651a2b3c4d5e6f7a8b9c0d1e",
    "status": "delivered",
    "deliveredAt": "2026-09-17T08:35:00.000Z",
    "timestamp": "2026-09-17T08:35:00.000Z"
  }
  ```

#### `order:cancelled`
- **Trigger**: Customer cancels pending order or admin cancels order.
- **Recipients**: `order:{orderId}`, `user:{customerId}`, `driver:{driverId}`, `laundry:{laundryId}`.
- **Payload**:
  ```json
  {
    "orderId": "651a2b3c4d5e6f7a8b9c0d1e",
    "status": "cancelled",
    "reason": "Customer requested cancellation",
    "timestamp": "2026-09-17T08:02:00.000Z"
  }
  ```

---

### Driver Availability & Location Events

#### `driver:availabilityChanged`
- **Trigger**: Driver toggles online/offline/busy in mobile app or via REST endpoint `PUT /api/delivery/availability`.
- **Recipients**: `driver:{driverId}`, `laundry:{laundryId}` of associated stores/active orders.
- **Payload**:
  ```json
  {
    "driverId": "651a2b...",
    "status": "available",
    "isAvailable": true,
    "timestamp": "2026-09-17T08:00:00.000Z"
  }
  ```

#### `driver:locationUpdated`
- **Trigger**: Driver emits `driver:locationUpdate` socket event or calls `POST /api/delivery/update-location`.
- **Recipients**:
  - `order:{orderId}` (customer actively tracking the delivery).
  - `laundry:{laundryId}` (laundry admin supervising active dispatches).
  - `driver:{driverId}` (driver echo).
  - **NO GLOBAL BROADCAST**: Unrelated customers and laundries never receive GPS coordinates.
- **Payload**:
  ```json
  {
    "driverId": "651a2b...",
    "orderId": "651a2b3c4d5e6f7a8b9c0d1e",
    "latitude": 12.9725,
    "longitude": 77.5950,
    "heading": 180,
    "accuracy": 8,
    "speed": 22,
    "timestamp": "2026-09-17T08:15:30.000Z",
    "deliveryPartner": {
      "name": "Ramesh Kumar",
      "phone": "9876543210"
    }
  }
  ```

---

## 4. GPS Throttling & Battery Optimization

1. **Client-Side Throttling (Mobile)**:
   - Driver mobile app samples GPS and transmits updates only every **10-15 seconds** while actively out for delivery, or upon significant movement (> 15 meters).
   - Stationary drivers do not spam coordinates.
2. **Server-Side Debouncing**:
   - The server enforces a minimum **1.5-second cooldown** (`LOCATION_THROTTLE_MS = 1500`) per driver socket to prevent network flooding and denial-of-service.
3. **Automatic Lifecycle Cleanup**:
   - Location sharing starts when order is marked `picked_up` or `out_for_delivery`.
   - When order reaches `delivered`, location sharing is automatically halted and the customer tracking session is ended.

---

## 5. Reconnection & Resilience Strategy

- Both React Native Mobile (`mobile/src/services/socketService.js`) and Web (`web/src/services/socketService.js`) implement automatic reconnection:
  - On reconnect, sockets re-authenticate with fresh JWT tokens from persisted auth stores.
  - Active room subscriptions stored in an internal `Set` are automatically re-joined via `room:join`.
  - TanStack Query caches for orders, delivery partner lists, and dashboard stats are invalidated upon reconnect to ensure server consistency after temporary network dropouts.
