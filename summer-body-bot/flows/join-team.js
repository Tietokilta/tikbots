const { Scenes, Markup } = require('telegraf')
const teamService = require('../services/team-service')
const userService = require('../services/user-service')
const texts = require('../utils/texts')
const { isNotCallback } = require('../utils/flow-helpers')

const cancelAndExitKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('Cancel', 'cancel')
])

const joinTeamWizard = new Scenes.WizardScene(
  'join_team_wizard',
  async (ctx) => {
    const userId = ctx.from.id
    const user = await userService.findUser(userId)

    if (!user) {
      await ctx.reply('User not found. Please /register first.')
      return ctx.scene.leave()
    }

    if (user.team) {
      await ctx.reply(
        'You are already part of a team. By joining a new team, you will automatically leave your current team. ' +
        'If your current team is left with no members, it will be permanently removed. ' +
        'Do you wish to continue?',
        Markup.inlineKeyboard([
          Markup.button.callback('Yes, join new team', 'confirm_join_team'),
          Markup.button.callback('No, cancel', 'cancel')
        ])
      )
      return ctx.wizard.next()
    } else {
      ctx.wizard.state.confirmJoin = true
      const sentMessage = await ctx.reply('Please enter the ID of the team you wish to join. This ID was provided when the team was initially created.', cancelAndExitKeyboard)
      ctx.wizard.state.questionMessageId = sentMessage.message_id
      return ctx.wizard.next()
    }
  },
  async (ctx) => {
    if (ctx.wizard.state.confirmJoin) {
      if ('text' in ctx.message) {
        const teamId = ctx.message.text
        const userId = ctx.from.id
        const user = await userService.findUser(userId)

        if (!teamId) {
          await ctx.reply('No team ID provided. Please provide a valid team ID.')
          return ctx.wizard.selectStep(ctx.wizard.cursor)
        }

        try {
          const team = await teamService.getTeamById(teamId)
          
          if (!team) {
            await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please enter the ID of the team you wish to join.')
            await ctx.reply('No team found with the provided ID. Please check the ID and try again.')
            await ctx.scene.leave()
            return ctx.scene.enter('join_team_wizard')
          }

          await userService.addUserToTeam(user._id, team._id)
          await teamService.joinTeam(user._id, team._id)

          await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please enter the ID of the team you wish to join.')
          await ctx.reply(`Successfully joined team ${team.name}!`)
          return ctx.scene.leave()
        } catch (_err) {
          await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please enter the ID of the team you wish to join.')
          await ctx.reply('Invalid team ID format. The ID is a 24 character hex string. Start over with /jointeam.')
          return ctx.scene.leave()
        }
      } else {
        await ctx.reply('Please enter the team ID.', cancelAndExitKeyboard)
        return ctx.wizard.selectStep(ctx.wizard.cursor)
      }
    } else {
      if (await isNotCallback(ctx)) return
      ctx.reply(texts.actions.error.error)
      return ctx.scene.leave()
    }
  }
)

joinTeamWizard.action('confirm_join_team', async (ctx) => {
  ctx.wizard.state.confirmJoin = true
  const user = await userService.findUser(ctx.from.id)
  await teamService.leaveTeam(user._id, user.team)
  await ctx.editMessageReplyMarkup({})
  const sentMessage = await ctx.reply('Please enter the ID of the team you wish to join.', cancelAndExitKeyboard)
  ctx.wizard.state.questionMessageId = sentMessage.message_id
})

joinTeamWizard.action('cancel', async (ctx) => {
  ctx.wizard.state.confirmJoin = false
  await ctx.editMessageText('Joining team canceled. Start again with /jointeam.')
  return ctx.scene.leave()
})

module.exports = { joinTeamWizard }
