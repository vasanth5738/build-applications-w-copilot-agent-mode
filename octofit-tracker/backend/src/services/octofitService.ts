import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Activity payload is required.');
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (!userId || !teamId || !type || minutes === undefined || minutes === null) {
    throw badRequest('userId, teamId, type, and minutes are required.');
  }

  if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
    throw badRequest('userId must be a valid MongoDB ObjectId.');
  }
  if (typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId)) {
    throw badRequest('teamId must be a valid MongoDB ObjectId.');
  }

  if (typeof type !== 'string' || !type.trim()) {
    throw badRequest('type is required.');
  }

  const numericMinutes = Number(minutes);
  if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) {
    throw badRequest('minutes must be a positive number.');
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);

  if (!user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }
  if (!team) {
    throw Object.assign(new Error('Team not found.'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes: numericMinutes,
    points: numericMinutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Team payload is required.');
  }

  const { name, mascot, members } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || !name.trim()) {
    throw badRequest('Team name is required.');
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw badRequest('Team mascot is required.');
  }

  const memberIds = Array.isArray(members) ? members : [];
  const validMemberIds = memberIds.filter((member) => typeof member === 'string' && Types.ObjectId.isValid(member));

  if (memberIds.length !== validMemberIds.length) {
    throw badRequest('members must contain valid MongoDB ObjectId strings.');
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: validMemberIds,
  });
}

export async function getLeaderboard() {
  const pipeline: import('mongoose').PipelineStage[] = [
    {
      $lookup: {
        from: 'teams',
        localField: 'team',
        foreignField: '_id',
        as: 'teamData',
      },
    },
    {
      $unwind: '$teamData',
    },
    {
      $group: {
        _id: '$team',
        teamName: { $first: '$teamData.name' },
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $sort: { totalPoints: -1, teamName: 1 },
    },
    {
      $project: {
        _id: 0,
        teamName: 1,
        totalPoints: 1,
      },
    },
  ];

  const leaderboard = await Activity.aggregate(pipeline);
  return leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const activityTypes = recentActivities.map((activity) => activity.type).filter(Boolean);
  const goal = user.fitnessGoal ?? 'general';

  const suggestions = await Workout.find({
    $or: [
      { focus: new RegExp(goal, 'i') },
      ...activityTypes.map((type) => ({ focus: new RegExp(type, 'i') })),
    ],
  }).lean();

  if (suggestions.length === 0) {
    return [];
  }

  const rankedSuggestions = suggestions.map((suggestion) => {
    const typeMatches = activityTypes.includes(suggestion.focus);
    const goalMatches = new RegExp(goal, 'i').test(suggestion.focus ?? '');
    const score = Number(typeMatches) + Number(goalMatches);
    const reason = goalMatches
      ? `Matches your goal of ${user.fitnessGoal} and recent activity patterns.`
      : typeMatches
        ? `Matches your recent ${activityTypes[0]} activity pattern.`
        : 'Supports your overall training plan.';

    return {
      ...suggestion,
      reason,
      score,
    };
  });

  return rankedSuggestions
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .map(({ score, ...suggestion }) => suggestion);
}

export { User };
