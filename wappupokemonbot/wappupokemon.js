const oakdexPokedex = require('oakdex-pokedex');
const timediff = require('timediff');
require('dotenv').config()

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

class WappuPokemonBot {

  daysToWappu(date, targetDate) {
    const timeLeft = timediff(date, targetDate, 'YDHms');
    const daysLeft = timeLeft.days
    if (daysLeft == 0 && Object.values(timeLeft).every(value => value <= 0)) {
      return 0
    }
    if (daysLeft < 0) {
      const timeLeftToNextYear = timediff(date, new Date(Date.UTC(
            targetDate.getFullYear() + 1, 
            targetDate.getMonth(),
            targetDate.getDate(),
            targetDate.getHours(),
        )
      ), 'YDHms');
      const daysLeftToNextYear = timeLeftToNextYear.days
      return daysLeftToNextYear + 1
    }
    return daysLeft + 1
  }

  findPokemon(number, callback) {
    oakdexPokedex.findPokemon(number, function (pokemon) {
      const name = pokemon
        ? pokemon.names.en
        : "Missingno";
      callback(name, number, pokemon)
    });
  }

  getTodaysPokemon(scope, callback) {
    const currentDate = new Date(1000 * scope.update.message.date);
    const targetDate = new Date(Date.UTC(currentDate.getFullYear(),3,30,21))
    const daysLeft = this.daysToWappu(currentDate, targetDate);
    const todaysPokemon = this.findPokemon(daysLeft, callback);
    return todaysPokemon
  }

  sendTodaysPokemon(scope) {
    this.getTodaysPokemon( scope, function (pokemon, number) {
          if (number == 0)
            scope.sendMessage("Hyvää Wappua!!");
          else
            scope.sendMessage("Päivän Wappupokemon on #" + number + " " + pokemon + "!");
    })
  }

  getRandomIntInclusive(min, max) {
    const minInt = Math.ceil(min);
    const maxInt = Math.floor(max);
    const randomInt = Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt; //The maximum is inclusive and the minimum is inclusive
    return randomInt
  }

  getRandomPokedexEntry(entries) {
    const pokedexKeys = Object.keys(entries);
    const entriesLength = pokedexKeys.length;
    const messageId = this.getRandomIntInclusive(0, entriesLength-1);
    const entryKey = pokedexKeys[messageId];
    const pokedexEntry = entries[entryKey].en;
    return pokedexEntry
  }

  sendTodaysFact(scope) {
      this.getTodaysPokemon( scope, function (name, number, pokemon) {
        if (number == 0)
          scope.sendMessage("Wappu on kiva juttu.");
        else {
          const pokedexEntries = pokemon.pokedex_entries;
          const pokedexEntry = this.getRandomPokedexEntry(pokedexEntries);
          scope.sendMessage(pokedexEntry);
        }
      }.bind(this))
  }

  sendTodaysSticker(scope) {
      const currentDate = new Date(1000 * scope.update.message.date);
      const targetDate = new Date(Date.UTC(currentDate.getFullYear(),3,30,21))
      const daysLeft = this.daysToWappu(currentDate, targetDate);
    
      const stickerNo = this.getStickerNumberFromDaysLeft(daysLeft);
       
      this.getStickerSet("ilmarit", function (res) {
        const sticker = res.result.stickers[stickerNo].file_id;
        scope.sendSticker(sticker);
      });

  }


  getStickerNumberFromDaysLeft(daysLeft) {
    if (daysLeft > 56)
      return 56
    else
      return 56 - daysLeft;
  }

  getStickerSet(name, callback) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const url = "https://api.telegram.org/bot" + token + "/getStickerSet?name="+name;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var data = xhr.responseText;
        try {
          data = JSON.parse(data);
          callback(data);
        } catch (exc) {
          console.log(exc);
        }
      }
    }

    xhr.send();
  }
}


module.exports = {
  WappuPokemonBot: WappuPokemonBot
}
