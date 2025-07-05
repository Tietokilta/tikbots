const validateTeamName = (name) => {
    const validPattern = /^[a-zA-Z0-9 \-_]+$/
    if (!name || name.length > 20 || !validPattern.test(name)) {
        return {
            isValid: false,
            reason: 'The team name is invalid. Only alphanumeric characters, spaces, hyphens, and underscores are allowed, and the name must be less than 20 characters long.'
        }
    }

    return { isValid: true }
}

module.exports = validateTeamName
