const { Scenes } = require('telegraf')
const { escapeMarkdown } = require('../../utils/format-list')

const howToGetPoints = new Scenes.BaseScene('how_to_get_points_scene')
howToGetPoints.enter(async (ctx) => {
  let pointsMessage = '*How to Earn Points* 🌟\n\n'
  pointsMessage += 'You can log your Kilometer-based and Hour-based training at any time with the command /addexercise, and all other activities once a week on Sundays using the command /weekscores. Here’s how you can earn them:\n\n'
  pointsMessage += '1. *Kilometer-based Activities*:\n'
  pointsMessage += '   - Running/Walking: 1 point per km\n'
  pointsMessage += '   - Cycling: 0.25 points per km\n'
  pointsMessage += '   - Swimming: 4 points per km\n'
  pointsMessage += '   - Ice Skating: 0.25 points per km\n'
  pointsMessage += '   - Skiing: 0.5 points per km\n\n'
  pointsMessage += '2. *Hour-based Training*:\n'
  pointsMessage += '   - Low Intensity: 2 point per hour\n'
  pointsMessage += '   - Moderate Intensity: 4 points per hour\n'
  pointsMessage += '   - Vigorous Intensity: 8 points per hour\n\n'
  pointsMessage += '3. *Sports Sessions*: 5 points for participating in a sports session (for example, your guild\'s regular weekly session or a sports try-out / jogging session).\n\n'
  pointsMessage += '4. *New Sport*: 5 points for trying a new or long-unpracticed sport.\n\n'
  pointsMessage += '5. *New Healthy Recipe*: 5 points for trying out a new healthy recipe this week.\n\n'
  pointsMessage += '6. *Good Sleep*: 8 points for sleeping 7+ hours at least 5 nights in a week.\n\n'
  pointsMessage += '7. *Meditation*: 5 points for meditating at least 10 minutes on 5 days during the past week.\n\n'
  pointsMessage += '8. *Less Alcohol*: 10 points for consuming at most 5 portions of alcohol during the week.\n\n'
  
  await ctx.replyWithMarkdownV2(escapeMarkdown(pointsMessage))
  await ctx.scene.leave()
})

module.exports = { howToGetPoints }