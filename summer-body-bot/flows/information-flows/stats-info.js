const { Scenes } = require('telegraf')
const { escapeMarkdown } = require('../../utils/format-list')

const statsInfoScene = new Scenes.BaseScene('stats_info_scene')
statsInfoScene.enter(async (ctx) => {
    let statsMessage = '*Discover Your Stats and Rankings!* 🏆\n\n'
    statsMessage += 'Use these commands to track your and your team\'s progress:\n\n'
    statsMessage += '/leaderboards - See top 15 teams in the competition\n\n'
    statsMessage += '/team - Check your team members\' contributions\n\n'
    statsMessage += '/summary - Get your personal points summary\n\n'
    statsMessage += '/topguilds - See guild standings in the competition\n\n'
    statsMessage += '/topguildsall - Compare guild points in more detail\n\n'
    statsMessage += '/topusers - See top 15 participants in the competition\n\n'
    statsMessage += 'Stay motivated and see how your efforts stack up against the competition!'
  
    await ctx.replyWithMarkdownV2(escapeMarkdown(statsMessage))
    await ctx.scene.leave()
})

module.exports = { statsInfoScene }