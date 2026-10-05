const jwt = require("jsonwebtoken");
const User = require("../models/userModels");
const Order = require("../models/orderModels");

let io = null;

// Debounce map for driver location updates: driverId -> lastTimestamp (ms)
const driverLocationLastSent = new Map();
const LOCATION_THROTTLE_MS = 1500; // Minimum 1.5 seconds between socket emissions per driver

/**
 * Initialize Socket.io events and authentication
 * @param {object} ioInstance - Socket.io Server instance
 */
const initSocket = (ioInstance) => {
  io = ioInstance;

  // ─────────────────────────────────────────────
  // 1. Socket Authentication Middleware
  // ─────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Check headers if auth handshake token is missing
      if (!token && socket.handshake.headers?.authorization) {
        token = socket.handshake.headers.authorization;
      }

      if (!token) {
        if (process.env.NODE_ENV !== "production") {
          console.log("[Socket Auth] Connection rejected: Token missing");
        }
        return next(new Error("Authentication error: Token missing"));
      }

      // Handle Bearer scheme
      if (token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        return next(new Error("Authentication error: Invalid token payload"));
      }

      const user = await User.findById(decoded.id);

      if (!user) {
        if (process.env.NODE_ENV !== "production") {
          console.log(`[Socket Auth] Connection rejected: User not found for ID ${decoded.id}`);
        }
        return next(new Error("Authentication error: User not found"));
      }

      if (!user.isActive) {
        return next(new Error("Authentication error: Account is deactivated"));
      }

      if (!user.isVerified) {
        return next(new Error("Authentication error: Account is not verified"));
      }

      // Attach verified user to socket instance (never trust client claims)
      socket.user = user;
      next();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`[Socket Auth] JWT Verification failed: ${error.message}`);
      }
      return next(new Error("Authentication error: Token verification failed"));
    }
  });

  // ─────────────────────────────────────────────
  // 2. Connection Event
  // ─────────────────────────────────────────────
  io.on("connection", async (socket) => {
    const user = socket.user;
    const userId = user._id.toString();
    const role = user.role;

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Socket] Connected: Socket ID: ${socket.id}, User ID: ${userId}, Role: ${role}`);
    }

    try {
      // Save socket id in user document
      await User.findByIdAndUpdate(userId, { socketId: socket.id }, { returnDocument: "after" });

      // Auto-join User Room (both standardized and legacy formats)
      socket.join(`user:${userId}`);
      socket.join(`user_${userId}`);

      // Auto-join role-specific rooms
      if (role === "user") {
        socket.join(`customer:${userId}`);
        socket.join(`customer_${userId}`);
      } else if (role === "delivery") {
        socket.join(`driver:${userId}`);
        socket.join(`driver_${userId}`);
        socket.join(`delivery_${userId}`);
      } else if (role === "admin") {
        const laundryId = user.laundryId?.toString();
        if (laundryId) {
          socket.join(`laundry:${laundryId}`);
          socket.join(`laundry_${laundryId}`);
          socket.join(`admin_${laundryId}`);
        }
      } else if (role === "superadmin") {
        socket.join("superadmin:global");
      }
    } catch (error) {
      console.error(`[Socket Connection Error] for user ${userId}:`, error.message);
    }

    // ─────────────────────────────────────────────
    // 3. Room Join Authorization Handler
    // ─────────────────────────────────────────────
    socket.on("room:join", async (data, callback) => {
      try {
        const { room } = data || {};
        if (!room || typeof room !== "string") {
          if (callback) callback({ success: false, message: "Room identifier is required" });
          return;
        }

        const isAuthorized = await authorizeRoomJoin(user, room);
        if (!isAuthorized) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(`[Socket Room] Unauthorized join attempt by User ${userId} (${role}) to room: ${room}`);
          }
          if (callback) callback({ success: false, message: "Unauthorized room subscription" });
          socket.emit("error:unauthorized", { room, message: "Unauthorized room subscription" });
          return;
        }

        socket.join(room);
        if (process.env.NODE_ENV !== "production") {
          console.log(`[Socket Room] User ${userId} (${role}) joined authorized room: ${room}`);
        }
        if (callback) callback({ success: true, room });
      } catch (error) {
        console.error(`[Socket room:join Error] ${error.message}`);
        if (callback) callback({ success: false, message: "Room join failed. Please try again." });
      }
    });

    socket.on("room:leave", (data, callback) => {
      try {
        const { room } = data || {};
        if (room) {
          socket.leave(room);
          if (process.env.NODE_ENV !== "production") {
            console.log(`[Socket Room] User ${userId} left room: ${room}`);
          }
        }
        if (callback) callback({ success: true });
      } catch (error) {
        if (callback) callback({ success: false, message: "Room leave failed." });
      }
    });

    // ─────────────────────────────────────────────
    // 4. Customer Order Tracking (order:track / order:untrack)
    // ─────────────────────────────────────────────
    socket.on("order:track", async (data, callback) => {
      try {
        const { orderId } = data || {};
        if (!orderId) {
          if (callback) callback({ success: false, message: "Order ID is required" });
          return;
        }

        const order = await Order.findById(orderId).populate("deliveryPartner", "name phone currentLocation isAvailable");
        if (!order) {
          if (callback) callback({ success: false, message: "Order not found" });
          return;
        }

        // Verify authorization: customer owns order, assigned driver, laundry admin, or superadmin
        const isOwner = order.user?.toString() === userId;
        const isAssignedDriver = order.deliveryPartner?._id?.toString() === userId || order.deliveryPartner?.toString() === userId;
        const isAdminOfLaundry = role === "admin" && order.laundryId?.toString() === user.laundryId?.toString();
        const isSuperAdmin = role === "superadmin";

        if (!isOwner && !isAssignedDriver && !isAdminOfLaundry && !isSuperAdmin) {
          if (callback) callback({ success: false, message: "Access denied to order room" });
          socket.emit("error:unauthorized", { orderId, message: "Access denied to order room" });
          return;
        }

        // Join both standardized and legacy order rooms
        socket.join(`order:${orderId}`);
        socket.join(`order_${orderId}`);

        if (process.env.NODE_ENV !== "production") {
          console.log(`[Socket] User ${userId} tracking order: ${orderId}`);
        }

        const response = {
          orderId: order._id,
          status: order.status,
          deliveryPartner: order.deliveryPartner ? {
            _id: order.deliveryPartner._id,
            name: order.deliveryPartner.name,
            phone: order.deliveryPartner.phone,
            currentLocation: order.deliveryPartner.currentLocation || null,
            isAvailable: order.deliveryPartner.isAvailable,
          } : null,
        };

        if (callback) {
          callback({ success: true, data: response });
        } else {
          socket.emit("order:track_data", response);
        }
      } catch (error) {
        console.error("[Socket order:track] Error:", error.message);
        if (callback) callback({ success: false, message: error.message });
      }
    });

    socket.on("order:untrack", (data, callback) => {
      try {
        const { orderId } = data || {};
        if (!orderId) {
          if (callback) callback({ success: false, message: "Order ID is required" });
          return;
        }

        socket.leave(`order:${orderId}`);
        socket.leave(`order_${orderId}`);

        if (process.env.NODE_ENV !== "production") {
          console.log(`[Socket] Customer ${userId} stopped tracking order: ${orderId}`);
        }

        if (callback) callback({ success: true, message: `Stopped tracking order:${orderId}` });
      } catch (error) {
        console.error("[Socket order:untrack] Error:", error.message);
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // ─────────────────────────────────────────────
    // 5. Driver Location Updates (driver:locationUpdate / delivery:location_update)
    // ─────────────────────────────────────────────
    const handleDriverLocationUpdate = async (data, callback) => {
      try {
        if (role !== "delivery" && role !== "superadmin") {
          if (callback) callback({ success: false, message: "Only delivery partners can submit GPS updates" });
          return;
        }

        const latitude = data?.latitude !== undefined ? Number(data.latitude) : (data?.lat !== undefined ? Number(data.lat) : undefined);
        const longitude = data?.longitude !== undefined ? Number(data.longitude) : (data?.lng !== undefined ? Number(data.lng) : undefined);
        const orderId = data?.orderId ? data.orderId.toString() : null;
        const heading = data?.heading !== undefined ? Number(data.heading) : undefined;
        const accuracy = data?.accuracy !== undefined ? Number(data.accuracy) : undefined;
        const speed = data?.speed !== undefined ? Number(data.speed) : undefined;
        const timestamp = data?.timestamp ? new Date(data.timestamp) : new Date();

        // Validate Coordinates
        if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
          if (callback) callback({ success: false, message: "Valid latitude and longitude are required" });
          return;
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          if (callback) callback({ success: false, message: "Coordinates out of bounds (-90..90, -180..180)" });
          return;
        }

        // Throttle check (debounce spam bursts)
        const now = Date.now();
        const lastSent = driverLocationLastSent.get(userId) || 0;
        if (now - lastSent < LOCATION_THROTTLE_MS) {
          if (callback) callback({ success: true, throttled: true });
          return;
        }
        driverLocationLastSent.set(userId, now);

        // Update driver's location in MongoDB
        const updatedDriver = await User.findByIdAndUpdate(
          userId,
          {
            currentLocation: { lat: latitude, lng: longitude },
            lastActive: new Date(),
          },
          { returnDocument: "after" }
        );

        // Emit location to authorized recipients only
        emitDriverLocationUpdated({
          driverId: userId,
          orderId,
          latitude,
          longitude,
          heading,
          accuracy,
          speed,
          timestamp,
          driverName: updatedDriver?.name,
          driverPhone: updatedDriver?.phone,
        });

        if (callback) callback({ success: true, timestamp });
      } catch (error) {
        console.error("[Socket driver:locationUpdate] Error:", error.message);
        if (callback) callback({ success: false, message: error.message });
      }
    };

    socket.on("driver:locationUpdate", handleDriverLocationUpdate);
    socket.on("delivery:location_update", handleDriverLocationUpdate);

    // ─────────────────────────────────────────────
    // 6. Driver Availability Realtime
    // ─────────────────────────────────────────────
    socket.on("driver:setAvailability", async (data, callback) => {
      try {
        if (role !== "delivery" && role !== "superadmin") {
          if (callback) callback({ success: false, message: "Only delivery partners can update availability" });
          return;
        }

        const status = data?.status || (data?.isAvailable ? "available" : "offline");
        const isAvailable = status === "available";

        await User.findByIdAndUpdate(
          userId,
          {
            availabilityStatus: status,
            isAvailable,
            lastActive: new Date(),
          },
          { returnDocument: "after" }
        );

        emitDriverAvailabilityChanged(userId, status, isAvailable);

        if (callback) callback({ success: true, status, isAvailable });
      } catch (error) {
        console.error("[Socket driver:setAvailability] Error:", error.message);
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // Legacy availability aliases
    socket.on("delivery:available", async (data, callback) => {
      await User.findByIdAndUpdate(userId, { availabilityStatus: "available", isAvailable: true, lastActive: new Date() }, { returnDocument: "after" });
      emitDriverAvailabilityChanged(userId, "available", true);
      if (callback) callback({ success: true });
    });

    socket.on("delivery:unavailable", async (data, callback) => {
      await User.findByIdAndUpdate(userId, { availabilityStatus: "offline", isAvailable: false, lastActive: new Date() }, { returnDocument: "after" });
      emitDriverAvailabilityChanged(userId, "offline", false);
      if (callback) callback({ success: true });
    });

    // ─────────────────────────────────────────────
    // 7. Admin Dashboard Subscription
    // ─────────────────────────────────────────────
    socket.on("admin:dashboard_subscribe", (data, callback) => {
      try {
        const laundryId = data?.laundryId || user.laundryId?.toString();
        if (!laundryId) {
          if (callback) callback({ success: false, message: "Laundry ID is required" });
          return;
        }

        if (role === "admin" && user.laundryId?.toString() !== laundryId) {
          if (callback) callback({ success: false, message: "Unauthorized for this laundry" });
          return;
        }

        socket.join(`laundry:${laundryId}`);
        socket.join(`admin_${laundryId}`);
        socket.join(`admin_dashboard_${laundryId}`);

        if (process.env.NODE_ENV !== "production") {
          console.log(`[Socket] Admin ${userId} subscribed to Laundry ${laundryId}`);
        }

        if (callback) callback({ success: true, message: `Subscribed to laundry:${laundryId}` });
      } catch (error) {
        console.error("[Socket admin:dashboard_subscribe] Error:", error.message);
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // ─────────────────────────────────────────────
    // 8. Disconnect Event
    // ─────────────────────────────────────────────
    socket.on("disconnect", async () => {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Socket] Disconnected: Socket ID: ${socket.id}, User ID: ${userId}`);
      }

      try {
        await User.findByIdAndUpdate(userId, { socketId: null }, { returnDocument: "after" });
      } catch (error) {
        console.error(`[Socket Disconnect Error] for user ${userId}:`, error.message);
      }
    });
  });
};

