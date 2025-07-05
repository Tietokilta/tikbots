const { Scenes, Markup } = require('telegraf')
const Feedback = require('../models/feedback-model')
const { isNotCallback } = require('../utils/flow-helpers')

const MAX_FEEDBACK_LENGTH = 1000
const MAX_FEEDBACKS_PER_USER = 2

const cancelKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('Cancel', 'exit_wizard')
])

const feedbackWizard = new Scenes.WizardScene(
  'feedback_wizard',
  async (ctx) => {
    const sentMessage = await ctx.reply('How many hours do you typically train per week? (Enter a number)',
      cancelKeyboard
    )
    ctx.wizard.state.trainingMessageId = sentMessage.message_id
    return ctx.wizard.next()
  },
  async (ctx) => {
    const input = ctx.message.text.trim()
    const hours = parseFloat(input)
    if (isNaN(hours) || hours < 0) {
      await ctx.reply('Invalid number. Please enter a positive number for your training hours.')
      return
    }
    ctx.wizard.state.trainingHours = hours
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.wizard.state.trainingMessageId,
      null,
      `How many hours do you typically train per week? ${hours} hours.`
    )

    let ratingButtons = []
    for (let i = 1; i <= 10; i++) {
      ratingButtons.push(Markup.button.callback(String(i), `rating_${i}`))
    }
    let rows = []
    for (let i = 0; i < ratingButtons.length; i += 5) {
      rows.push(ratingButtons.slice(i, i + 5))
    }
    rows.push([Markup.button.callback('Cancel & Exit', 'exit_wizard')])

    const sentMessage = await ctx.reply(
      'On a scale of 1–10, how much did you enjoy the challenge?',
      Markup.inlineKeyboard(rows)
    )
    ctx.wizard.state.buttonMessageId = sentMessage.message_id
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return
    const sentMessage = await ctx.reply(`What could be improved? Please write your feedback below. (max ${MAX_FEEDBACK_LENGTH} characters)`,
      cancelKeyboard
    )
    ctx.wizard.state.feedbackMessageId = sentMessage.message_id
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (!ctx.message || !ctx.message.text) {
      await ctx.reply('Please provide your suggestions for improvement as text.')
      return
    }
    const text = ctx.message.text.trim()
    ctx.wizard.state.improvementFeedback = text
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.wizard.state.feedbackMessageId,
      null,
      `What could be improved? Please write your feedback below.`
    )

    if (text.length > MAX_FEEDBACK_LENGTH) {
      await ctx.reply(`Your feedback is too long (max ${MAX_FEEDBACK_LENGTH} characters). Please shorten your message.`)
      return
    }

    const count = await Feedback.countDocuments({ userId: ctx.from.id })
    if (count >= MAX_FEEDBACKS_PER_USER) {
      await ctx.reply('You have reached the maximum number of feedback submissions allowed.')
      return ctx.scene.leave()
    }

    const feedback = new Feedback({
      userId: ctx.from.id,
      username: ctx.from.username || ctx.from.first_name,
      trainingHours: ctx.wizard.state.trainingHours,
      enjoymentRating: ctx.wizard.state.enjoymentRating,
      improvementFeedback: ctx.wizard.state.improvementFeedback
    })
    try {
      await feedback.save()
      await ctx.reply('Thank you for your feedback!')
    } catch (err) {
      console.error('Error saving feedback:', err)
      await ctx.reply('There was an error saving your feedback. Please try again or contact @EppuRuotsalainen.')
    }
    return ctx.scene.leave()
  }
)

feedbackWizard.action(/^rating_(\d+)$/, async (ctx) => {
  const rating = parseInt(ctx.match[1], 10)
  if (isNaN(rating) || rating < 1 || rating > 10) {
    await ctx.answerCbQuery('Invalid rating. Please choose a value between 1 and 10.')
    return
  }
  await ctx.telegram.editMessageText(
    ctx.chat.id,
    ctx.wizard.state.buttonMessageId,
    null,
    `On a scale of 1–10, how much did you enjoy the challenge? You gave a rating of ${rating}.`
  )
  ctx.wizard.state.enjoymentRating = rating
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
})

feedbackWizard.action('exit_wizard', async (ctx) => {
  await ctx.editMessageReplyMarkup({})
  await ctx.reply('Feedback process canceled. You can start again with /feedback.')
  return ctx.scene.leave()
})

module.exports = { feedbackWizard }
