const { Markup } = require('telegraf')

const sendInlineQuestion = async (ctx, question, buttons) => {
  return await ctx.reply(question, Markup.inlineKeyboard(buttons))
}

async function isNotCallback(ctx) {
  if (ctx.updateType === 'message') {
    await ctx.reply('Please use the provided buttons to select an activity.')
    return true
  }
  return false
}

module.exports = { sendInlineQuestion, isNotCallback }