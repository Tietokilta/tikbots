const logger = {
    info: (msg) => console.log('[INFO]', msg),
    error: (msg) => console.error('[ERROR]', msg),
    debug: (msg) => console.debug('[DEBUG]', msg),
}

module.exports = logger