const { Scenes, Markup } = require('telegraf')
const userService = require('../services/user-service')
const texts = require('../utils/texts')
const User = require('../models/user-model')
const { isNotCallback } = require('../utils/flow-helpers')

const registerWizard = new Scenes.WizardScene(
  'register_wizard',
  async (ctx) => {
    const user = await userService.findUser(ctx.from.id)
    if (user) {
        await ctx.reply("You've already registered. You can still /createteam or /jointeam.")
        return ctx.scene.leave()
    } else {
        await ctx.reply(texts.terms.only_terms, Markup.inlineKeyboard([
            Markup.button.callback('Accept', 'accept_terms'),
            Markup.button.callback('Decline', 'decline_terms')
        ]))
        return ctx.wizard.next()
    }
  },
  async (ctx) => {
    if (await isNotCallback(ctx)) return
  }
)

registerWizard.action('accept_terms', async (ctx) => {
  await ctx.editMessageText('You accepted the terms and conditions.')
  const validGuilds = User.validGuilds
  const guildButtons = validGuilds.map(g => Markup.button.callback(g, `select_guild_${g}`))
  const guildRows = []
  for (let i = 0; i < guildButtons.length; i += 3) {
    guildRows.push(guildButtons.slice(i, i + 3));
  }
  if (guildRows.length > 1 && guildRows[guildRows.length - 1].length < 3) {
    const lastRow = guildRows.pop();
    const prevRow = guildRows.pop();
    const combined = prevRow.concat(lastRow);
    if (combined.length <= 5) {
      guildRows.push(combined);
    } else {
      const total = combined.length;
      let splitIndex = Math.floor(total / 2);
      if (splitIndex < 3) {
        splitIndex = 3;
      }
      if (total - splitIndex < 3) {
        splitIndex = total - 3;
      }
      const firstPart = combined.slice(0, splitIndex);
      const secondPart = combined.slice(splitIndex);
      guildRows.push(firstPart);
      guildRows.push(secondPart);
    }
  }
  guildRows.push([Markup.button.callback('Cancel & Exit', 'exit_wizard')])
  await ctx.reply('Please select your guild:', Markup.inlineKeyboard(guildRows))
})

registerWizard.action('decline_terms', async (ctx) => {
  await ctx.editMessageReplyMarkup({})
  await ctx.reply('You did not accept the terms and conditions necessary to enter the competition. Click /register to start again.')
  return ctx.scene.leave()
})

registerWizard.action(/^select_guild_(.+)$/, async (ctx) => {
  const guild = ctx.match[1]

  ctx.wizard.state.guild = guild
  const firstName = ctx.from.first_name || ''
  const lastName = ctx.from.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || ctx.from.username

  try {
      await userService.createUser({
          userId: ctx.from.id,
          username: ctx.from.username,
          name: fullName,
          guild: guild,
      })
      await ctx.editMessageReplyMarkup({})
      await ctx.reply(`You successfully registered to the ${guild} Kesäkuntoon team. You can use /createteam or /jointeam if you want to create or join a team. If you selected the wrong team, you can remove your user and start again with /rmuser.`)
      return ctx.scene.leave()
  } catch (_err) {
      await ctx.editMessageText(texts.actions.error.error)
      return ctx.scene.leave()
  }
})

registerWizard.action('exit_wizard', async (ctx) => {
  await ctx.editMessageText('Canceled & Exited. Start again with /register.')
  return ctx.scene.leave()
})

module.exports = { registerWizard }
