const User = require('../models/user-model')
const { reminderMessage } = require('../config/constants')

const createUser = async (userData) => {
  try {
    const user = new User(userData)
    await user.save()
    return user
  } catch (error) {
    console.error('Error occurred in createUser: ', error)
    throw new Error('Error creating user')
  }
}

const findUser = async (userId) => {
  try {
    const user = await User.findOne({ userId: userId })
    return user
  } catch (error) {
    console.error('Error occurred in findUser: ', error)
    throw new Error('Error finding user')
  }
}

const getAllUsers = async () => {
  try {
    const users = await User.find({})
    return users
  } catch (error) {
    console.error('Error occurred in getAllUsers:', error)
    return []
  }
}

const deleteUser = async (userId) => {
  try {
    const result = await User.deleteOne({ userId: userId })
    return result
  } catch (error) {
    console.error('Error occurred in deleteUser:', error)
    throw new Error('Error deleting user')
  }
}

const addUserToTeam = async (userId, teamId) => {
  try {
    const user = await User.findById(userId)
    user.team = teamId
    await user.save()
    return user
  } catch (error) {
    console.error('Error occurred in addUserToTeam:', error)
    throw new Error('Error adding user to team')
  }
}

const sendReminder = async (bot) => {
  const users = await getAllUsers()
  const today = new Date().toISOString().split('T')[0]
  for (const user of users) {
    if (!user.lastSubmission || user.lastSubmission.toISOString().split('T')[0] !== today) {
      try {
        const chat = await bot.telegram.getChat(user.userId)
        if (chat) {
          await bot.telegram.sendMessage(user.userId, reminderMessage)
        }
      } catch (err) {
        console.error(`Error sending reminder to ${user.username}:`, err)
      }
    }
  }
}

module.exports = {
  createUser,
  getAllUsers,
  deleteUser,
  findUser,
  addUserToTeam,
  sendReminder
}
