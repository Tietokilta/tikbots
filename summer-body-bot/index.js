const { connectDatabase, disconnectDatabase } = require('./database')
const bot = require('./bot')
const scheduleReminders = require('./utils/schedule-reminders')

async function handleError(error) {
  console.error('Unexpected error occurred:', error)

  if (error.response && error.response.description) {
    console.error('Error response:', error.response.description)
  }

  if (error.response && error.response.error_code === 403) {
    console.error('Handling 403 error: The bot was kicked from the group chat')
  }

  console.log('Attempting to restart the bot...')
  setTimeout(startBot, 5000)
}

async function startBot() {
  try {
    await connectDatabase()
    scheduleReminders()
    console.log('Bot started')
    await bot.launch()
  } catch (err) {
    console.error('Could not start the bot:', err)
    handleError(err)
  }
}

startBot()

process.once('SIGINT', () => {
  bot.stop('SIGINT')
    .then(disconnectDatabase)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error during shutdown:', error)
      process.exit(1)
    })
})

process.once('SIGTERM', () => {
  bot.stop('SIGTERM')
    .then(disconnectDatabase)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error during shutdown:', error)
      process.exit(1)
    })
})