/**
 * Server-side authorization check before joining any logical room
 */
const authorizeRoomJoin = async (user, room) => {
  if (!user || !room) return false;
  if (user.role === "superadmin") return true;

  const userId = user._id.toString();

  // User rooms: user:{userId} or user_{userId} or customer:...
  if (room.startsWith("user:") || room.startsWith("user_") || room.startsWith("customer:") || room.startsWith("customer_")) {
    const targetUserId = room.replace(/^(user:|user_|customer:|customer_)/, "");
    return targetUserId === userId;
  }

  // Driver rooms: driver:{driverId} or driver_{driverId} or delivery:...
  if (room.startsWith("driver:") || room.startsWith("driver_") || room.startsWith("delivery:") || room.startsWith("delivery_")) {
    const targetDriverId = room.replace(/^(driver:|driver_|delivery:|delivery_)/, "");
    return user.role === "delivery" && targetDriverId === userId;
  }

  // Laundry rooms: laundry:{laundryId} or admin_{laundryId}
  if (room.startsWith("laundry:") || room.startsWith("laundry_") || room.startsWith("admin:") || room.startsWith("admin_")) {
    const targetLaundryId = room.replace(/^(laundry:|laundry_|admin:|admin_dashboard_|admin_)/, "");
    return user.role === "admin" && user.laundryId?.toString() === targetLaundryId;
  }

  // Order rooms: order:{orderId} or order_{orderId}
  if (room.startsWith("order:") || room.startsWith("order_")) {
    const orderId = room.replace(/^(order:|order_)/, "");
    const order = await Order.findById(orderId).select("user deliveryPartner laundryId");
    if (!order) return false;

    // Customer can join only their own order
    if (order.user?.toString() === userId) return true;

    // Delivery Partner can join only if explicitly assigned
    if (user.role === "delivery" && order.deliveryPartner?.toString() === userId) return true;

    // Laundry Admin can join only if order belongs to their laundry
    if (user.role === "admin" && order.laundryId?.toString() === user.laundryId?.toString()) return true;

    return false;
  }

  return false;
};

