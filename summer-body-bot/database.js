const mongoose = require('mongoose')
const { mongodbUri } = require('./config')

const connectDatabase = async () => {
  try {
    await mongoose.connect(mongodbUri)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect()
    console.log('MongoDB disconnected')
  } catch (error) {
    console.error('MongoDB disconnection error:', error)
    process.exit(1)
  }
}

module.exports = { connectDatabase, disconnectDatabase }
