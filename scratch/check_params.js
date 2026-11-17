import mongoose from 'mongoose';
import { MONGO_URI } from '../config.js';
import AuditionParams from '../models/auditionParamsModel.js';

async function checkData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB");
    
    const count = await AuditionParams.countDocuments();
    console.log(`Total AuditionParams: ${count}`);
    
    const docs = await AuditionParams.find().limit(5);
    console.log("Sample docs:", JSON.stringify(docs, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

checkData();
