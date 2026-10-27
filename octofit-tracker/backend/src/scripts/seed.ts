import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Activity, Team, User, Workout } from '../models/index.js';

// Seed stable demo records without clearing data owned by the application.
async function upsertDemoUser(name: string, email: string, teamId: InstanceType<typeof Team>['_id'], fitnessGoal: string) {
  const fixtureKey = `user:${email}`;
  const previousUser = await User.findOne({ $or: [{ fixtureKey }, { email }] }).select('_id team email fixtureKey');
  if (previousUser?.team && previousUser.team.toString() !== teamId.toString()) {
    await Team.updateOne({ _id: previousUser.team }, { $pull: { members: previousUser._id } });
  }

  const documentQuery = previousUser ? { _id: previousUser._id } : { fixtureKey };
  const user = await User.findOneAndUpdate(
    documentQuery,
    { $set: { fixtureKey, name, email, team: teamId, fitnessGoal } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
  await Team.updateOne({ _id: teamId }, { $addToSet: { members: user._id } });
  return user;
}

export async function seed() {
  await connectDatabase();
  try {
    const octocats = await Team.findOneAndUpdate(
      { $or: [{ fixtureKey: 'team:octocats' }, { name: 'Octocats' }] },
      { $set: { fixtureKey: 'team:octocats', name: 'Octocats', mascot: 'Mona' } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
    const robocats = await Team.findOneAndUpdate(
      { $or: [{ fixtureKey: 'team:robocats' }, { name: 'Robocats' }] },
      { $set: { fixtureKey: 'team:robocats', name: 'Robocats', mascot: 'Hubot' } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );
    const mona = await upsertDemoUser('Mona', 'mona@example.com', octocats._id, 'endurance');
    const hubot = await upsertDemoUser('Hubot', 'hubot@example.com', robocats._id, 'strength');

    const monaRunAt = new Date('2026-01-10T12:00:00.000Z');
    const hubotCycleAt = new Date('2026-01-11T12:00:00.000Z');
    await Activity.updateOne(
      { $or: [{ fixtureKey: 'activity:mona:run:2026-01-10T12:00:00.000Z' }, { user: mona._id, team: octocats._id, type: 'run', occurredAt: monaRunAt }] },
      { $set: { fixtureKey: 'activity:mona:run:2026-01-10T12:00:00.000Z', user: mona._id, team: octocats._id, type: 'run', minutes: 40, points: 40, occurredAt: monaRunAt } },
      { upsert: true, runValidators: true },
    );
    await Activity.updateOne(
      { $or: [{ fixtureKey: 'activity:hubot:cycle:2026-01-11T12:00:00.000Z' }, { user: hubot._id, team: robocats._id, type: 'cycle', occurredAt: hubotCycleAt }] },
      { $set: { fixtureKey: 'activity:hubot:cycle:2026-01-11T12:00:00.000Z', user: hubot._id, team: robocats._id, type: 'cycle', minutes: 25, points: 25, occurredAt: hubotCycleAt } },
      { upsert: true, runValidators: true },
    );
    await Workout.updateOne(
      { $or: [{ fixtureKey: 'workout:intervals' }, { title: 'Intervals' }] },
      { $set: { fixtureKey: 'workout:intervals', title: 'Intervals', focus: 'endurance', minutes: 30, difficulty: 'moderate' } },
      { upsert: true, runValidators: true },
    );
    await Workout.updateOne(
      { $or: [{ fixtureKey: 'workout:strength-circuit' }, { title: 'Strength Circuit' }] },
      { $set: { fixtureKey: 'workout:strength-circuit', title: 'Strength Circuit', focus: 'strength', minutes: 30, difficulty: 'moderate' } },
      { upsert: true, runValidators: true },
    );
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  await seed();
}
