const { Scenes } = require('telegraf')
const pointService = require('../../services/point-service')
const userService = require('../../services/user-service')
const texts = require('../../utils/texts')
const { formatList, escapeMarkdown } = require('../../utils/format-list')

// summary command
const userSummaryScene = new Scenes.BaseScene('user_summary_scene')
userSummaryScene.enter(async (ctx) => {
  try {
    const user = await userService.findUser(ctx.from.id)
    if (!user) {
      await ctx.reply("User not found. Please register first using /register.")
      return ctx.scene.leave()
    }
    const [summary] = await Promise.all([pointService.getUserSummary(ctx.from.id)])
    
    const titlePadding = 21
    const valuePadding = 6

    let message = '*Your Points Summary* 📊\n\n'
    message += `*Total of* ${escapeMarkdown(summary.total)} pts \n\n`

    message += formatList('Exercise', summary.exercise, titlePadding, valuePadding, 'pts') + '\n'
    message += formatList('Sports Session', summary.sportsTurn, titlePadding, valuePadding, 'pts') + '\n'
    message += formatList('Try Sport', summary.trySport, titlePadding, valuePadding, 'pts') + '\n'
    message += formatList('Try Recipe', summary.tryRecipe, titlePadding, valuePadding, 'pts') + '\n'
    message += formatList('Good Sleep', summary.goodSleep, titlePadding, valuePadding, 'pts') + '\n'
    message += formatList('Meditation', summary.meditate, titlePadding, valuePadding, 'pts') + '\n'
    message += formatList('Less Alcohol', summary.lessAlc, titlePadding, valuePadding, 'pts') + '\n'   

    await ctx.replyWithMarkdownV2(message)
    ctx.scene.leave()
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error(error)
    ctx.scene.leave()
  }
})

module.exports = { userSummaryScene }
