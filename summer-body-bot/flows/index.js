module.exports = {
  // Information flows
  startWizard: require('./information-flows/start').startWizard,
  helpScene: require('./information-flows/help').helpScene,
  statsInfoScene: require('./information-flows/stats-info').statsInfoScene,
  termsScene: require('./information-flows/terms').termsScene,
  howToGetPoints: require('./information-flows/how-to-points').howToGetPoints,
  // Statistics flows
  teamRankingsScene: require('./statistics-flows/team-rankings').teamRankingsScene,
  teamMemberRankingsScene: require('./statistics-flows/team-member-rankings').teamMemberRankingsScene,
  userSummaryScene: require('./statistics-flows/user-summary').userSummaryScene,
  guildStandingsScene: require('./statistics-flows/guild-standings').guildStandingsScene,
  guildTopStandingsScene: require('./statistics-flows/guild-standings').guildTopStandingsScene,
  guildComparisonScene: require('./statistics-flows/guild-comparison').guildComparisonScene,
  topUsersScene: require('./statistics-flows/top-users').topUsersScene,
  // Main user flows
  weekScoresWizard: require('./week-scores').weekScoresWizard,
  sportsActivityWizard: require('./exercise-scores').sportsActivityWizard,
  createTeamWizard: require('./create-team').createTeamWizard,
  joinTeamWizard: require('./join-team').joinTeamWizard,
  registerWizard: require('./register').registerWizard,
  deleteUserWizard: require('./delete-user').deleteUserWizard,
  // Admin Flow
  adjustPointsWizard: require('./adjust-points').adjustPointsWizard,
  // Feedback flow
  feedbackScene: require('./feedback').feedbackWizard,
}