// ─────────────────────────────────────────────
// Server-Side Event Emitter Helpers
// ─────────────────────────────────────────────

/**
 * Emit order:created event after persistence
 */
const emitOrderCreated = (order) => {
  if (!io || !order) return;

  const orderId = order._id.toString();
  const customerId = (order.user?._id || order.user)?.toString();
  const laundryId = (order.laundryId?._id || order.laundryId)?.toString();

  const payload = {
    orderId,
    order,
    status: order.status,
    totalAmount: order.totalAmount,
    timestamp: new Date(),
  };

  // Emit to Customer room
  if (customerId) {
    io.to(`user:${customerId}`).to(`customer_${customerId}`).emit("order:created", payload);
  }

  // Emit to Laundry Admin room
  if (laundryId) {
    io.to(`laundry:${laundryId}`).to(`admin_${laundryId}`).to(`admin_dashboard_${laundryId}`).emit("order:created", payload);
    // Legacy event
    io.to(`laundry:${laundryId}`).to(`admin_${laundryId}`).emit("admin:new_order", {
      orderId,
      customerName: order.user?.name || "Customer",
      totalAmount: order.totalAmount,
      services: order.services,
      orderDetails: order,
    });
  }

  // Super Admin
  io.to("superadmin:global").emit("order:created", payload);

  if (process.env.NODE_ENV !== "production") {
    console.log(`[Socket Emit] order:created -> Order #${orderId} (Laundry: ${laundryId})`);
  }
};

