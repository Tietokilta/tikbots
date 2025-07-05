const { Scenes, Markup } = require('telegraf')
const pointService = require('../services/point-service')
const userService = require('../services/user-service')
const { kmActivities, otherActivities } = require('../config/multipliers')
const { isNotCallback } = require('../utils/flow-helpers')

const sportsActivityWizard = new Scenes.WizardScene(
  'sports_activity_wizard',
  async (ctx) => {
    const user = await userService.findUser(ctx.from.id)
    if (!user) {
      await ctx.reply('User not found. Please /register first.')
      return ctx.scene.leave()
    }
    await ctx.reply(
      'What type of exercise did you do this week?',
      Markup.inlineKeyboard([
        [Markup.button.callback('Kilometre‑based', 'type_km')],
        [Markup.button.callback('Hour-based', 'type_other')],
        [Markup.button.callback('Cancel & Exit', 'exit_wizard')]
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return

    const exerciseType = ctx.callbackQuery.data.split('_')[1]
    ctx.wizard.state.exerciseType = exerciseType
    await ctx.editMessageReplyMarkup({})
    const activities = exerciseType === 'km' ? kmActivities : otherActivities
    const prompt = exerciseType === 'km' ? 'Which activity did you complete?' : 'Which intensity did you perform?'
    const keyboard = activities.map(act => [Markup.button.callback(act.label.charAt(0).toUpperCase() + act.label.slice(1), `select_${exerciseType}_${act.key}`)])
    keyboard.push([Markup.button.callback('Cancel & Exit', 'exit_wizard')])
    await ctx.reply(prompt, Markup.inlineKeyboard(keyboard))
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return

    const activity = ctx.wizard.state.selectedActivity
    if (!activity) {
      await ctx.reply('No activity selected. Please try again.')
      return ctx.scene.leave()
    }
    const promptText = activity.type === 'km'
      ? `How many kilometres did you cover during ${activity.label}? (Enter a number)`
      : `How many minutes did you spend on ${activity.label}? (Enter a number)`
    const cancelKeyboard = Markup.inlineKeyboard([Markup.button.callback('Cancel & Exit', 'exit_wizard')])
    const msg = await ctx.reply(promptText, cancelKeyboard)
    ctx.wizard.state.numericPromptMsgId = msg.message_id
    return ctx.wizard.next()
  },
  async (ctx) => {
    const value = parseFloat(ctx.message.text)
    if (isNaN(value) || value <= 0) {
      await ctx.reply('Invalid input. Please enter a positive number.')
      return ctx.wizard.selectStep(ctx.wizard.cursor)
    }
    try {
      await ctx.telegram.editMessageReplyMarkup(
        ctx.chat.id,
        ctx.wizard.state.numericPromptMsgId,
        null,
        {}
      )
    } catch (_err) { /**/ }
    const activity = ctx.wizard.state.selectedActivity
    let duration, unitLabel
    if (activity.type === 'km') {
      duration = value
      unitLabel = 'kilometres'
    } else {
      duration = value / 60
      unitLabel = 'minutes'
    }
    if (unitLabel === 'kilometres' && duration >= activity.maxAllowed && activity.maxAllowed !== undefined) {
      await ctx.reply(`Woah, ${activity.label} for ${value} ${unitLabel}? Send a DM to @EppuRuotsalainen to get your points or start again with /addexercise.`)
      return ctx.scene.leave()
    }
    if (unitLabel === 'minutes' && duration >= activity.maxAllowed && activity.maxAllowed !== undefined) {
      await ctx.reply(`Woah, ${value} ${unitLabel} of ${activity.label}? Send a DM to @EppuRuotsalainen to get your points or start again with /addexercise.`)
      return ctx.scene.leave()
    }
    const pointsEarned = duration * activity.multiplier
    ctx.wizard.state.activityValue = value
    ctx.wizard.state.convertedValue = activity.type === 'km' ? value : duration
    ctx.wizard.state.pointsEarned = pointsEarned
    const confirmKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('Confirm', 'confirm_activity')],
      [Markup.button.callback('Start Over', 'start_over')],
      [Markup.button.callback('Cancel & Exit', 'exit_wizard')]
    ])
    let confirmMessage
    if (activity.type === 'km') {
      confirmMessage = `You did ${activity.label} for ${value} ${unitLabel}, earning ${pointsEarned.toFixed(2)} points. Do you confirm?`
    } else {
      confirmMessage = `You spent ${value} ${unitLabel} (${duration.toFixed(2)} hours) on ${activity.label}, earning ${pointsEarned.toFixed(2)} points. Do you confirm?`
    }
    await ctx.reply(confirmMessage, confirmKeyboard)
    return ctx.wizard.next()
  },
)

sportsActivityWizard.action('confirm_activity', async (ctx) => {
  await ctx.editMessageReplyMarkup({})
  const userId = ctx.from.id
  const pointsData = { exercise: ctx.wizard.state.pointsEarned, total: ctx.wizard.state.pointsEarned }
  try {
    await pointService.addPoints(userId, pointsData)
    await ctx.editMessageText(
      `Activity recorded! You earned ${ctx.wizard.state.pointsEarned.toFixed(2)} points for ${ctx.wizard.state.selectedActivity.label}.`
    )
  } catch (_err) {
    await ctx.reply('There was an error recording your activity. Please try again later.')
  }
  return ctx.scene.leave()
})

sportsActivityWizard.action(/^select_(km|other)_(.+)$/, async (ctx) => {
  const exerciseType = ctx.match[1]
  const selectedKey = ctx.match[2]
  const activities = exerciseType === 'km' ? kmActivities : otherActivities
  const activity = activities.find(a => a.key === selectedKey)
  if (!activity) {
    await ctx.reply('Invalid selection. Please try again.')
    return ctx.scene.leave()
  }
  ctx.wizard.state.selectedActivity = activity
  await ctx.editMessageReplyMarkup({})
  return ctx.wizard.steps[ctx.wizard.cursor](ctx)
})

sportsActivityWizard.action('exit_wizard', async (ctx) => {
  await ctx.editMessageReplyMarkup({})
  await ctx.reply('Canceled. You can add your exercise later using /addexercise.')
  return ctx.scene.leave()
})

sportsActivityWizard.action('start_over', async (ctx) => {
  await ctx.editMessageText('Starting over!')
  ctx.wizard.selectStep(0)
  return ctx.wizard.steps[0](ctx)
})

module.exports = { sportsActivityWizard }