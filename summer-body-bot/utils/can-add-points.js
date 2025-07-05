const { allowedDates } = require('../config/constants')

const canAddPoints = (lastSubmission) => {
  // Bypass weekly restriction in test mode
  if (process.env.TEST_MODE === 'true') {
    return { canAdd: true }
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const lastSubmissionStr = lastSubmission ? new Date(lastSubmission).toISOString().slice(0, 10) : null
    
  if (!allowedDates.includes(todayStr)) {
    return {
      canAdd: false,
      reason: 'Today is not an allowed date to add week scores. Please check back later.'
    }
  }

  if (lastSubmissionStr === todayStr) {
    return {
      canAdd: false,
      reason: 'You have already submitted your points for this week. If you think this is a mistake or submitted your points incorrectly, contact @EppuRuotsalainen.'
    }
  }

  return { canAdd: true }
}

module.exports = canAddPoints
