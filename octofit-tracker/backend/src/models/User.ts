import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  fixtureKey: { type: String, sparse: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  fitnessGoal: { type: String, required: true, trim: true },
});

export const User = model('User', userSchema);
