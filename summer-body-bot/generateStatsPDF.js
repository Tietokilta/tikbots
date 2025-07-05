const PDFDocument = require('pdfkit')
const SVGtoPDF = require('svg-to-pdfkit')
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const config = require('./config')
const User = require('./models/user-model')
const Team = require('./models/team-model')
const pointService = require('./services/point-service')

const guildLogos = {
  TiK: path.join(__dirname, 'logos', 'tik_logo.png'),
  PT: path.join(__dirname, 'logos', 'pt_logo.png'),
  IK: path.join(__dirname, 'logos', 'ik_logo.png'),
  FK: path.join(__dirname, 'logos', 'fk_logo.png'),
  MK: path.join(__dirname, 'logos', 'mk_logo.png'),
  KIK: path.join(__dirname, 'logos', 'kik_logo.png'),
  SIK: path.join(__dirname, 'logos', 'sik_logo.png'),
  Inkubio: path.join(__dirname, 'logos', 'inkubio_logo.png'),
  DG: path.join(__dirname, 'logos', 'dg_logo.png'),
  AS: path.join(__dirname, 'logos', 'as_logo.png'),
  Prodeko: path.join(__dirname, 'logos', 'prodeko_logo.png'),
  Athene: path.join(__dirname, 'logos', 'athene_logo.png'),
  KY: path.join(__dirname, 'logos', 'ky_logo.png'),
  TOKYO: path.join(__dirname, 'logos', 'tokyo_logo.png'),
  AK: path.join(__dirname, 'logos', 'ak_logo.png'),
  TF: path.join(__dirname, 'logos', 'tf_logo.png'),
  PJK: path.join(__dirname, 'logos', 'pjk_logo.png'),
  VK: path.join(__dirname, 'logos', 'vk_logo.png'),
  KK: path.join(__dirname, 'logos', 'kk_logo.png'),
}

async function getTopUsersForGuild(guild, limit = 5) {
  return await User.aggregate([
    { $match: { guild } },
    { $addFields: {
         "points.total": { $round: [ "$points.total", 1 ] },
         "points.exercise": { $round: [ "$points.exercise", 1 ] },
         "points.sportsTurn": { $round: [ "$points.sportsTurn", 1 ] },
         "points.tryRecipe": { $round: [ "$points.tryRecipe", 1 ] },
         "points.goodSleep": { $round: [ "$points.goodSleep", 1 ] },
         "points.meditate": { $round: [ "$points.meditate", 1 ] },
         "points.lessAlc": { $round: [ "$points.lessAlc", 1 ] },
         "points.trySport": { $round: [ "$points.trySport", 1 ] }
    }},
    { $sort: { "points.total": -1 } },
    { $limit: limit }
  ])
}

async function getOverallUserRanking(limit = 10) {
  return await User.aggregate([
    { $addFields: {
         "points.total": { $round: [ "$points.total", 1 ] },
         "points.exercise": { $round: [ "$points.exercise", 1 ] },
         "points.sportsTurn": { $round: [ "$points.sportsTurn", 1 ] },
         "points.tryRecipe": { $round: [ "$points.tryRecipe", 1 ] },
         "points.goodSleep": { $round: [ "$points.goodSleep", 1 ] },
         "points.meditate": { $round: [ "$points.meditate", 1 ] },
         "points.lessAlc": { $round: [ "$points.lessAlc", 1 ] },
         "points.trySport": { $round: [ "$points.trySport", 1 ] }
    }},
    { $sort: { "points.total": -1 } },
    { $limit: limit },
    { $lookup: {
         from: 'teams',
         localField: 'team',
         foreignField: '_id',
         as: 'team'
    }},
    { $unwind: { path: "$team", preserveNullAndEmptyArrays: true } },
    { $project: {
         name: 1,
         guild: 1,
         points: 1,
         "team.name": 1
    }}
  ])
}

