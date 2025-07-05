const { Scenes } = require('telegraf')
const pointService = require('../../services/point-service')
const texts = require('../../utils/texts')
const { formatList } = require('../../utils/format-list')

// topguildsall
const guildComparisonScene = new Scenes.BaseScene('guild_comparison_scene')
guildComparisonScene.enter(async (ctx) => {
  try {
    const standings = await pointService.getGuildsTotals()
    if (!standings) {
      await ctx.reply("No guild data available.")
      return ctx.scene.leave()
    }
    const validStandings = standings.filter(guild => guild.participants > 2 && guild.total.total > 0)
    if (validStandings.length === 0) {
      await ctx.reply("No guild data available.")
      return ctx.scene.leave()
    }

    const sortedByAverage = [...validStandings].sort((a, b) => b.total.average - a.total.average)

    const titlePadding = 15
    const valuePadding = 6

    let message = '*Guilds Comparison* 🏆\n\n'

    message += '*Average / Total points*\n'
    sortedByAverage.forEach(guild => {
      const text = `\(${parseFloat(guild.total.average).toFixed(1)}/${parseFloat(guild.total.total).toFixed(1)}\)`
      message += formatList(guild.guild, text, titlePadding, valuePadding) + '\n'
    })

    message += '\n'
    message += '*Participants*\n'
    const sortedByParticipants = [...validStandings].sort((a, b) => b.participants - a.participants)
    sortedByParticipants.forEach(guild => {
      message += formatList(guild.guild, guild.participants, titlePadding, valuePadding) + '\n'
    })

    message += '\n'
    message += '*Top 3 Guilds per Category \\(total points\\):*\n\n'

    const normalCategories = {
      exercise: 'Exercise',
      sportsTurn: 'Sports Sessions Participation',
      trySport: 'Trying New Sports'
    }

    Object.keys(normalCategories).forEach(categoryKey => {
      message += `*${normalCategories[categoryKey]}*\n`
      const sortedGuilds = [...validStandings]
        .sort((a, b) => b[categoryKey].total - a[categoryKey].total)
        .slice(0, 3)
      
      sortedGuilds.forEach(guild => { 
        const points = guild[categoryKey].total.toString()
        message += formatList(guild.guild, points, titlePadding, valuePadding) + '\n'
      })
      message += '\n'
    })

    const healthStandings = validStandings.map(guild => {
      const healthPoints = (guild.tryRecipe.total || 0) + (guild.goodSleep.total || 0) + (guild.meditate.total || 0) + (guild.lessAlc.total || 0)
      return { guild: guild.guild, healthPoints }
    })

    const topHealth = [...healthStandings]
      .sort((a, b) => b.healthPoints - a.healthPoints)
      .slice(0, 3)

    message += `*Health Points*\n`
    topHealth.forEach(entry => {
      message += formatList(entry.guild, entry.healthPoints.toString(), titlePadding, valuePadding) + '\n'
    })
    message += '\n'

    await ctx.replyWithMarkdownV2(message)
    ctx.scene.leave()
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error(error)
    ctx.scene.leave()
  }
})

module.exports = { guildComparisonScene }
