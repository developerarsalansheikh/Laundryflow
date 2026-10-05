require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./server/models/userModels');

async function check() {
  await mongoose.connect(process.env.MONGO_URL);
  const ramesh = await User.find({ name: /Ramesh/i }).lean();
  console.log('RAMESH USERS:', JSON.stringify(ramesh, null, 2));

  const allDrivers = await User.find({ role: /driver|delivery/i }).select('name email phone role isApproved isActive isVerified').lean();
  console.log('ALL DRIVER/DELIVERY USERS:', allDrivers);
  process.exit(0);
}
check().catch(console.error);