/**
 * Emit order:updated event
 */
const emitOrderUpdated = (order) => {
  if (!io || !order) return;

  const orderId = order._id.toString();
  const customerId = (order.user?._id || order.user)?.toString();
  const driverId = (order.deliveryPartner?._id || order.deliveryPartner)?.toString();
  const laundryId = (order.laundryId?._id || order.laundryId)?.toString();

  const payload = {
    orderId,
    order,
    status: order.status,
    timestamp: new Date(),
  };

  io.to(`order:${orderId}`).to(`order_${orderId}`).emit("order:updated", payload);

  if (customerId) {
    io.to(`user:${customerId}`).to(`customer_${customerId}`).emit("order:updated", payload);
  }
  if (driverId) {
    io.to(`driver:${driverId}`).to(`delivery_${driverId}`).emit("order:updated", payload);
  }
  if (laundryId) {
    io.to(`laundry:${laundryId}`).to(`admin_${laundryId}`).emit("order:updated", payload);
  }

  io.to("superadmin:global").emit("order:updated", payload);
};

/**
 * Emit order:assigned event
 */
const emitOrderAssigned = (order, deliveryPartner) => {
  if (!io || !order) return;

  const orderId = order._id.toString();
  const customerId = (order.user?._id || order.user)?.toString();
  const driverId = (deliveryPartner?._id || deliveryPartner)?.toString();
  const laundryId = (order.laundryId?._id || order.laundryId)?.toString();

  const payload = {
    orderId,
    order,
    deliveryPartner: {
      _id: driverId,
      name: deliveryPartner?.name || "Delivery Partner",
      phone: deliveryPartner?.phone || "",
      currentLocation: deliveryPartner?.currentLocation || null,
      isAvailable: deliveryPartner?.isAvailable ?? true,
    },
    status: order.status,
    timestamp: new Date(),
  };

  // Order room
  io.to(`order:${orderId}`).to(`order_${orderId}`).emit("order:assigned", payload);

  // Customer room
  if (customerId) {
    io.to(`user:${customerId}`).to(`customer_${customerId}`).emit("order:assigned", payload);
    // Legacy compatibility event
    io.to(`customer_${customerId}`).emit("delivery:assigned", payload.deliveryPartner);
  }

  // Assigned Driver room
  if (driverId) {
    io.to(`driver:${driverId}`).to(`delivery_${driverId}`).emit("order:assigned", payload);
  }

  // Laundry Admin room
  if (laundryId) {
    io.to(`laundry:${laundryId}`).to(`admin_${laundryId}`).to(`admin_dashboard_${laundryId}`).emit("order:assigned", payload);
  }

  io.to("superadmin:global").emit("order:assigned", payload);

  if (process.env.NODE_ENV !== "production") {
    console.log(`[Socket Emit] order:assigned -> Order #${orderId} -> Driver ${driverId}`);
  }
};

