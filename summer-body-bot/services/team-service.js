const Team = require('../models/team-model')
const User = require('../models/user-model')

const createTeam = async (teamName, guild) => {
  try {
    const team = new Team({ name: teamName, guild: guild })
    await team.save()
    return team
  } catch (error) {
    console.error('Error occurred in createTeam:', error)
    throw error
  }
}

const getTeamById = async (teamId) => {
  try {
    const team = await Team.findById(teamId)
    return team
  } catch (error) {
    console.error('Error occurred in getTeamById:', error)
    throw new Error('Error retrieving team')
  }
}

const joinTeam = async (userId, teamId) => {
  try {
    const team = await Team.findById(teamId)
    const user = await User.findById(userId)
    await team.addUserPoints(user.points)
    team.members.push(userId)
    await team.save()
  } catch (error) {
    console.error('Error occurred in joinTeam:', error)
    throw new Error('Error joining team')
  }
}

const leaveTeam = async (userId, teamId) => {
  try {
    const team = await Team.findById(teamId)
    const user = await User.findById(userId)
    await team.deleteUserPoints(user.points)
    team.members = team.members.filter(memberId => memberId.toString() !== userId.toString())
    await team.save()
    await User.findByIdAndUpdate(userId, { $unset: { team: 1 } })
    await user.save()
    if (team.members.length === 0) await deleteTeam(teamId)
  } catch (error) {
    console.error('Error occurred in leaveTeam:', error)
    throw new Error('Error leaving team')
  }
}

const deleteTeam = async (teamId) => {
  try {
    const result = await Team.deleteOne({ _id: teamId })
    return result
  } catch (error) {
    console.error('Error occurred in deleteTeam:', error)
    throw new Error('Error deleting team')
  }
}

module.exports = {
  createTeam,
  deleteTeam,
  joinTeam,
  leaveTeam,
  getTeamById
}
