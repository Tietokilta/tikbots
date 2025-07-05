require('dotenv').config()

const commands = process.env.SECRET_COMMANDS ? process.env.SECRET_COMMANDS.split(',') : []

const responses = {}
commands.forEach(cmd => { responses[cmd] = process.env[`SECRET_RESPONSE_${cmd.toUpperCase()}`] })

module.exports = {
  telegramToken: process.env.TELEGRAM_TOKEN,
  mongodbUri: process.env.MONGODB_URI,
  startDate: process.env.COMPETITION_START_DATE,
  endDate: process.env.COMPETITION_END_DATE,
  reminderTime: process.env.REMINDER_TIME,
  reminderMessage: process.env.REMINDER_MSG,
  allowedDates: process.env.ALLOWED_DATES ? process.env.ALLOWED_DATES.split(',') : [],
  maxUsage: process.env.SECRET_MAX_USAGE ? parseInt(process.env.SECRET_MAX_USAGE, 10) : 5,
  commands: commands,
  responses: responses,
  emojis: ['🥇', '🥈', '🥉', ' ⒋ ', ' ⒌ ', ' ⒍ ', ' ⒎ ', ' ⒏ ', ' ⒐ ', ' ⒑ ', ' ⒒ ', ' ⒓ ', ' ⒔ ', ' ⒕ ', ' ⒖ ', ' ⒗ ', ' ⒘ ', ' ⒙ ', ' ⒚ ', ' ⒛ '],
  Error: "Something went wrong. Please try again later or contact support.",
  adminIds: process.env.ADMINS ? process.env.ADMINS.split(',').map(id => id.trim()) : []
}