/**
 * Emit order:statusChanged event
 */
const emitOrderStatusChanged = (order, previousStatus, newStatus, message) => {
  if (!io || !order) return;

  const orderId = order._id.toString();
  const customerId = (order.user?._id || order.user)?.toString();
  const driverId = (order.deliveryPartner?._id || order.deliveryPartner)?.toString();
  const laundryId = (order.laundryId?._id || order.laundryId)?.toString();

  const payload = {
    orderId,
    previousStatus,
    status: newStatus,
    message: message || `Order status changed to ${newStatus}`,
    timestamp: new Date(),
  };

  // Order room
  io.to(`order:${orderId}`).to(`order_${orderId}`).emit("order:statusChanged", payload);
  // Legacy status_update event
  io.to(`order:${orderId}`).to(`order_${orderId}`).emit("order:status_update", payload);

  // Customer room
  if (customerId) {
    io.to(`user:${customerId}`).to(`customer_${customerId}`).emit("order:statusChanged", payload);
    io.to(`customer_${customerId}`).emit("order:status_update", payload);
  }

  // Driver room
  if (driverId) {
    io.to(`driver:${driverId}`).to(`delivery_${driverId}`).emit("order:statusChanged", payload);
  }

  // Laundry Admin room
  if (laundryId) {
    io.to(`laundry:${laundryId}`).to(`admin_${laundryId}`).to(`admin_dashboard_${laundryId}`).emit("order:statusChanged", payload);
  }

  io.to("superadmin:global").emit("order:statusChanged", payload);

  if (process.env.NODE_ENV !== "production") {
    console.log(`[Socket Emit] order:statusChanged -> Order #${orderId} (${previousStatus} -> ${newStatus})`);
  }
};