async function generateLandscapePdf() {
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 30 })
  const date = new Date()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const outputPath = `stats_${hours}_${minutes}.pdf`
  const stream = fs.createWriteStream(outputPath)
  doc.pipe(stream)

  doc.fontSize(20).text('Kesäkuntoon 2025 Statistics', { align: 'center' })
  //doc.moveDown(0.5)
  //doc.fontSize(12).text(`Generated on: ${new Date().toDateString()}`, { align: 'center' })
  doc.moveDown(1)

  let guildStatsArr = await pointService.getGuildsTotals()
  guildStatsArr = guildStatsArr.filter(gs => gs.participants > 2 && gs.total.total > 0)
  guildStatsArr.sort((a, b) => parseFloat(b.total.average) - parseFloat(a.total.average))
  const overallTotalPoints = guildStatsArr.reduce((sum, gs) => sum + parseFloat(gs.total.total), 0)

  const margin = 30
  const availableWidth = 842 - margin * 2

  const colLogoX = margin
  const colLogoWidth = 60

  const colGuildX = colLogoX + colLogoWidth + 10
  const colGuildWidth = 50

  const colTotalX = colGuildX + colGuildWidth + 10
  const colTotalWidth = 50

  const colParticipantsX = colTotalX + colTotalWidth + 10
  const colParticipantsWidth = 75

  const colAvgX = colParticipantsX + colParticipantsWidth + 10
  const colAvgWidth = 60

  const colTopUsersX = colAvgX + colAvgWidth + 10
  const colTopUsersWidth = 200

  const colGuildAveragesX = colTopUsersX + colTopUsersWidth + 10
  const colGuildAveragesWidth = availableWidth - (colGuildAveragesX - margin)

  doc.fontSize(13).font('Helvetica-Bold')
  let headerY = doc.y
  doc.text('Guild', colGuildX, headerY, { width: colGuildWidth, align: 'center' })
  doc.text('Total', colTotalX, headerY, { width: colTotalWidth, align: 'center' })
  doc.text('Participants', colParticipantsX, headerY, { width: colParticipantsWidth, align: 'center' })
  doc.text('Avg', colAvgX, headerY, { width: colAvgWidth, align: 'center' })
  doc.text('Top 5 Guild Members', colTopUsersX, headerY, { width: colTopUsersWidth, align: 'center' })
  doc.text('Guild Averages', colGuildAveragesX, headerY, { width: colGuildAveragesWidth, align: 'center' })
  doc.moveDown(0.5)
  doc.moveTo(margin, doc.y).lineTo(842 - margin, doc.y).stroke()
  doc.moveDown(0.5)

  for (let i = 0; i < guildStatsArr.length; i++) {
    const gs = guildStatsArr[i]
    doc.fontSize(12).font('Helvetica')
    const y = doc.y + 5

    if (guildLogos[gs.guild] && fs.existsSync(guildLogos[gs.guild])) {
      try {
        doc.image(guildLogos[gs.guild], colLogoX, y, { fit: [colLogoWidth, colLogoWidth], align: 'center' })
      } catch (_err) {
        doc.text('No Logo', colLogoX, y, { height: colLogoWidth, align: 'center' })
      }
    } else {
      doc.text('No Logo', colLogoX, y, { height: colLogoWidth, align: 'center' })
    }

    const titleY = y + 23

    doc.text(gs.guild, colGuildX, titleY, { width: colGuildWidth, align: 'center' })
    doc.text(gs.total.total.toFixed(2).toString(), colTotalX, titleY, { width: colTotalWidth, align: 'center' })
    doc.text(gs.participants.toString(), colParticipantsX, titleY, { width: colParticipantsWidth, align: 'center' })
    doc.text(gs.total.average.toString(), colAvgX, titleY, { width: colAvgWidth, align: 'center' })
    doc.fontSize(10).font('Helvetica')
    const top5Y = y + 12

    const topUsers = await getTopUsersForGuild(gs.guild, 5)
    const topUsersStr = topUsers.map(u => `${u.name} (${u.points.total})`).join(', ')
    doc.text(topUsersStr, colTopUsersX, top5Y, { width: colTopUsersWidth, align: 'left' })

    const avgExercise = gs.exercise.average
    const avgSportsTurn = gs.sportsTurn.average
    const avgTrySport = gs.trySport.average
    const totalHealth = parseFloat(gs.tryRecipe.total) +
                        parseFloat(gs.goodSleep.total) +
                        parseFloat(gs.meditate.total) +
                        parseFloat(gs.lessAlc.total)
    const avgHealth = gs.participants > 0 ? (totalHealth / gs.participants).toFixed(2) : 'N/A'
    const guildAveragesStr = `Average exercise points: ${avgExercise}\nAverage sports session points: ${avgSportsTurn}\nAverage try sport points: ${avgTrySport}\nAverage health points: ${avgHealth}`
    doc.text(guildAveragesStr, colGuildAveragesX + 40, top5Y - 8, { width: colGuildAveragesWidth, align: 'left' })

    doc.moveDown(3.5)

    if ((i + 1) % 5 === 0 && (i + 1) < guildStatsArr.length) {
      doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 })
      doc.fontSize(13).font('Helvetica-Bold')
      headerY = doc.y
      doc.text('Guild', colGuildX, headerY, { width: colGuildWidth, align: 'center' })
      doc.text('Total', colTotalX, headerY, { width: colTotalWidth, align: 'center' })
      doc.text('Participants', colParticipantsX, headerY, { width: colParticipantsWidth, align: 'center' })
      doc.text('Avg', colAvgX, headerY, { width: colAvgWidth, align: 'center' })
      doc.text('Top 5 Guild Members', colTopUsersX, headerY, { width: colTopUsersWidth, align: 'center' })
      doc.text('Guild Averages', colGuildAveragesX, headerY, { width: colGuildAveragesWidth, align: 'center' })
      doc.moveDown(0.5)
      doc.moveTo(margin, doc.y).lineTo(842 - margin, doc.y).stroke()
      doc.moveDown(0.5)
    }
  }

  headerY = doc.y
  doc.fontSize(11).font('Helvetica-Bold')
  doc.text(`Overall Total Points across all guilds: ${overallTotalPoints.toFixed(1)}`, colGuildX, headerY, { align: 'left' })

  // --- Section 2: Top Users ---
  doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 })
  doc.fontSize(16).text('Overall Top Users', { align: 'center' })
  doc.moveDown(0.5)
  {
    const margin = 30
    const availableWidth = 842 - margin * 2

    const colRankX = margin
    const colRankWidth = 50

    const colNameX = colRankX + colRankWidth + 10
    const colNameWidth = 150

    const colGuildX = colNameX + colNameWidth + 10
    const colGuildWidth = 100

    const colTeamX = colGuildX + colGuildWidth + 10
    const colTeamWidth = 150

    const colPointsX = colTeamX + colTeamWidth + 10
    const colPointsWidth = 100

    const colCategoriesX = colPointsX + colPointsWidth + 10
    const colCategoriesWidth = availableWidth - (colCategoriesX - margin)

    doc.fontSize(13).font('Helvetica-Bold')
    let rowY = doc.y
    doc.text('Rank', colRankX, rowY, { width: colRankWidth, align: 'center' })
    doc.text('Name', colNameX, rowY, { width: colNameWidth, align: 'center' })
    doc.text('Guild', colGuildX, rowY, { width: colGuildWidth, align: 'center' })
    doc.text('Team', colTeamX, rowY, { width: colTeamWidth, align: 'center' })
    doc.text('Total Points', colPointsX, rowY, { width: colPointsWidth, align: 'center' })
    doc.text('Categories', colCategoriesX, rowY, { width: colCategoriesWidth, align: 'center' })
    doc.moveDown(0.5)
    doc.moveTo(margin, doc.y).lineTo(842 - margin, doc.y).stroke()
    doc.moveDown(0.5)
    const topUsersOverall = await getOverallUserRanking(10)
    for (let i = 0; i < topUsersOverall.length; i++) {
      doc.fontSize(13).font('Helvetica')
      const user = topUsersOverall[i]
      rowY = doc.y
      const middleY = rowY + 12
      doc.text((i+1).toString(), colRankX, middleY, { width: colRankWidth, align: 'center' })
      doc.fontSize(12).font('Helvetica')
      doc.text(user.name, colNameX, middleY, { width: colNameWidth, align: 'center' })
      doc.text(user.guild, colGuildX, middleY, { width: colGuildWidth, align: 'center' })
      const teamName = user.team && user.team.name ? user.team.name : 'no team'
      doc.text(teamName, colTeamX, middleY, { width: colTeamWidth, align: 'center' })
      doc.text(user.points.total.toString(), colPointsX, middleY, { width: colPointsWidth, align: 'center' })
      
      const exercise = user.points.exercise || 0
      const sportsTurn = user.points.sportsTurn || 0
      const trySport = user.points.trySport || 0
      const healthTotal = (user.points.tryRecipe || 0) + (user.points.goodSleep || 0) + (user.points.meditate || 0) + (user.points.lessAlc || 0)
      const categoriesStr = `Exercise points: ${exercise.toFixed(2)}\nSports session points: ${sportsTurn.toFixed(2)}\nTry sport points: ${trySport.toFixed(2)}\nHealth points: ${healthTotal.toFixed(2)}`
      
      doc.fontSize(8).font('Helvetica')
      doc.text(categoriesStr, colCategoriesX + 45, rowY, { width: colCategoriesWidth, align: 'left' })
      doc.moveDown(1)
    }
  }

  // --- Section 3: Team Rankings ---
  doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 })
  doc.fontSize(16).text('Overall Team Ranking (by Average Points)', { align: 'center' })
  doc.moveDown(0.5)
  {
    const margin = 30
    const availableWidth = 842 - margin * 2

    const colRankX = margin
    const colRankWidth = 50

    const colTeamX = colRankX + colRankWidth + 10
    const colTeamWidth = 200

    const colEligibleX = colTeamX + colTeamWidth + 10
    const colEligibleWidth = 100

    const colAvgX = colEligibleX + colEligibleWidth + 10
    const colAvgWidth = 100

    const colTeamAveragesX = colAvgX + colAvgWidth + 10
    const colTeamAveragesWidth = availableWidth - (colTeamAveragesX - margin)
    
    doc.fontSize(13).font('Helvetica-Bold')
    let rowY = doc.y
    doc.text('Rank', colRankX, rowY, { width: colRankWidth, align: 'center' })
    doc.text('Team Name', colTeamX, rowY, { width: colTeamWidth, align: 'center' })
    doc.text('Members', colEligibleX, rowY, { width: colEligibleWidth, align: 'center' })
    doc.text('Avg Points', colAvgX, rowY, { width: colAvgWidth, align: 'center' })
    doc.text('Team Averages', colTeamAveragesX, rowY, { width: colTeamAveragesWidth, align: 'center' })
    doc.moveDown(0.5)
    doc.moveTo(margin, doc.y).lineTo(842 - margin, doc.y).stroke()
    doc.moveDown(0.5)
    
    const teamRankings = (await pointService.getTeamRankings()).slice(0, 5)
    for (let i = 0; i < teamRankings.length; i++) {
      doc.fontSize(12).font('Helvetica')
      const teamRanking = teamRankings[i]
      rowY = doc.y
      const middleY = rowY + 12
      const teamDoc = await Team.findOne({ name: teamRanking.name }).populate('members')
      const eligibleMembers = teamDoc.members.filter(m => m.points.total > 0)
      const eligibleCount = eligibleMembers.length
      let avgExercise = 'N/A', avgSportsTurn = 'N/A', avgTrySport = 'N/A', avgHealth = 'N/A'
      if (eligibleMembers.length > 0) {
        avgExercise = (eligibleMembers.reduce((sum, m) => sum + (m.points.exercise || 0), 0) / eligibleMembers.length).toFixed(2)
        avgSportsTurn = (eligibleMembers.reduce((sum, m) => sum + (m.points.sportsTurn || 0), 0) / eligibleMembers.length).toFixed(2)
        const totalTrySport = eligibleMembers.reduce((sum, m) => sum + (m.points.trySport || 0), 0)
        const totalHealth = eligibleMembers.reduce((sum, m) => {
          const health = (m.points.tryRecipe || 0) + (m.points.goodSleep || 0) + (m.points.meditate || 0) + (m.points.lessAlc || 0)
          return sum + health
        }, 0)
        avgHealth = (totalHealth / eligibleMembers.length).toFixed(2)
        avgTrySport = (totalTrySport / eligibleMembers.length).toFixed(2)
      }
      
      doc.text((i+1).toString(), colRankX, middleY, { width: colRankWidth, align: 'center' })
      doc.text(teamRanking.name, colTeamX, middleY, { width: colTeamWidth, align: 'center' })
      doc.text(eligibleCount.toString(), colEligibleX, middleY, { width: colEligibleWidth, align: 'center' })
      doc.text(teamRanking.averagePointsPerMember ? teamRanking.averagePointsPerMember.toString() : 'N/A', colAvgX, middleY, { width: colAvgWidth, align: 'center' })
      
      let teamAvgStr = 'N/A'
      if (avgExercise !== 'N/A' && avgSportsTurn !== 'N/A' && avgHealth !== 'N/A' && avgTrySport !== 'N/A') {
        teamAvgStr = `Average exercise points: ${avgExercise}\nAverage sports session points: ${avgSportsTurn}\nAverage try sport points: ${avgTrySport}\nAverage health points: ${avgHealth}`
      }
      doc.fontSize(10).font('Helvetica')
      doc.text(teamAvgStr, colTeamAveragesX + 65, rowY, { width: colTeamAveragesWidth, align: 'left' })
      
      doc.moveDown(1)
      const memberNames = teamDoc.members.map(m => m.name).join(', ')
      doc.fontSize(10).text(`Members: ${memberNames}`, colTeamX, doc.y, { width: availableWidth - (colTeamX - margin) })
      doc.moveDown(1.5)
      doc.fontSize(12)
    }
  }

  // --- Section 4: SVG Charts ---
  doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 })

  let svgString = fs.readFileSync('combinedGuildTotalPoints.svg', 'utf8')
  await SVGtoPDF(doc, svgString, 30, 30, { width: 1042, height: 745 })

  doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 })

  svgString = fs.readFileSync('combinedGuildAverages.svg', 'utf8')
  await SVGtoPDF(doc, svgString, 30, 30, { width: 1042, height: 745 })

  doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 })

  svgString = fs.readFileSync('guildScatterPlot.svg', 'utf8')
  await SVGtoPDF(doc, svgString, 30, 30, { width: 1042, height: 745 })

  doc.end()

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
  })

  console.log(`PDF generated at: ${outputPath}`)
}

