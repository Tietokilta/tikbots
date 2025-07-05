const formatNumber = (num) => {
    const fixed = num.toFixed(1)
    return fixed.endsWith('.0') ? Math.round(num).toString() : fixed
}

const formatList = (title, text, titlePadding, valuePadding, unit = '') => {
    if (typeof text === 'number') { text = formatNumber(text) } 
    else if (typeof text === 'string' && !isNaN(text) && text.trim() !== '') { text = formatNumber(parseFloat(text)) }

    title = title.padEnd(titlePadding, ' ')
    text = text.toString().padStart(valuePadding, ' ')
    const formattedUnit = unit ? ` ${unit}` : ''
    const escapedTitle = escapeMarkdown(title)
    const escapedText = escapeMarkdown(text)
    return `\`${escapedTitle}${escapedText}\`${formattedUnit}`
}

const escapeMarkdown = (text) => {
    if (typeof text === 'number') { text = formatNumber(text) } 
    else if (typeof text === 'string' && !isNaN(text) && text.trim() !== '') { text = formatNumber(parseFloat(text)) }

    return text.replace(/[[\]()~`>#+-=|{}.!\\]/g, (x) => '\\' + x)
}

module.exports = { formatList, escapeMarkdown }