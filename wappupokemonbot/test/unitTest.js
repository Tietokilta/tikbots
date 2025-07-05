const WappuPokemonBot = require('../wappupokemon')
var assert = require('assert');
describe('Wappupokemon', function() {
    const wappuPokemonBot = new WappuPokemonBot.WappuPokemonBot()
  describe('daysToWappu()', function() {
    const targetDate = new Date(Date.UTC(2023,4,3,21))
    const currentDate = new Date(Date.UTC(2020,4,1,21))
    const daysRemaining = wappuPokemonBot.daysToWappu(currentDate, targetDate)
    it('should return a number', function() {
      assert.ok(!isNaN(daysRemaining));
    });
    it('should return an integer', function() {
      assert.ok(Number.isInteger(daysRemaining));
    });

    const daysAsMs = (days) => 1000 * 60 * 60 * 24 * days
    const dateBeforeTarget = (differenceInMs) => new Date(targetDate.getTime() - differenceInMs)
    const daysInAWeek = 7
    const weekInMs = daysAsMs(daysInAWeek)
    const oneMillisecond = 1

    it("should return 8 when a week (7 full and one partial days remaining)", function() {
      const weekPlusMinuteBeforeDate = dateBeforeTarget(weekInMs + oneMillisecond)
      const weekPlusMinuteRemaining = wappuPokemonBot.daysToWappu(weekPlusMinuteBeforeDate, targetDate)
      assert.strictEqual(weekPlusMinuteRemaining, 8)
    })
    it("should return 8 when exactly 7 full days remaining", function() {
      const weekBeforeDate = dateBeforeTarget(weekInMs)
      const weekRemaining = wappuPokemonBot.daysToWappu(weekBeforeDate, targetDate)
      assert.strictEqual(weekRemaining, 8)
    })
    it("should return 7 when exactly one millisecond less than 7 full days remaining", function() {
      const weekMinusMinuteBeforeDate = dateBeforeTarget(weekInMs - oneMillisecond)
      const weekMinusMinuteRemaining = wappuPokemonBot.daysToWappu(weekMinusMinuteBeforeDate, targetDate)
      assert.strictEqual(weekMinusMinuteRemaining, 7)
    })
    it("should return 1 when one ms less than one day remaining", function() {
      const dayInMs = daysAsMs(1)
      const dayBeforeDate = dateBeforeTarget(dayInMs - 1)
      const dayRemaining = wappuPokemonBot.daysToWappu(dayBeforeDate, targetDate)
      assert.strictEqual(dayRemaining, 1)
    })
    it("should return 1 just before target day", function() {
      const oneMsBeforeDate = dateBeforeTarget(oneMillisecond)
      const oneMsRemaining = wappuPokemonBot.daysToWappu(oneMsBeforeDate, targetDate)
      assert.strictEqual(oneMsRemaining, 1)
    })
    it("should return 0 when target day reached", function() {
      const zeroBeforeDate = dateBeforeTarget(0)
      const zeroRemaining = wappuPokemonBot.daysToWappu(zeroBeforeDate, targetDate)
      assert.strictEqual(zeroRemaining, 0)
    })
    it("should return 0 in the middle of the target day", function() {
      const halfDayInMs = Math.ceil(daysAsMs(1) / 2)
      const targetMiddle = dateBeforeTarget(-halfDayInMs)
      const lessThanZeroSameDayRemaining = wappuPokemonBot.daysToWappu(targetMiddle, targetDate)
      assert.strictEqual(lessThanZeroSameDayRemaining, 0)
    })
    it("should return 365 or 366 when one day past target day", function() {
      const dayInMs = daysAsMs(1)
      const dayAfterDate = dateBeforeTarget(-dayInMs)
      const remainingToNextYear = wappuPokemonBot.daysToWappu(dayAfterDate, targetDate)
      assert.ok([365, 366].some(remainingDays => remainingDays === remainingToNextYear))
    })

  });
});