/**
 * Emit order:cancelled event
 */
const emitOrderCancelled = (order, reason) => {
  if (!io || !order) return;

  const orderId = order._id.toString();
  const customerId = (order.user?._id || order.user)?.toString();
  const driverId = (order.deliveryPartner?._id || order.deliveryPartner)?.toString();
  const laundryId = (order.laundryId?._id || order.laundryId)?.toString();

  const payload = {
    orderId,
    status: "cancelled",
    reason: reason || "Order cancelled",
    timestamp: new Date(),
  };

  io.to(`order:${orderId}`).to(`order_${orderId}`).emit("order:cancelled", payload);

  if (customerId) {
    io.to(`user:${customerId}`).to(`customer_${customerId}`).emit("order:cancelled", payload);
  }
  if (driverId) {
    io.to(`driver:${driverId}`).to(`delivery_${driverId}`).emit("order:cancelled", payload);
  }
  if (laundryId) {
    io.to(`laundry:${laundryId}`).to(`admin_${laundryId}`).to(`admin_dashboard_${laundryId}`).emit("order:cancelled", payload);
  }

  io.to("superadmin:global").emit("order:cancelled", payload);

  if (process.env.NODE_ENV !== "production") {
    console.log(`[Socket Emit] order:cancelled -> Order #${orderId}`);
  }
};

/**
 * Emit order:delivered event
 */
const emitOrderDelivered = (order) => {
  if (!io || !order) return;

  const orderId = order._id.toString();
  const customerId = (order.user?._id || order.user)?.toString();
  const driverId = (order.deliveryPartner?._id || order.deliveryPartner)?.toString();
  const laundryId = (order.laundryId?._id || order.laundryId)?.toString();

  const payload = {
    orderId,
    status: "delivered",
    deliveredAt: order.deliveredAt || new Date(),
    timestamp: new Date(),
  };

  io.to(`order:${orderId}`).to(`order_${orderId}`).emit("order:delivered", payload);

  if (customerId) {
    io.to(`user:${customerId}`).to(`customer_${customerId}`).emit("order:delivered", payload);
  }
  if (driverId) {
    io.to(`driver:${driverId}`).to(`delivery_${driverId}`).emit("order:delivered", payload);
  }
  if (laundryId) {
    io.to(`laundry:${laundryId}`).to(`admin_${laundryId}`).to(`admin_dashboard_${laundryId}`).emit("order:delivered", payload);
  }

  io.to("superadmin:global").emit("order:delivered", payload);

  if (process.env.NODE_ENV !== "production") {
    console.log(`[Socket Emit] order:delivered -> Order #${orderId}`);
  }
};

