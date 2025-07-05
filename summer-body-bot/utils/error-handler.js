const { ErrorMsg } = require('../config/constants');

module.exports.handleError = (ctx, error, customMessage) => {
  console.error(customMessage || 'Error:', error)
  if (ctx && ctx.reply) ctx.reply(customMessage || ErrorMsg)
}