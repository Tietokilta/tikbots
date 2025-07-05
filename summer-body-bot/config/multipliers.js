module.exports = {
  PointMultipliers: {
      sportsTurn: 5,
      trySport: 5,
      tryRecipe: 5,
      goodSleep: 8,
      meditate: 5,
      lessAlc: 10,
  },
  DefaultPoints: {
      sportsTurn: 0,
      trySport: 0,
      tryRecipe: 0,
      goodSleep: 0,
      lessAlc: 0,
      meditate: 0,
      total: 0,
  },
  kmActivities: [
  { key: 'running', label: 'running/walking', type: 'km', multiplier: 1, maxAllowed: 40 },
  { key: 'cycling', label: 'cycling', type: 'km', multiplier: 0.25, maxAllowed: 100 },
  { key: 'swimming', label: 'swimming', type: 'km', multiplier: 4, maxAllowed: 10 },
  { key: 'rowing', label: 'rowing', type: 'km', multiplier: 1, maxAllowed: 25 },
  { key: 'iceskating', label: 'ice skating', type: 'km', multiplier: 0.25, maxAllowed: 50 },
  { key: 'skiing', label: 'skiing', type: 'km', multiplier: 0.5, maxAllowed: 50 },
  ],
  otherActivities: [
  { key: 'low', label: 'low intensity training', type: 'hours', multiplier: 2, maxAllowed: 6 },
  { key: 'moderate', label: 'moderate intensity training', type: 'hours', multiplier: 4, maxAllowed: 5 },
  { key: 'vigorous', label: 'vigorous intensity training', type: 'hours', multiplier: 8, maxAllowed: 4 },
  ],
}