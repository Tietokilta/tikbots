const { Scenes } = require('telegraf')
const pointService = require('../../services/point-service')
const userService = require('../../services/user-service')
const texts = require('../../utils/texts')
const { formatList, escapeMarkdown } = require('../../utils/format-list')
const { emojis } = require('../../config/constants')

// team command
const teamMemberRankingsScene = new Scenes.BaseScene('team_member_rankings_scene')
teamMemberRankingsScene.enter(async (ctx) => {
  try {
    const user = await userService.findUser(ctx.from.id)
    if (!user) {
      await ctx.reply("User not found. Please register first using /register.")
      return ctx.scene.leave()
    }
    if (!user.team) {
      await ctx.reply("You are not a part of any team. Please join or create a team first.")
      return ctx.scene.leave()
    }

    const rankings = await pointService.getTeamMemberRankings(ctx.from.id)

    let message = `*${escapeMarkdown(rankings[0].teamName)} Rankings* 🏅\n\n`

    const titlePadding = 21
    const valuePadding = 6

    rankings.forEach((member, index) => {
      const emoji = index < emojis.length ? emojis[index] : `${index + 1}`
      message += emoji + formatList(member.name, member.totalPoints.toString(), titlePadding, valuePadding, 'pts') + '\n'
    })

    await ctx.replyWithMarkdownV2(message)
    ctx.scene.leave()
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error(error)
    ctx.scene.leave()
  }
})

module.exports = { teamMemberRankingsScene }