/**
 * Emit driver:availabilityChanged event
 */
const emitDriverAvailabilityChanged = (driverId, status, isAvailable) => {
  if (!io || !driverId) return;

  const payload = {
    driverId: driverId.toString(),
    deliveryPartnerId: driverId.toString(), // backward-compatibility
    status: status || (isAvailable ? "available" : "offline"),
    isAvailable: Boolean(isAvailable),
    timestamp: new Date(),
  };

  // Emit to driver's own room
  io.to(`driver:${driverId}`).to(`delivery_${driverId}`).emit("driver:availabilityChanged", payload);

  // Find all laundries where this driver has orders or is affiliated to notify their admins
  User.findById(driverId).select("laundryId").then(async (driver) => {
    const laundryIds = new Set();
    if (driver?.laundryId) {
      laundryIds.add(driver.laundryId.toString());
    }

    // Also notify laundries of driver's active orders
    try {
      const activeOrders = await Order.find({
        deliveryPartner: driverId,
        status: { $in: ["picked_up", "ready", "out_for_delivery"] },
      }).select("laundryId");

      activeOrders.forEach((o) => {
        if (o.laundryId) laundryIds.add(o.laundryId.toString());
      });
    } catch (err) {
      // safe fallback
    }

    laundryIds.forEach((laundryId) => {
      io.to(`laundry:${laundryId}`).to(`admin_${laundryId}`).to(`admin_dashboard_${laundryId}`).emit("driver:availabilityChanged", payload);
      // Legacy status_change event
      io.to(`admin_${laundryId}`).to(`admin_dashboard_${laundryId}`).emit("delivery:status_change", payload);
    });
  }).catch((err) => {
    console.error("emitDriverAvailabilityChanged lookup error:", err.message);
  });

  io.to("superadmin:global").emit("driver:availabilityChanged", payload);

  if (process.env.NODE_ENV !== "production") {
    console.log(`[Socket Emit] driver:availabilityChanged -> Driver ${driverId} (status: ${status})`);
  }
};

/**
 * Emit driver:locationUpdated event to authorized parties ONLY (NO global broadcast)
 */
