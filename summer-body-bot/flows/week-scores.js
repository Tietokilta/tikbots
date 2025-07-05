const { Scenes, Markup } = require('telegraf')

const pointService = require('../services/point-service')
const userService = require('../services/user-service')

const texts = require('../utils/texts')
const canAddPoints = require('../utils/can-add-points')
const { formatList } = require('../utils/format-list')
const { PointMultipliers, DefaultPoints } = require('../config/multipliers')
const { isNotCallback } = require('../utils/flow-helpers')

const healthQuestions = [
  { key: 'goodSleep', label: 'Good Sleep', points: PointMultipliers.goodSleep },
  { key: 'meditate', label: 'Meditation', points: PointMultipliers.meditate },
  { key: 'lessAlc', label: 'Less Alcohol', points: PointMultipliers.lessAlc },
]

function buildNumericKeyboard(prefix, limit) {
  const buttons = []
  for (let i = 1; i <= limit; i++) {
    buttons.push(Markup.button.callback(String(i), `${prefix}_${i}`))
  }
  const rows = []
  for (let i = 0; i < buttons.length; i += 4) {
    rows.push(buttons.slice(i, i + 4))
  }
  rows.push([Markup.button.callback('Cancel & Exit', 'exit_wizard')])
  return rows
}

async function handleNumericCallback(ctx, prefix, stateKey, multiplier, questionIdKey) {
  if (await isNotCallback(ctx)) return
  const num = parseInt(ctx.match[1], 10)
  if (isNaN(num) || num < 0 || num > 8) {
    await ctx.reply('Invalid selection.')
    return
  }
  await ctx.telegram.editMessageText(
    ctx.chat.id,
    ctx.wizard.state[questionIdKey],
    null,
    `How many ${prefix === 'sports' ? 'sports sessions did you attend this week?' : 'new recipes/foods did you try this week?'} ${num} selected.`
  )
  const points = num * multiplier
  ctx.wizard.state.pointsData[stateKey] = points
  ctx.wizard.state.pointsData.total += points
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
  }

async function handleYesNoToggle(ctx, stateProp) {
  if (await isNotCallback(ctx)) return
  ctx.wizard.state[stateProp] = ctx.match[1] === 'yes'
  await ctx.editMessageReplyMarkup({})
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
  }

async function handleYesNoAction(ctx, dataKey, multiplier) {
  if (await isNotCallback(ctx)) return
  const isYes = ctx.match[1] === 'yes'
  ctx.wizard.state.pointsData[dataKey] = isYes ? multiplier : 0
  if (isYes) {
    ctx.wizard.state.pointsData.total += multiplier
  }
  await ctx.editMessageReplyMarkup({})
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
  }

