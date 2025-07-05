const schedule = require('node-schedule')
const bot = require('../bot')
const { sendReminder } = require('../services/user-service')
const { allowedDates, reminderTime } = require('../config/constants')

const scheduleReminders = () => {
  try {
    const timeZoneAdj = -3
    const [hourStr, minuteStr] = reminderTime.split(':')
    const hour = parseInt(hourStr, 10) + timeZoneAdj
    const minute = parseInt(minuteStr, 10)

    allowedDates.forEach((date) => {
      const [year, month, day] = date.split('-').map(Number)
      const reminderDate = new Date(year, month - 1, day, hour, minute, 0)
      const reminderString = `${day}.${month}.${year} at ${hourStr}:${minute.toString().padStart(2, '0')}`
      if (reminderDate < new Date()) {
        console.log(`Skipping scheduling reminder for ${reminderString} as it is in the past`)
        return
      }
      console.log(`Scheduling reminder for ${reminderString}`)
      schedule.scheduleJob(reminderDate, function() {
        console.log(`Sending reminders (${reminderString})`)
        sendReminder(bot)
      })
    })

  } catch (error) {
    console.error('Scheduling error:', error)
  }
}

module.exports = scheduleReminders