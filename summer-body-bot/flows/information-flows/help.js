const { Scenes } = require('telegraf')
const { escapeMarkdown } = require('../../utils/format-list')

const helpScene = new Scenes.BaseScene('help_scene')
helpScene.enter(async (ctx) => {
  let helpMessage = '*Help and Commands Overview* 🛠️\n\n'

  if (ctx.update.message.chat.type === 'private') {
    helpMessage += '/start - Get introduction & instructions to get basic information about the competition.\n\n'
    helpMessage += '/register - Initiate your registration and set up your profile.\n\n'
    helpMessage += '/createteam - Form a new team.\n\n'
    helpMessage += '/jointeam - Join an existing team. You will need the team ID, provided to who created the team.\n\n'
    helpMessage += '/addexercise - Log your Kilometer-based and Hour-based training.\n\n'
    helpMessage += '/weekscores - Log your weekly achievements to earn points every Sunday.\n\n'
    helpMessage += '/howtogetpoints - Discover the various ways to earn points.\n\n'
    helpMessage += '/statsinfo - Show commands for getting rankings and stats.\n\n'
    helpMessage += '/terms - Read current terms and conditions.\n\n'
    helpMessage += 'If there is something that you did not understand or something problematic comes up you can send me a message on Telegram @EppuRuotsalainen.'
  } else {
    // Help information integrated with stats commands for group chat
    helpMessage += '/leaderboards - View 30 teams with most points and their rankings.\n\n'
    helpMessage += '/team - Check your team members\' contributions.\n\n'
    helpMessage += '/summary - Get your personal points summary.\n\n'
    helpMessage += '/topguilds - See guild standings in the competition.\n\n'
    helpMessage += '/topguildsall - Compare guild points in more detail.\n\n'
    helpMessage += '/topusers - See top 15 users in the competition\n\n'
    helpMessage += 'Please interact with me in a private chat for full features and more detailed commands.'
  }

  await ctx.replyWithMarkdownV2(escapeMarkdown(helpMessage))
  await ctx.scene.leave()
})

module.exports = { helpScene }
