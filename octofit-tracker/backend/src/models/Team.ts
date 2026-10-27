import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
  fixtureKey: { type: String, sparse: true, unique: true },
  name: { type: String, required: true, trim: true },
  mascot: { type: String, required: true, trim: true },
  members: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  },
});

export const Team = model('Team', teamSchema);
