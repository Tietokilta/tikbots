const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  guild: {
    type: String, 
    enum: ['TiK', 'DG', 'FK', 'PT', 'AS', 'SIK', 'KIK', 'MK', 'IK', 'Athene', 'Prodeko', 'Inkubio', 'KY', 'TOKYO', 'AK', 'TF', 'PJK', 'VK', 'KK'], 
    required: true 
  },
  points: {
    exercise: { type: Number, default: 0 },
    sportsTurn: { type: Number, default: 0 },
    trySport: { type: Number, default: 0 },
    tryRecipe: { type: Number, default: 0 },
    goodSleep: { type: Number, default: 0 },
    meditate: { type: Number, default: 0 },
    lessAlc: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  lastSubmission: {
    type: Date,
    default: null,
  }
}, { timestamps: true })

userSchema.index({ team: 1 })

userSchema.methods.addPoints = function(pointsData) {
  Object.keys(pointsData).forEach(key => {
    this.points[key] += pointsData[key]
    if (key.toString() === 'sportsTurn') { this.lastSubmission = new Date() }
  })
  return this.save()
}

const User = mongoose.model('User', userSchema)

User.validCategories = Object.keys(userSchema.obj.points)
User.validGuilds = userSchema.obj.guild.enum

module.exports = User
