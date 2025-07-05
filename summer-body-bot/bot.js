const { Telegraf, Scenes, session } = require('telegraf')
const { telegramToken, commands, responses, maxUsage } = require('./config')
const flows = require('./flows')
const https = require('https')

const agent = new https.Agent({ keepAlive: false })
const bot = new Telegraf(telegramToken, { telegram: { agent } })

const onlyPrivate = require('./utils/check-private')
const texts = require('./utils/texts')

const stage = new Scenes.Stage(Object.values(flows))
bot.use(session())
bot.use(stage.middleware())

/// Middleware for restricting available commands ///

const allowedCommands = ['terms', 'adjustpoints', 'statsinfo', 'feedback', 'leaderboards', 'team', 'summary', 'topguilds', 'topguildsall', 'topusers', 'morgons', 'tekkers', 'bruhh', 'eztikwin', 'olirigged']

bot.use(async (ctx, next) => {
  if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
    const fullCommand = ctx.message.text.split(' ')[0].substring(1).toLowerCase()
    const command = fullCommand.split('@')[0]
    if (!allowedCommands.includes(command)) {
      if (ctx.chat && ctx.chat.type !== 'private') {
        try {
          await ctx.deleteMessage()
        } catch (error) {
          console.error('Error deleting message:', error)
        }
        return
      } else {
        return ctx.reply('Point count has been freezed for the award ceremony. You can still look at the stats (see /statsinfo).')
      }
    }
  }
  await next()
})

bot.command('help', (ctx) => { ctx.scene.enter('help_scene') })

bot.command('start', onlyPrivate, (ctx) => { ctx.scene.enter('start_wizard') })
bot.command('howtogetpoints', onlyPrivate, (ctx) => { ctx.scene.enter('how_to_get_points_scene') })
bot.command('statsinfo', onlyPrivate, (ctx) => { ctx.scene.enter('stats_info_scene') })
bot.command('terms', onlyPrivate, (ctx) => { ctx.scene.enter('terms_scene') })

bot.command('rmuser', onlyPrivate, (ctx) => { ctx.scene.enter('delete_user_wizard') })
bot.command('register', onlyPrivate, (ctx) => { ctx.scene.enter('register_wizard') })
bot.command('createteam', onlyPrivate, (ctx) => { ctx.scene.enter('create_team_wizard') })
bot.command('jointeam', onlyPrivate, (ctx) => { ctx.scene.enter('join_team_wizard') })
bot.command('weekscores', onlyPrivate, (ctx) => { ctx.scene.enter('week_scores_wizard') })
bot.command('addexercise', onlyPrivate, (ctx) => { ctx.scene.enter('sports_activity_wizard') })

bot.command('adjustpoints', onlyPrivate, (ctx) => { ctx.scene.enter('adjust_points_wizard') })

bot.command('feedback', onlyPrivate, (ctx) => {ctx.scene.enter('feedback_wizard')})

bot.command('leaderboards', (ctx) => { ctx.scene.enter('team_rankings_scene') })
bot.command('team', (ctx) => { ctx.scene.enter('team_member_rankings_scene') })
bot.command('summary', (ctx) => { ctx.scene.enter('user_summary_scene') })
bot.command('topguilds', (ctx) => { ctx.scene.enter('guild_standings_scene') })
bot.command('topguilds50', (ctx) => { ctx.scene.enter('guild_top_standings_scene') })
bot.command('topguildsall', (ctx) => { ctx.scene.enter('guild_comparison_scene') })
bot.command('topusers', (ctx) => { ctx.scene.enter('top_users_scene') })

const usedCommands = {}
commands.forEach(cmd => {
  usedCommands[cmd] = new Set()
})

commands.forEach(cmd => {
  bot.command(cmd, async (ctx) => {
    try {
      await ctx.deleteMessage()
    } catch (error) {
      console.error("Failed to delete message:", error)
    }
    const userId = ctx.from.id
    if (usedCommands[cmd].size >= maxUsage) {
      return 
    }
    if (usedCommands[cmd].has(userId)) {
      return
    }
    usedCommands[cmd].add(userId)
    return ctx.replyWithSticker(responses[cmd])
  })
})

bot.catch((err, ctx) => { 
  console.error(`Encountered an error for ${ctx.updateType}`, err) 
  ctx.reply(texts.actions.error.error)
})

module.exports = bot