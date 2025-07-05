const { Scenes, Markup } = require('telegraf')
const pointService = require('../services/point-service')
const User = require('../models/user-model')
const { adminIds } = require('../config/constants')
const { PointMultipliers, kmActivities, otherActivities } = require('../config/multipliers')
const { isNotCallback } = require('../utils/flow-helpers')

const adjustPointsWizard = new Scenes.WizardScene(
  'adjust_points_wizard',
  async (ctx) => {
    const currentAdmin = String(ctx.from.id)
    if (!adminIds.includes(currentAdmin)) {
      await ctx.reply("You are not authorized to perform this action.")
      return ctx.scene.leave()
    }
    const sentMessage = await ctx.replyWithMarkdownV2("*Admin Mode*:\nPlease enter the username of the user whose points you want to adjust:", Markup.inlineKeyboard([
      Markup.button.callback("Cancel & Exit", "exit_wizard")
    ]))
    ctx.wizard.state.startMessageId = sentMessage.message_id
    return ctx.wizard.next()
  },
  async (ctx) => {
    const targetUsername = ctx.message.text.trim()
    ctx.wizard.state.targetUsername = targetUsername
    const targetUser = await User.findOne({ username: targetUsername })
    if (!targetUser) {
      await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.startMessageId, null, `Please enter the username of the user whose points you want to adjust:`)
      await ctx.reply("User not found. Start again using /adjustpoints.")
      return ctx.scene.leave()
    }
    await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.startMessageId, null, `Please enter the username of the user whose points you want to adjust: ${targetUser.username} (${targetUser.name}) selected`)
    await ctx.reply(
      "Select the adjustment type:",
      Markup.inlineKeyboard([
        [Markup.button.callback("km", "type_km"), Markup.button.callback("other", "type_other"), Markup.button.callback("special", "type_special")],
        [Markup.button.callback("Cancel & Exit", "exit_wizard")]
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return

    const typeSelected = ctx.callbackQuery.data.split('_')[1]
    ctx.wizard.state.adjustmentType = typeSelected
    await ctx.answerCbQuery()
    if (typeSelected === 'special') {
      const buttons = Object.keys(PointMultipliers).map(cat =>
        Markup.button.callback(cat, `select_special_${cat}`)
      )
      buttons.push(Markup.button.callback("Cancel & Exit", "exit_wizard"))
      await ctx.editMessageText(
        "Special adjustment selected. Please choose a category:",
        Markup.inlineKeyboard(buttons, { columns: 3 })
      )
      return ctx.wizard.next()
    } else {
      const activities = typeSelected === 'km' ? kmActivities : otherActivities
      const buttons = activities.map(act =>
        Markup.button.callback(act.key, `select_ex_${act.key}`)
      )
      buttons.push(Markup.button.callback("Cancel & Exit", "exit_wizard"))
      await ctx.editMessageText(
        `You selected "${typeSelected}". Now, please select the specific activity:`,
        Markup.inlineKeyboard(buttons, { columns: 3 })
      )
      return ctx.wizard.next()
    }
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return

    const data = ctx.callbackQuery.data
    if (data.startsWith('select_special_')) {
      const specialCategory = data.split('_')[2]
      ctx.wizard.state.category = specialCategory
      await ctx.answerCbQuery()
      await ctx.editMessageText(`Special category "${specialCategory}" selected.`)
    } else if (data.startsWith('select_ex_')) {
      const activityKey = data.split('_')[2]
      ctx.wizard.state.activityKey = activityKey
      ctx.wizard.state.category = 'exercise'
      await ctx.answerCbQuery()
      await ctx.editMessageText(`Exercise activity "${activityKey}" selected.`)
      ctx.wizard.state.activityType = ctx.wizard.state.adjustmentType
    } else {
      await ctx.reply("Invalid selection. Please try again.")
      return ctx.scene.leave()
    }
    const sentMessage = await ctx.reply(
      "Please enter the adjustment quantity (e.g. 3 to add or -2 to subtract):",
      Markup.inlineKeyboard([
        Markup.button.callback("Cancel & Exit", "exit_wizard")
      ])
    )
    ctx.wizard.state.questionMessageId = sentMessage.message_id
    return ctx.wizard.next()
  },
  async (ctx) => {
    const input = ctx.message.text.trim()
    const quantity = parseFloat(input)
    if (isNaN(quantity)) {
      await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, `Please enter the adjustment quantity (e.g. 3 to add or -2 to subtract):`)
      await ctx.reply("Invalid input. Please enter a valid numeric value for quantity.")
      return ctx.wizard.selectStep(ctx.wizard.cursor)
    }
    await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, `Please enter the adjustment quantity (e.g. 3 to add or -2 to subtract): ${quantity} selected`)
    ctx.wizard.state.quantity = quantity
    let summary = `You are about to adjust ${ctx.wizard.state.targetUsername}'s `
    if (ctx.wizard.state.category === 'exercise') {
      summary += `exercise points for activity "${ctx.wizard.state.activityKey}" (${ctx.wizard.state.adjustmentType}).`
    } else {
      summary += `"${ctx.wizard.state.category}" points.`
    }
    summary += `\nAdjustment quantity: ${quantity} unit(s) multiplied by the standard multiplier. Confirm?`
    await ctx.reply(
      summary,
      Markup.inlineKeyboard([
        [Markup.button.callback("Confirm", "confirm_adjust"), Markup.button.callback("Cancel & Exit", "exit_wizard")]
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return

    await ctx.answerCbQuery()
    if (ctx.callbackQuery.data === 'confirm_adjust') {
      try {
        let extra = {}
        if (ctx.wizard.state.category === 'exercise') {
          extra = {
            activityType: ctx.wizard.state.adjustmentType,
            activityKey: ctx.wizard.state.activityKey
          }
        }
        await pointService.adjustPoints(
          ctx.wizard.state.targetUsername,
          ctx.wizard.state.category,
          ctx.wizard.state.quantity,
          extra
        )
        await ctx.editMessageText(`Successfully adjusted ${ctx.wizard.state.targetUsername}'s ${ctx.wizard.state.category} points.`)
      } catch (error) {
        await ctx.editMessageText(`Error adjusting points: ${error.message}`)
      }
    } else {
      await ctx.editMessageText("Adjustment cancelled.")
    }
    return ctx.scene.leave()
  }
)

adjustPointsWizard.action('exit_wizard', async (ctx) => {
  await ctx.editMessageReplyMarkup({})
  await ctx.reply("Canceled & Exited. You can start again using /adjustpoints.")
  return ctx.scene.leave()
})

module.exports = { adjustPointsWizard }