const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const http = require('http');
const https = require('https');
const mongoose = require('mongoose');
const { generateAccessToken } = require('../utils/generateToken');

function request(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const client = u.protocol === 'https:' ? https : http;
    const body = data ? JSON.stringify(data) : null;
    const req = client.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: {
        ...(body ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        } : {}),
        ...options.headers
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(d || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode, body: d });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log('LAUNDRYFLOW COMPREHENSIVE VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. Health Endpoints
  console.log('1. LOCAL HEALTH ENDPOINTS:');
  const h1 = await request('http://localhost:8080/health');
  console.log(`- GET /health => HTTP ${h1.status}: ${JSON.stringify(h1.body)}`);
  const h2 = await request('http://localhost:8080/api/health');
  console.log(`- GET /api/health => HTTP ${h2.status}: ${JSON.stringify(h2.body)}`);

  // 2. Web Admin Login via Vite Proxy (port 3000 -> 8080)
  console.log('\n2. WEB STORE ADMIN LOGIN VIA VITE PROXY (http://localhost:3000):');
  const failLogin = await request('http://localhost:3000/api/auth/login', { method: 'POST' }, {
    identifier: 'admin.indore@laundryflow.in',
    password: 'InvalidPassword123'
  });
  console.log(`- Failed login attempt => HTTP ${failLogin.status} ("${failLogin.body.message}")`);

  const okLogin = await request('http://localhost:3000/api/auth/login', { method: 'POST' }, {
    identifier: 'admin.indore@laundryflow.in',
    password: 'Indore@1234'
  });
  console.log(`- Successful Admin login => HTTP ${okLogin.status}`);
  console.log(`  Role: ${okLogin.body?.data?.user?.role}, Laundry: ${okLogin.body?.data?.user?.laundryId}`);
  console.log(`  Token issued: ${Boolean(okLogin.body?.data?.accessToken)}`);

  // 3. Customer Support Ticket Flow
  console.log('\n3. CUSTOMER SUPPORT TICKET WORKFLOW (LOCAL BACKEND):');
  await mongoose.connect(process.env.MONGO_URL);
  const User = require('../models/userModels');
  const Order = require('../models/orderModels');

  const orders = await Order.find().lean();
  let customerOrder = null;
  let customer = null;
  for (const o of orders) {
    if (o.user) {
      const u = await User.findById(o.user);
      if (u && u.role === 'user') {
        customerOrder = o;
        customer = u;
        break;
      }
    }
  }
  if (!customer) {
    customer = await User.findOne({ role: 'user' });
    if (orders.length > 0) {
      // Point first order to this customer for ownership test
      await Order.findByIdAndUpdate(orders[0]._id, { user: customer._id });
      customerOrder = await Order.findById(orders[0]._id).lean();
    }
  }
  const custToken = generateAccessToken(customer._id, 'user');
  const custHeaders = { Authorization: `Bearer ${custToken}` };

  const orderId = customerOrder ? customerOrder._id.toString() : null;
  console.log(`- Test Customer: ${customer.name} (${customer.email})`);
  console.log(`- Customer's Order ID: ${orderId}`);

  // Test unauthenticated ticket
  const unauth = await request('http://localhost:8080/api/support/tickets', { method: 'POST' }, {
    subject: 'Test',
    description: 'Test description 12345'
  });
  console.log(`- Unauthenticated POST /api/support/tickets => HTTP ${unauth.status} (${unauth.body.message})`);

  // Test invalid orderId
  const invalidOrder = await request('http://localhost:8080/api/support/tickets', {
    method: 'POST',
    headers: custHeaders
  }, {
    orderId: 'invalid-id-format',
    subject: 'Damaged Clothes',
    description: 'Shirt was damaged during washing cycle.'
  });
  console.log(`- Invalid Order ID => HTTP ${invalidOrder.status} (${invalidOrder.body.message})`);

  // Test Order Ownership Authorization (Customer B attempting to submit on Customer A's order)
  const otherCustomer = await User.findOne({ role: 'user', _id: { $ne: customer._id } });
  if (otherCustomer && orderId) {
    const otherToken = generateAccessToken(otherCustomer._id, 'user');
    const authFailure = await request('http://localhost:8080/api/support/tickets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherToken}` }
    }, {
      orderId,
      category: 'order_issue',
      subject: 'Unauthorized ticket',
      description: 'Attempting to report issue on someone elses order.'
    });
    console.log(`- Order ownership validation (Cross-customer ticket) => HTTP ${authFailure.status} ("${authFailure.body.message}")`);
  }

  // Test authenticated ticket creation
  const createdTicket = await request('http://localhost:8080/api/support/tickets', {
    method: 'POST',
    headers: custHeaders
  }, {
    orderId,
    category: 'damaged_item',
    subject: 'Damaged Clothes in Delivery',
    description: 'One cotton shirt had a torn collar upon delivery.'
  });
  console.log(`- Authenticated ticket creation => HTTP ${createdTicket.status} (Ticket: ${createdTicket.body?.data?.ticketId})`);

  // Test rapid duplicate ticket prevention
  const duplicateTicket = await request('http://localhost:8080/api/support/tickets', {
    method: 'POST',
    headers: custHeaders
  }, {
    orderId,
    category: 'damaged_item',
    subject: 'Damaged Clothes in Delivery',
    description: 'One cotton shirt had a torn collar upon delivery.'
  });
  console.log(`- Duplicate submission prevention => HTTP ${duplicateTicket.status} ("${duplicateTicket.body.message}")`);
  console.log(`  Idempotent Ticket ID matches: ${duplicateTicket.body?.data?.ticketId === createdTicket.body?.data?.ticketId}`);

  // Test ticket retrieval by order
  if (orderId) {
    const byOrder = await request(`http://localhost:8080/api/support/order/${orderId}`, {
      headers: custHeaders
    });
    console.log(`- GET /api/support/order/${orderId} => HTTP ${byOrder.status} (Count: ${byOrder.body.count})`);
  }

  // Test customer ticket history retrieval
  const myTickets = await request('http://localhost:8080/api/support/my-tickets', {
    headers: custHeaders
  });
  console.log(`- GET /api/support/my-tickets => HTTP ${myTickets.status} (Count: ${myTickets.body.count})`);

  // 4. Remote Render State Inspection
  console.log('\n4. REMOTE RENDER PRODUCTION INSPECTION:');
  try {
    const remoteSupport = await request('https://laundryflow-657q.onrender.com/api/support/tickets', {
      method: 'POST'
    }, { subject: 'Ping', description: 'Ping test' });
    console.log(`- POST https://laundryflow-657q.onrender.com/api/support/tickets => HTTP ${remoteSupport.status} (${JSON.stringify(remoteSupport.body)})`);
  } catch (err) {
    console.log(`- Render request error: ${err.message}`);
  }

  await mongoose.disconnect();
  console.log('\n====================================================');
  console.log('VERIFICATION COMPLETE');
  console.log('====================================================');
  process.exit(0);
}

run().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
