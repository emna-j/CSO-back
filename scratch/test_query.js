import mongoose from 'mongoose';
import { MONGO_URI } from '../config.js';
import AuditionParams from '../models/auditionParamsModel.js';

async function testFind() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected");
    const sets = await AuditionParams.find().sort({ createdAt: -1 });
    console.log("Success, found", sets.length);
    process.exit(0);
  } catch (err) {
    console.error("FAILURE:", err);
    process.exit(1);
  }
}
testFind();
