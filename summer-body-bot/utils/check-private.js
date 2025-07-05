const onlyPrivate = async (ctx, next) => {
    if (ctx.update && ctx.update.message && ctx.update.message.chat.type === 'private') {
      return next()
    }
    
    try {
      await ctx.deleteMessage()
    } catch (err) {
      console.error("Failed to delete message:", err)
    }

    try {
      await ctx.telegram.sendMessage(
        ctx.from.id,
        "The command you just sent can only be used in private messages. Use command /help to see available commands."
      )
    } catch (err) {
      console.error("Failed to send private message:", err)
    }
  }
  
  module.exports = onlyPrivate