const weekScoresWizard = new Scenes.WizardScene(
  'week_scores_wizard',
  async (ctx) => {
    const user = await userService.findUser(ctx.from.id)

    if (!user) {
      await ctx.reply('User not found. Please /register first.')
      return ctx.scene.leave()
    }

    const check = await canAddPoints(user.lastSubmission)
    if (!check.canAdd) {
      await ctx.reply(check.reason)
      return ctx.scene.leave()
    }

    ctx.wizard.state.pointsData = { ...DefaultPoints }

    await ctx.reply(
      'Did you attend any sports sessions this week (for example, your guild\'s regular weekly session or a sports try-out / jogging session)?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'yes_sports_session'),
        Markup.button.callback('No', 'no_sports_session'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return

    if (ctx.wizard.state.extraSportsPending) {
      const rows = await buildNumericKeyboard('sports', 8)
      const sentMessage = await ctx.reply(
        'How many sports sessions did you attend this week?',
        Markup.inlineKeyboard(rows)
      )
      ctx.wizard.state.questionMessageId = sentMessage.message_id
      return ctx.wizard.next()
    }
    await ctx.wizard.steps[ctx.wizard.cursor + 1](ctx)
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return

    await ctx.reply(
      'Did you try any new recipes/foods this week?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'yes_recipe'),
        Markup.button.callback('No', 'no_recipe'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return

    if (ctx.wizard.state.extraRecipePending) {
      const rows = buildNumericKeyboard('recipe', 8)
      const sentMessage = await ctx.reply(
        'How many new recipes/foods did you try this week?',
        Markup.inlineKeyboard(rows)
      )
      ctx.wizard.state.recipeQuestionMessageId = sentMessage.message_id
      return ctx.wizard.next()
    }
    await ctx.wizard.steps[ctx.wizard.cursor + 1](ctx)
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return

    await ctx.reply(
      'Did you try a new sport or one you haven’t done in a while?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'yes_new_sport'),
        Markup.button.callback('No', 'no_new_sport'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return

    const promptMsg = await ctx.reply(
      'Next up are some health-related questions. Would you like to answer them?',
      Markup.inlineKeyboard([
        Markup.button.callback('Next', 'health_next'),
        Markup.button.callback('Skip', 'health_skip'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    ctx.wizard.state.promptMsgId = promptMsg.message_id
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return

    if (ctx.wizard.state.promptMsgId) {
      try {
        await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.wizard.state.promptMsgId, null, {})
      } catch (_err) { /**/ }
    }

    const { pointsData } = ctx.wizard.state
    const titlePadding = 26
    const valuePadding = 4
    let message = '*Do you confirm this information?*\n\n'
        message += formatList('Attended Sports Sessions',
           pointsData.sportsTurn > 0 ? pointsData.sportsTurn / PointMultipliers.sportsTurn : 'No', 
           pointsData.sportsTurn > 0 ? titlePadding + 2 : titlePadding, valuePadding) + '\n'
        message += formatList('Tried a New Sport', pointsData.trySport ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Tried New Recipes/Foods', 
          pointsData.tryRecipe > 0 ? pointsData.tryRecipe / PointMultipliers.tryRecipe : 'No', 
          pointsData.tryRecipe > 0 ? titlePadding + 2 : titlePadding, valuePadding) + '\n'
        message += formatList('Had Good Sleep', pointsData.goodSleep ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Meditated', pointsData.meditate ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Limited Alcohol', pointsData.lessAlc ? 'Yes' : 'No', titlePadding, valuePadding) + '\n\n'
        message += formatList('Total Points:', pointsData.total, titlePadding, valuePadding) + '\n\n'

    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('Yes, confirm', 'confirm_details')],
          [Markup.button.callback('No, start over', 'start_over')],
          [Markup.button.callback('Cancel & Exit', 'exit_wizard')]
        ]
      }
    })  
  },
)

weekScoresWizard.action('health_next', async (ctx) => {
  if (await isNotCallback(ctx)) return

  ctx.wizard.state.healthAnswers = {}
  healthQuestions.forEach(q => ctx.wizard.state.healthAnswers[q.key] = false)
  const keyboard = healthQuestions.map(q => 
    [Markup.button.callback(`${q.label}: ❌`, `toggle_${q.key}`)]
  )
  keyboard.push([
    Markup.button.callback('Submit', 'health_submit'),
    Markup.button.callback('Cancel & Exit', 'exit_wizard')
  ])
  await ctx.editMessageText(
    'Please select which of the following health-related activities you did this week:',
    Markup.inlineKeyboard(keyboard)
  )
})

weekScoresWizard.action(/toggle_(.+)/, async (ctx) => {
  if (await isNotCallback(ctx)) return

  const key = ctx.match[1]
  ctx.wizard.state.healthAnswers[key] = !ctx.wizard.state.healthAnswers[key]
  const keyboard = healthQuestions.map(q => {
    const status = ctx.wizard.state.healthAnswers[q.key] ? '✅' : '❌'
    return [Markup.button.callback(`${q.label}: ${status}`, `toggle_${q.key}`)]
  })
  keyboard.push([
    Markup.button.callback('Submit', 'health_submit'),
    Markup.button.callback('Cancel & Exit', 'exit_wizard')
  ])
  await ctx.editMessageText(
    'Please select which of the following health-related activities you did this week:',
    Markup.inlineKeyboard(keyboard)
  )
})

weekScoresWizard.action('health_submit', async (ctx) => {
  if (await isNotCallback(ctx)) return

  const answers = ctx.wizard.state.healthAnswers
  ctx.wizard.state.pointsData.goodSleep = answers.goodSleep ? PointMultipliers.goodSleep : 0
  ctx.wizard.state.pointsData.meditate = answers.meditate ? PointMultipliers.meditate : 0
  ctx.wizard.state.pointsData.lessAlc = answers.lessAlc ? PointMultipliers.lessAlc : 0
  const addedPoints = healthQuestions.reduce((sum, q) => sum + (answers[q.key] ? q.points : 0), 0)
  ctx.wizard.state.pointsData.total += addedPoints
  await ctx.reply('Health-related responses recorded.')
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
})

weekScoresWizard.action('health_skip', async (ctx) => {
  Object.assign(ctx.wizard.state.pointsData, { goodSleep: 0, meditate: 0, lessAlc: 0 })
  await ctx.reply('Health-related questions skipped.')
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
})

weekScoresWizard.action('confirm_details', async (ctx) => {
  try {
    const { pointsData } = ctx.wizard.state
    const titlePadding = 26
    const valuePadding = 4
    let message = '*Summary of this week\'s points:*\n\n'
        message += formatList('Attended Sports Sessions', 
          pointsData.sportsTurn > 0 ? pointsData.sportsTurn / PointMultipliers.sportsTurn : 'No', 
          pointsData.sportsTurn > 0 ? titlePadding + 2 : titlePadding, valuePadding) + '\n'
        message += formatList('Tried a New Sport', pointsData.trySport ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Tried New Recipes/Foods', 
          pointsData.tryRecipe > 0 ? pointsData.tryRecipe / PointMultipliers.tryRecipe : 'No', 
          pointsData.tryRecipe > 0 ? titlePadding + 2 : titlePadding, valuePadding) + '\n'
        message += formatList('Had Good Sleep', pointsData.goodSleep ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Meditated', pointsData.meditate ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Limited Alcohol', pointsData.lessAlc ? 'Yes' : 'No', titlePadding, valuePadding) + '\n\n'
        message += formatList('Total Points:', pointsData.total, titlePadding, valuePadding) + '\n\n'

    await pointService.addPoints(ctx.from.id, ctx.wizard.state.pointsData)
    await ctx.editMessageText(message, { parse_mode: 'MarkdownV2' })
        return ctx.scene.leave()
  } catch (_err) {
        await ctx.editMessageText(texts.actions.error.error)
    return ctx.scene.leave()
  }
})

weekScoresWizard.action('start_over', async (ctx) => {
  await ctx.editMessageText('starting over!')
  ctx.wizard.selectStep(0)
  return ctx.wizard.steps[0](ctx)
})

weekScoresWizard.action('exit_wizard', async (ctx) => {
  await ctx.editMessageReplyMarkup({})
  await ctx.reply('Canceled & Exited. You can start again by using /weekscores')
  return ctx.scene.leave()
})

weekScoresWizard.action(/^(yes|no)_sports_session$/, async (ctx) => {
  await handleYesNoToggle(ctx, 'extraSportsPending')
})

weekScoresWizard.action(/^(yes|no)_new_sport$/, async (ctx) => {
  await handleYesNoAction(ctx, 'trySport', PointMultipliers.trySport)
})

weekScoresWizard.action(/^sports_(\d+)$/, async (ctx) => {
  await handleNumericCallback(ctx, 'sports', 'sportsTurn', PointMultipliers.sportsTurn, 'questionMessageId')
})

weekScoresWizard.action(/^(yes|no)_recipe$/, async (ctx) => {
  await handleYesNoToggle(ctx, 'extraRecipePending')
})

weekScoresWizard.action(/^recipe_(\d+)$/, async (ctx) => {
  await handleNumericCallback(ctx, 'recipe', 'tryRecipe', PointMultipliers.tryRecipe, 'recipeQuestionMessageId')
})

module.exports = { weekScoresWizard }