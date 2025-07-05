const { Scenes } = require('telegraf')
const texts = require('../../utils/texts')
const { escapeMarkdown } = require('../../utils/format-list')

const termsScene = new Scenes.BaseScene('terms_scene')
termsScene.enter(async (ctx) => {
    let formattedTerms = escapeMarkdown(texts.terms.only_terms)
    
    await ctx.replyWithMarkdownV2(`*Terms and Conditions*\n\n${formattedTerms}`)
    await ctx.scene.leave()
})

module.exports = { termsScene }