const emitDriverLocationUpdated = async ({
  driverId,
  orderId,
  latitude,
  longitude,
  heading,
  accuracy,
  speed,
  timestamp,
  driverName,
  driverPhone,
}) => {
  if (!io || !driverId) return;

  const locationPayload = {
    driverId: driverId.toString(),
    deliveryPartnerId: driverId.toString(),
    latitude,
    longitude,
    heading: heading || null,
    accuracy: accuracy || null,
    speed: speed || null,
    timestamp: timestamp || new Date(),
    deliveryPartner: {
      name: driverName || "Delivery Partner",
      phone: driverPhone || "",
    },
  };

  // If a specific active orderId was provided, verify and emit to that order's room and laundry
  if (orderId) {
    try {
      const order = await Order.findById(orderId).select("deliveryPartner laundryId status");
      if (order && order.deliveryPartner?.toString() === driverId.toString()) {
        const orderRoomPayload = { ...locationPayload, orderId };
        io.to(`order:${orderId}`).to(`order_${orderId}`).emit("driver:locationUpdated", orderRoomPayload);
        // Legacy event for backward-compatibility with earlier screens
        io.to(`order:${orderId}`).to(`order_${orderId}`).emit("delivery:location", {
          lat: latitude,
          lng: longitude,
          deliveryPartner: locationPayload.deliveryPartner,
        });

        if (order.laundryId) {
          const lId = order.laundryId.toString();
          io.to(`laundry:${lId}`).to(`admin_${lId}`).to(`admin_dashboard_${lId}`).emit("driver:locationUpdated", orderRoomPayload);
          // Legacy admin event
          io.to(`admin_${lId}`).to(`admin_dashboard_${lId}`).emit("delivery:location_admin", {
            orderId,
            deliveryPartnerId: driverId,
            lat: latitude,
            lng: longitude,
          });
        }
      }
    } catch (err) {
      console.error("[Socket] emitDriverLocationUpdated order lookup error:", err.message);
    }
  } else {
    // No specific orderId: find all currently active deliveries for this driver
    try {
      const activeOrders = await Order.find({
        deliveryPartner: driverId,
        status: { $in: ["picked_up", "ready", "out_for_delivery"] },
      }).select("_id laundryId");

      activeOrders.forEach((o) => {
        const oId = o._id.toString();
        const orderRoomPayload = { ...locationPayload, orderId: oId };
        io.to(`order:${oId}`).to(`order_${oId}`).emit("driver:locationUpdated", orderRoomPayload);
        io.to(`order:${oId}`).to(`order_${oId}`).emit("delivery:location", {
          lat: latitude,
          lng: longitude,
          deliveryPartner: locationPayload.deliveryPartner,
        });

        if (o.laundryId) {
          const lId = o.laundryId.toString();
          io.to(`laundry:${lId}`).to(`admin_${lId}`).to(`admin_dashboard_${lId}`).emit("driver:locationUpdated", orderRoomPayload);
        }
      });
    } catch (err) {
      console.error("[Socket] emitDriverLocationUpdated active orders error:", err.message);
    }
  }

  // Also emit to driver's own room for confirmation/echo
  io.to(`driver:${driverId}`).to(`delivery_${driverId}`).emit("driver:locationUpdated", locationPayload);

  // Super Admin
  io.to("superadmin:global").emit("driver:locationUpdated", locationPayload);
};

// ─────────────────────────────────────────────
// Backward-Compatible Aliases
// ─────────────────────────────────────────────

const emitOrderStatusUpdate = (orderId, customerId, status, message) => {
  if (!io) return;
  const payload = {
    orderId,
    status,
    message: message || `Order status updated to ${status}`,
    timestamp: new Date(),
  };
  io.to(`customer_${customerId}`).to(`user:${customerId}`).emit("order:status_update", payload);
  io.to(`order_${orderId}`).to(`order:${orderId}`).emit("order:status_update", payload);
  io.to(`customer_${customerId}`).to(`user:${customerId}`).emit("order:statusChanged", payload);
  io.to(`order_${orderId}`).to(`order:${orderId}`).emit("order:statusChanged", payload);
};

const emitNewOrderToAdmin = async (laundryId, orderData) => {
  if (!io) return;
  emitOrderCreated(orderData);
};

const emitDeliveryAssigned = (customerId, deliveryPartner) => {
  if (!io) return;
  const payload = {
    name: deliveryPartner?.name || "Delivery Partner",
    phone: deliveryPartner?.phone || "",
    currentLocation: deliveryPartner?.currentLocation || null,
  };
  io.to(`customer_${customerId}`).to(`user:${customerId}`).emit("delivery:assigned", payload);
};

const emitPaymentSuccess = (customerId, paymentData) => {
  if (!io) return;
  const payload = {
    amount: paymentData?.amount || 0,
    orderId: paymentData?.orderId || paymentData?.order || "",
  };
  io.to(`customer_${customerId}`).to(`user:${customerId}`).emit("payment:success", payload);
};

module.exports = {
  initSocket,
  authorizeRoomJoin,
  emitOrderCreated,
  emitOrderUpdated,
  emitOrderAssigned,
  emitOrderStatusChanged,
  emitOrderCancelled,
  emitOrderDelivered,
  emitDriverAvailabilityChanged,
  emitDriverLocationUpdated,
  emitOrderStatusUpdate,
  emitNewOrderToAdmin,
  emitDeliveryAssigned,
  emitPaymentSuccess,
};
