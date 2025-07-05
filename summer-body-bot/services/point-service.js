const Team = require('../models/team-model')
const User = require('../models/user-model')
const { PointMultipliers, kmActivities, otherActivities } = require('../config/multipliers')

/**
 * Adds points to a user and updates the user's team if one exists.
 */
const addPoints = async (userId, pointsData) => {
  try {
    const user = await User.findOne({ userId: userId })
    if (!user) throw new Error('User not found')
    await user.addPoints(pointsData)
    if (user.team) {
      const team = await Team.findById(user.team)
      if (team) {
        await team.addUserPoints(pointsData)
      }
    }
    return user
  } catch (error) {
    console.error('Error occurred in addPoints:', error)
    throw new Error('Error adding points')
  }
}

const adjustPoints = async (username, category, quantity, extra = {}) => {
  try {
    const user = await User.findOne({ username })
    if (!user) throw new Error('User not found')
    let multiplier = 1
    if (category === 'exercise') {
      const { activityType, activityKey } = extra
      if (!activityType || !activityKey) {
        throw new Error('For exercise adjustments, please provide both activityType ("km" or "other") and activityKey')
      }
      let activityArray
      if (activityType === 'km') {
        activityArray = kmActivities
      } else if (activityType === 'other') {
        activityArray = otherActivities
      } else {
        throw new Error('Invalid activityType. Use "km" or "other".')
      }
      const activity = activityArray.find(act => act.key === activityKey)
      if (!activity) throw new Error('Activity not found')
      multiplier = activity.multiplier
    } else {
      if (PointMultipliers.hasOwnProperty(category)) {
        multiplier = PointMultipliers[category]
      } else {
        throw new Error(`Category "${category}" is not supported for adjustment`)
      }
    }

    const deltaPoints = quantity * multiplier

    const oldValue = user.points[category] || 0
    const newValue = Math.max(0, oldValue + deltaPoints)
    const diff = newValue - oldValue
    user.points[category] = newValue
    user.points.total = Math.max(0, (user.points.total || 0) + diff)
    await user.save()

    if (user.team) {
      const team = await Team.findById(user.team)
      if (team) {
        const oldTeamValue = team.points[category] || 0
        const newTeamValue = Math.max(0, oldTeamValue + diff)
        team.points[category] = newTeamValue
        team.points.total = Math.max(0, (team.points.total || 0) + diff)
        await team.save()
      }
    }
    return user
  } catch (error) {
    console.error('Error occurred in adjustPoints:', error)
    throw new Error('Error adjusting points')
  }
}

/**
 * Retrieves team rankings by aggregating user points.
 * The pipeline:
 * 1. Filters for users with non-zero total points and a team.
 * 2. Groups by team and computes the sum, count, and average of total points.
 * 3. Filters out teams with fewer than 3 participants.
 * 4. Looks up team information.
 * 5. Projects the team name and rounded average points.
 * 6. Sorts by average points descending and limits to the top 15.
 */
const getTeamRankings = async () => {
  try {
    const pipeline = [
      { $match: { "points.total": { $gt: 0 }, team: { $ne: null } } },
      { $group: {
          _id: "$team",
          totalPoints: { $sum: "$points.total" },
          count: { $sum: 1 },
          averagePoints: { $avg: "$points.total" }
      }},
      { $match: { count: { $gte: 3 } } },
      { $lookup: {
          from: "teams",
          localField: "_id",
          foreignField: "_id",
          as: "teamInfo"
      }},
      { $unwind: "$teamInfo" },
      { $project: {
          _id: 0,
          name: "$teamInfo.name",
          totalPoints: 1,
          averagePointsPerMember: { $round: ["$averagePoints", 1] }
      }},
      { $sort: { averagePointsPerMember: -1 } },
      { $limit: 15 }
    ]

    const rankings = await User.aggregate(pipeline)
    return rankings
  } catch (error) {
    console.error('Error occurred in getTeamRankings:', error)
    throw new Error('Error fetching team rankings')
  }
}

/**
 * Retrieves rankings of team members for the team to which the user belongs.
 */
const getTeamMemberRankings = async (userId) => {
  try {
    const user = await User.findOne({ userId: userId })
    if (!user) throw new Error('User not found')
    const team = await Team.findById(user.team)
    if (!team) throw new Error('Team not found')
    const teamMembers = await User.find({ team: user.team }).sort({ 'points.total': -1 })
    return teamMembers.map(member => ({
      name: member.name,
      totalPoints: member.points.total,
      teamName: team.name
    }))
  } catch (error) {
    console.error('Error occurred in getTeamMemberRankings:', error)
    throw new Error('Error fetching team member rankings')
  }
}

/**
 * Retrieves a summary of a user's points.
 */
