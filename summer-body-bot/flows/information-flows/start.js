const { Scenes } = require('telegraf')
const { escapeMarkdown } = require('../../utils/format-list')

const startWizard = new Scenes.WizardScene(
  'start_wizard',
  async (ctx) => {
    let introductionMessage = '*Welcome to the Kesäkuntoon Competition!* 🎉\n\n'
    introductionMessage += `This competition, organised by Aava's Sport Committee, is designed to encourage a healthier lifestyle through friendly competition. As a participant, you\'ll earn points by engaging in various health and fitness activities, contributing both to your personal score and your team\'s overall performance.\n\n`
    introductionMessage += '_Every point counts!_'
    await ctx.replyWithMarkdownV2(escapeMarkdown(introductionMessage))

    let instructionsMessage = '*Getting Started:*\n\n'
    instructionsMessage += '1. *Register*: Begin by registering with the command /register.\n\n'
    instructionsMessage += '2. *Team Participation*: You may choose to team up with other fellow students, but participation as an individual is also welcome. If you decide to form or join a team, use the /createteam or /jointeam commands.\n\n'
    instructionsMessage += '3. *Earning Points & Tracking Progress*: Use /howtogetpoints to learn how to get points. Amp up the excitement by checking rankings and stats — learn more with command /statsinfo.\n\n'
    instructionsMessage += '4. *Assistance*: Need help? The /help command lists all available commands and their functions.\n\n'
    await ctx.replyWithMarkdownV2(escapeMarkdown(instructionsMessage))

    await ctx.scene.leave()
  }
)

module.exports = { startWizard }
