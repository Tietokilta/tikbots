const { Scenes, Markup } = require('telegraf')
const teamService = require('../services/team-service')
const userService = require('../services/user-service')
const texts = require('../utils/texts')
const validateTeamName = require('../utils/validate-team-name')

const cancelAndExitKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('Cancel', 'cancel')
])

const createTeamWizard = new Scenes.WizardScene(
  'create_team_wizard',
  async (ctx) => {
    const user = await userService.findUser(ctx.from.id)

    if (!user) {
      await ctx.reply('User not found. Please /register first.')
      return ctx.scene.leave()
    }
    
    if (user.team) {
      const sentMessage = await ctx.reply(
        'You are currently part of a team. By creating a new team, you will automatically leave your current team. ' +
        'If your current team is left with no members, it will be permanently removed. ' +
        'Do you wish to continue?',
        Markup.inlineKeyboard([
          Markup.button.callback('Yes, create new team', 'confirm_create_team'),
          Markup.button.callback('No, cancel', 'cancel_create_team')
        ])
      )
      ctx.wizard.state.questionMessageId = sentMessage.message_id
      return ctx.wizard.next()
    } else {
      const sentMessage = await ctx.reply('Please provide a name for your new team.', cancelAndExitKeyboard)
      ctx.wizard.state.questionMessageId = sentMessage.message_id
      ctx.wizard.state.confirmCreate = true
      return ctx.wizard.next()
    }
  },
  async (ctx) => {
    if (ctx.wizard.state.confirmCreate) { 
      const teamName = ctx.message.text
      const validation = validateTeamName(teamName)

      if (!validation.isValid) {
        await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please provide a name for your new team.')
        const sentMessage = await ctx.reply(validation.reason, cancelAndExitKeyboard)
        ctx.wizard.state.questionMessageId = sentMessage.message_id
        return ctx.wizard.selectStep(ctx.wizard.cursor)
      }

      try {
        await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please provide a name for your new team.')
        const user = await userService.findUser(ctx.from.id)
        const team = await teamService.createTeam(teamName, user.guild)
        await userService.addUserToTeam(user._id, team._id)
        await teamService.joinTeam(user._id, team._id)

        await ctx.reply('Team has been successfully created! Other members can join your team using this ID:')
        await ctx.reply(`${team._id}`)
        return ctx.scene.leave()
      } catch (error) {

        if (error.code === 11000) {
          await ctx.reply('A team with that name already exists. Please try a different name.')
          await ctx.scene.leave()
          return ctx.scene.enter('create_team_wizard')
        } else {
          await ctx.reply(texts.actions.error.error)
          return ctx.scene.leave()
        }
      }
    } else {
      await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please provide a name for your new team.')
      await ctx.reply('Team creation canceled. Start again with /createteam.')
      return ctx.scene.leave()
    }
  }
)

createTeamWizard.action('confirm_create_team', async (ctx) => {
  ctx.wizard.state.confirmCreate = true
  const userId = ctx.from.id
  const user = await userService.findUser(userId)
  await teamService.leaveTeam(user._id, user.team)
    const sentMessage = await ctx.editMessageText('Please provide a name for your new team.', cancelAndExitKeyboard)
  ctx.wizard.state.questionMessageId = sentMessage.message_id
})

createTeamWizard.action('cancel_create_team', async (ctx) => {
  ctx.wizard.state.confirmCreate = false

    await ctx.editMessageText('Team creation canceled. Start again with /createteam.')
  return ctx.scene.leave()
})

createTeamWizard.action('cancel', async (ctx) => {
    await ctx.editMessageText('Team creation canceled. Start again with /createteam.')
  return ctx.scene.leave()
})

module.exports = { createTeamWizard }
