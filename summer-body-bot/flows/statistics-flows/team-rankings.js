const { Scenes } = require('telegraf')
const pointService = require('../../services/point-service')
const texts = require('../../utils/texts')
const { formatList } = require('../../utils/format-list')
const { emojis } = require('../../config/constants')

// leaderboards command
const teamRankingsScene = new Scenes.BaseScene('team_rankings_scene')
teamRankingsScene.enter(async (ctx) => {
  try {
    const rankings = await pointService.getTeamRankings()
    if (!rankings || rankings.length === 0) {
      await ctx.reply("There are no teams with three or more members where all members have more than 0 points.")
      return ctx.scene.leave()
    }
    let message = '*Team Rankings \\(by average points\\)* ⚡\n\n'

    const titlePadding = 21
    const valuePadding = 6

    rankings.forEach((team, index) => {
      const emoji = index < emojis.length ? emojis[index] : `${index + 1}`
      message += emoji + formatList(team.name, team.averagePointsPerMember, titlePadding, valuePadding) + '\n'
    })

    await ctx.replyWithMarkdownV2(message)
    ctx.scene.leave()
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error(error)
    ctx.scene.leave()
  }
})

module.exports = { teamRankingsScene }