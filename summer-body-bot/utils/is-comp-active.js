const config = require('../config')

const isCompetitionActive = async (ctx, next) => {
  const currentDate = new Date().toISOString().split('T')[0]
  const competitionStartDate = new Date(config.startDate)
  const competitionEndDate = new Date(config.endDate)

  if (currentDate >= competitionStartDate.toISOString().split('T')[0] && currentDate <= competitionEndDate.toISOString().split('T')[0]) {
    return next()
  }

  const startDateFormatted = competitionStartDate.toLocaleDateString('fi-FI')
  const endDateFormatted = competitionEndDate.toLocaleDateString('fi-FI')

  await ctx.replyWithSticker('CAACAgQAAxkBAAIFJ2Xy4dBcnwPBbamQiGVerGcMziY-AAINAAPBHkwgKWSr0-m_FIE0BA')

  setTimeout(async () => {
    await ctx.reply(`The competition is organised between ${startDateFormatted} and ${endDateFormatted}.`)

    if (ctx.scene && typeof ctx.scene.leave === 'function') {
      ctx.scene.leave()
    }
  }, 5500)
}

module.exports = isCompetitionActive