async function generateHistogramPdf() {
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 30 })
  const date = new Date()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const outputPath = `histograms_${hours}_${minutes}.pdf`
  const stream = fs.createWriteStream(outputPath)
  doc.pipe(stream)

  let guildStatsArr = await pointService.getGuildsTotals()
  guildStatsArr = guildStatsArr.filter(gs => gs.participants > 2 && gs.total.total > 0)
  guildStatsArr.sort((a, b) => parseFloat(b.total.average) - parseFloat(a.total.average))

  for (let i = 0; i < guildStatsArr.length; i++) {
    const gs = guildStatsArr[i]
    const guildSvg = `histogram_${gs.guild}.svg`
    if (fs.existsSync(guildSvg)) {
      const svgString = fs.readFileSync(guildSvg, 'utf8')
      await SVGtoPDF(doc, svgString, 30, 30, { width: 1042, height: 745 })
    } else {
      console.log(`SVG not found for ${gs.guild}`)
    }
  
    if (i < guildStatsArr.length - 1) {
      doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 })
    }
  }

  doc.end()

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
  })

  console.log(`Histogram PDF generated at: ${outputPath}`)
}

async function generateChartPdf() {
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 30 })
  const date = new Date()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const outputPath = `charts_${hours}_${minutes}.pdf`
  const stream = fs.createWriteStream(outputPath)
  doc.pipe(stream)

  let svgString = fs.readFileSync('combinedGuildTotalPoints.svg', 'utf8')
  await SVGtoPDF(doc, svgString, 30, 30, { width: 1042, height: 745 })

  doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 })

  svgString = fs.readFileSync('combinedGuildAverages.svg', 'utf8')
  await SVGtoPDF(doc, svgString, 30, 30, { width: 1042, height: 745 })

  doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 })

  svgString = fs.readFileSync('guildScatterPlot.svg', 'utf8')
  await SVGtoPDF(doc, svgString, 30, 30, { width: 1042, height: 745 })

  doc.end()

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
  })

  console.log(`Chart PDF generated at: ${outputPath}`)
}

async function run() {
  if (process.argv.includes('--histograms')) {
    try {
      await mongoose.connect(config.mongodbUri)
      console.log('Connected to MongoDB')
      await generateHistogramPdf()
      await mongoose.disconnect()
      console.log('Disconnected from MongoDB')
      process.exit(0)
    } catch (error) {
      console.error('Error generating histogram PDF:', error)
      process.exit(1)
    }
  } else if (process.argv.includes('--charts')) { 
    try {
      await mongoose.connect(config.mongodbUri)
      console.log('Connected to MongoDB')
      await generateChartPdf()
      await mongoose.disconnect()
      console.log('Disconnected from MongoDB')
      process.exit(0)
    } catch (error) {
      console.error('Error generating chart PDF:', error)
      process.exit(1)
    }
  } else {
    try {
      await mongoose.connect(config.mongodbUri)
      console.log('Connected to MongoDB')
      await generateLandscapePdf()
      await mongoose.disconnect()
      console.log('Disconnected from MongoDB')
      process.exit(0)
    } catch (error) {
      console.error('Error generating PDF:', error)
      process.exit(1)
    }
  }
}

run()