require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/dbConfig');
const Service = require('../models/serviceModels');
const { DEFAULT_DRY_CLEAN_ITEMS } = require('../constants/catalog');

async function fix() {
  await connectDB();
  console.log('Connected to DB');

  // Update specific service 6adcfeeac96587e03eed7482
  const s = await Service.findById('6adcfeeac96587e03eed7482');
  if (s) {
    s.items = DEFAULT_DRY_CLEAN_ITEMS;
    await s.save();
    console.log('Saved items on 6adcfeeac96587e03eed7482, count:', s.items.length);
  }

  // Also update any other dry clean service without items
  const allDryCleans = await Service.find({
    category: 'dry_clean',
    $or: [{ items: { $exists: false } }, { items: { $size: 0 } }]
  });
  console.log('Other dry cleans needing items:', allDryCleans.length);
  for (const dc of allDryCleans) {
    dc.items = DEFAULT_DRY_CLEAN_ITEMS;
    await dc.save();
    console.log('Saved items for:', dc._id.toString(), dc.name);
  }

  const check = await Service.findById('6adcfeeac96587e03eed7482');
  console.log('Verified 6adcfeeac96587e03eed7482 items length:', check.items.length);
  const shirt = check.items.find(i => i.name === 'Shirt');
  console.log('Shirt price in items:', shirt?.price);

  await mongoose.disconnect();
  console.log('Done!');
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
