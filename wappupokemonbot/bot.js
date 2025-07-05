'use strict'

require('dotenv').config()
const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController
const TextCommand = Telegram.TextCommand
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.log("Environment variable TELEGRAM_BOT_TOKEN not found - shutting down.")
  return
}
const tg = new Telegram.Telegram(process.env.TELEGRAM_BOT_TOKEN)

const WappuPokemonBot = require('./wappupokemon')

class PingController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    constructor() {
      super()
      this.wappuPokemonBot = new WappuPokemonBot.WappuPokemonBot();
    }

    pokemonHandler($) {
      this.wappuPokemonBot.sendTodaysPokemon($);
    }

    factHandler($) { 
      this.wappuPokemonBot.sendTodaysFact($);
    }

    stickerHandler($) {
      this.wappuPokemonBot.sendTodaysSticker($);
    }

    timeTest($) {
      this.wappuPokemonBot.testTime($);
    }

    get routes() {
        return {
            'wappupokemon': 'pokemonHandler',
            'pokemonfact': 'factHandler',
            'sticker': 'stickerHandler'
        }
    }
}

tg.router
    .when(
        new TextCommand('/wappupokemon', 'wappupokemon'),
        new PingController()
    ).when(
        new TextCommand('/pokemonfact', 'pokemonfact'),
        new PingController()
    ).when(
        new TextCommand('/sticker', 'sticker'),
        new PingController()
    )