const getUserSummary = async (userId) => {
  try {
    const user = await User.findOne({ userId: userId })
    if (!user) throw new Error('User not found')
    return user.points
  } catch (error) {
    console.error('Error occurred in getUserSummary:', error)
    throw new Error('Error fetching user summary')
  }
}

/**
 * Retrieves guild leaderboards by aggregating users by guild.
 * The pipeline:
 * 1. Filters for users with a positive total.
 * 2. Groups by guild and computes total points and count.
 * 3. Filters out guilds with fewer than 3 participants.
 * 4. Maps results to include the average (totalPoints/count) rounded to 1 decimal.
 */
const getGuildsLeaderboards = async () => {
  try {
    const pipeline = [
      { $match: { "points.total": { $gt: 0 } } },
      { $group: {
          _id: "$guild",
          totalPoints: { $sum: "$points.total" },
          count: { $sum: 1 }
      }},
      { $match: { count: { $gte: 3 } } }
    ]

    const guildAggregation = await User.aggregate(pipeline)
    return guildAggregation.map(item => ({
      guild: item._id,
      count: item.count,
      average: item.count > 0 ? (item.totalPoints / item.count).toFixed(1) : 0,
    }))
  } catch (error) {
    console.error('Error occurred in getGuildsLeaderboards:', error)
    throw new Error('Error fetching guild average points')
  }
}

/**
 * Retrieves guild top leaderboards based on the top 50% of scores.
 * The pipeline:
 * 1. Filters for users with positive total points.
 * 2. Groups by guild, pushing each user's total into an array.
 * 3. Adds a count field.
 * 4. Filters out guilds with fewer than 3 participants.
 * 5. Sorts the points array in descending order.
 * 6. Computes topCount = ceil(count/2) and slices the sorted array.
 * 7. Projects the sum and average of the top points.
 * 8. Maps the result to include rounded averages.
 */
const getGuildsTopLeaderboards = async () => {
  try {
    const pipeline = [
      { $match: { "points.total": { $gt: 0 } } },
      { $group: {
          _id: "$guild",
          pointsArray: { $push: "$points.total" },
      }},
      { $addFields: { count: { $size: "$pointsArray" } } },
      { $match: { count: { $gte: 3 } } },
      { $addFields: { sortedPoints: { $sortArray: { input: "$pointsArray", sortBy: -1 } } } },
      { $addFields: { topCount: { $ceil: { $divide: ["$count", 2] } } } },
      { $project: {
          guild: "$_id",
          count: 1,
          topPoints: { $slice: ["$sortedPoints", "$topCount"] },
      }},
      { $project: {
          guild: 1,
          count: 1,
          totalPoints: { $sum: "$topPoints" },
          average: { $avg: "$topPoints" },
      }},
    ]

    const guildAggregation = await User.aggregate(pipeline)
    return guildAggregation.map(item => ({
      guild: item.guild,
      count: item.count,
      average: item.average ? item.average.toFixed(1) : 0,
    }))
  } catch (error) {
    console.error('Error occurred in getTopGuildsLeaderboards:', error)
    throw new Error('Error fetching guild average points')
  }
}

/**
 * Retrieves guild totals and averages for every category.
 * This function uses dynamic aggregation so that if the valid categories change,
 * the pipeline automatically adjusts.
 *
 * The pipeline:
 * 1. Filters for users with positive total points.
 * 2. Groups by guild and computes the sum for each category (dynamically built).
 * 3. Projects a structure with the guild, number of participants, and for each category:
 *    - The total points and the average (rounded to 1 decimal).
 */
const getGuildsTotals = async () => {
  try {
    const categories = User.validCategories

    // Build the sum fields for the $group stage dynamically.
    const sumFields = {}
    categories.forEach(category => {
      sumFields[`${category}Total`] = { $sum: `$points.${category}` }
    })

    // Build the projection for the $project stage dynamically.
    const projectFields = {
      guild: "$_id",
      participants: 1,
      _id: 0,
    }
    categories.forEach(category => {
      projectFields[category] = {
        total: `$${category}Total`,
        average: {
          $cond: [
            { $gt: ["$participants", 0] },
            { $round: [{ $divide: [`$${category}Total`, "$participants"] }, 1] },
            0
          ]
        }
      }
    })

    const pipeline = [
      { $match: { "points.total": { $gt: 0 } } },
      { $group: {
          _id: "$guild",
          participants: { $sum: 1 },
          ...sumFields
      }},
      { $project: projectFields }
    ]

    const results = await User.aggregate(pipeline)
    return results
  } catch (error) {
    console.error('Error occurred in getGuildsTotals:', error)
    throw new Error('Error fetching guild totals with averages and participant counts')
  }
}

module.exports = {
  addPoints,
  adjustPoints,
  getTeamRankings,
  getTeamMemberRankings,
  getUserSummary,
  getGuildsLeaderboards,
  getGuildsTopLeaderboards,
  getGuildsTotals,
}
