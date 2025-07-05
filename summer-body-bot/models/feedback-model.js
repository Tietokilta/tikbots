const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String
  },
  trainingHours: {
    type: Number,
    required: true
  },
  enjoymentRating: {
    type: Number,
    required: true
  },
  improvementFeedback: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Feedback = mongoose.model('Feedback', feedbackSchema)
module.exports = Feedback
