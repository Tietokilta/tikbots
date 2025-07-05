(async () => {
    const { D3Node } = await import('d3-node')
    const fs = require('fs')
    const mongoose = require('mongoose')
    const config = require('./config')
    const User = require('./models/user-model')
    const pointService = require('./services/point-service')

    function generateTestDataForCombinedChart(guilds, startDate, numDays) {
      const data = []
      const start = new Date(startDate)
      for (let i = 0; i < numDays; i++) {
        const currentDate = new Date(start)
        currentDate.setDate(currentDate.getDate() + i)
        const dateStr = currentDate.toISOString().split("T")[0]
        guilds.forEach(guild => {
          const count = Math.floor(Math.random() * 5) + 1
          const totalPoints = Math.floor(Math.random() * 200) + 50
          const avgPoints = totalPoints / count
          data.push({
            _id: { guild, date: dateStr },
            totalPoints,
            count,
            avgPoints
          })
        })
      }
      return data
    }

    async function getGuildInitialAveragePoints() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const agg = await User.aggregate([
        { $match: { createdAt: { $lte: sevenDaysAgo } } },
        { $group: {
             _id: "$guild",
             totalPoints: { $sum: "$points.total" },
             count: { $sum: 1 }
          }
        },
        { $addFields: { average: { $divide: ["$totalPoints", "$count"] } } }
      ])
      const initialValues = {}
      agg.forEach(doc => {
        initialValues[doc._id] = doc.average
      })
      return initialValues
    }  
    
    async function getGuildInitialTotalPoints() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const agg = await User.aggregate([
        { $match: { createdAt: { $lte: sevenDaysAgo } } },
        { $group: {
             _id: "$guild",
             totalPoints: { $sum: "$points.total" }
          }
        }
      ])
      const initialTotals = {}
      agg.forEach(doc => {
        initialTotals[doc._id] = doc.totalPoints
      })
      return initialTotals
    }    

    async function getDailyAveragePointsByGuild() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
      const initialDataAgg = await User.aggregate([
        { $match: { createdAt: { $lte: sevenDaysAgo } } },
        { $group: {
             _id: "$guild",
             totalPoints: { $sum: "$points.total" },
             count: { $sum: 1 }
          }
        },
        { $addFields: { 
             avgPoints: { $divide: [ "$totalPoints", "$count" ] },
             initialTotal: "$totalPoints"  // Added field for initial total points
        } }
      ])
    
      const initialData = initialDataAgg.map(doc => ({
        _id: { guild: doc._id, date: sevenDaysAgo.toISOString().split("T")[0] },
        totalPoints: doc.totalPoints,
        count: doc.count,
        avgPoints: doc.avgPoints,
        initialTotal: doc.initialTotal
      }))
    
      const dailyData = await User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: {
             _id: {
               guild: "$guild",
               date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
             },
             totalPoints: { $sum: "$points.total" },
             count: { $sum: 1 }
        }},
        { $addFields: { avgPoints: { $divide: [ "$totalPoints", "$count" ] } } },
        { $sort: { "_id.date": 1 } }
      ])
    
      const combinedData = initialData.concat(dailyData)
      combinedData.sort((a, b) => {
        if (a._id.guild === b._id.guild) {
          return a._id.date.localeCompare(b._id.date)
        }
        return a._id.guild.localeCompare(b._id.guild)
      })
    
      return combinedData
    }    

    function fillMissingDays(data, start, end, valueKey, initialValue) {
      const filled = []
      let currentValue = initialValue
      let dataIndex = 0
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dStr = d.toISOString().split("T")[0]
        if (dataIndex < data.length) {
          const pointDateStr = data[dataIndex].date.toISOString().split("T")[0]
          if (dStr === pointDateStr) {
            currentValue = data[dataIndex][valueKey]
            filled.push({ date: new Date(d), [valueKey]: currentValue })
            dataIndex++
            continue
          }
        }
        filled.push({ date: new Date(d), [valueKey]: currentValue })
      }
      return filled
    } 

    async function getUsersByGuild(guild) {
      return await User.find({ guild })
    }

    async function generateCombinedGuildAverageChart(data) {
        const outerWidth = 1042, outerHeight = 745

        const margin = { top: 30, right: 30, bottom: 50, left: 50 }
        const availableWidth = outerWidth - margin.left - margin.right
        const chartWidth = Math.floor(availableWidth * 0.90)
        const legendWidth = availableWidth - chartWidth
        const height = outerHeight - margin.top - margin.bottom
        const d3n = new D3Node()
        const d3 = d3n.d3

        const svg = d3n.createSVG(outerWidth, outerHeight)

        const chartG = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`)

        const guildDataMap = {}
        data.forEach(d => {
          const guild = d._id.guild
          if (!guildDataMap[guild]) {
            guildDataMap[guild] = []
          }
          guildDataMap[guild].push(d)
        })

        const allGuilds = Object.keys(guildDataMap)
        const topGuilds = allGuilds.sort((a, b) => {
          const totalA = guildDataMap[a].reduce((acc, d) => acc + d.totalPoints, 0)
          const totalB = guildDataMap[b].reduce((acc, d) => acc + d.totalPoints, 0)
          return totalB - totalA
        }).slice(0, 10)
        for (const guild of allGuilds) {
          if (!topGuilds.includes(guild)) {
            delete guildDataMap[guild]
          }
        }
        const guildNames = topGuilds

        const parseTime = d3.timeParse("%Y-%m-%d")
        for (const guild in guildDataMap) {
          guildDataMap[guild].forEach(d => {
            d.date = parseTime(d._id.date)
            d.avgPoints = +d.avgPoints
          })
          guildDataMap[guild].sort((a, b) => a.date - b.date)
        }

        let allDates = [], allAvgPoints = []
        Object.values(guildDataMap).forEach(arr => {
          arr.forEach(d => {
            allDates.push(d.date)
            allAvgPoints.push(d.avgPoints)
          })
        })

        const initialAverages = await getGuildInitialAveragePoints()
        const globalStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const globalEnd = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        for (const guild in guildDataMap) {
          const initialValue = initialAverages[guild] || 0
          guildDataMap[guild] = fillMissingDays(guildDataMap[guild], globalStart, globalEnd, "avgPoints", initialValue)
        }

        const x = d3.scaleTime()
          .domain(d3.extent([globalStart, globalEnd]))
          .range([0, chartWidth])
        const y = d3.scaleLinear()
          .domain([0, d3.max(allAvgPoints)])
          .nice()
          .range([height, 0])

        const xAxis = d3.axisBottom(x).ticks(6)
        const gx = chartG.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(xAxis)
        gx.selectAll("path, line").attr("stroke", "black")
        gx.selectAll("text").attr("fill", "black")

        const yAxis = d3.axisLeft(y)
        const gy = chartG.append("g")
          .call(yAxis)
        gy.selectAll("path, line").attr("stroke", "black")
        gy.selectAll("text").attr("fill", "black")

        const color = d3.scaleOrdinal(d3.schemeCategory10).domain(guildNames)

        const line = d3.line()
          .x(d => x(d.date))
          .y(d => y(d.avgPoints))

        guildNames.forEach(guild => {
          const guildData = guildDataMap[guild]
          chartG.append("path")
            .datum(guildData)
            .attr("fill", "none")
            .attr("stroke", color(guild))
            .attr("stroke-width", 2)
            .attr("d", line)
          chartG.selectAll(`.dot-${guild}`)
            .data(guildData)
            .enter().append("circle")
            .attr("class", `dot-${guild}`)
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.avgPoints))
            .attr("r", 3)
            .attr("fill", color(guild))
        })

        const legendX = margin.left + chartWidth + 20
        const legendG = svg.append("g")
          .attr("transform", `translate(${legendX},${margin.top})`)
        guildNames.forEach((guild, i) => {
          const legendItemY = i * 25
          legendG.append("rect")
            .attr("x", 0)
            .attr("y", legendItemY)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(guild))
          legendG.append("text")
            .attr("x", 20)
            .attr("y", legendItemY + 12)
            .text(guild)
            .style("font-size", "12px")
            .attr("fill", "black")
        })

        svg.append("text")
          .attr("x", outerWidth / 2)
          .attr("y", outerHeight - 10)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .text("Date")
        svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -outerHeight / 2)
          .attr("y", 15)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .text("Average Points")
        svg.append("text")
          .attr("x", outerWidth / 2)
          .attr("y", margin.top / 2)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .text("Average Points for Top 10 Guilds (Last 7 Days)")

        const svgString = d3n.svgString()
        fs.writeFileSync("combinedGuildAverages.svg", svgString)
        console.log("Average Points SVG generated at: combinedGuildAverages.svg")
    }

    async function generateCombinedGuildTotalPointsChart(data) {
      const outerWidth = 1042, outerHeight = 745
      const margin = { top: 30, right: 30, bottom: 50, left: 50 }
      const availableWidth = outerWidth - margin.left - margin.right
      const chartWidth = Math.floor(availableWidth * 0.90)
      const legendWidth = availableWidth - chartWidth
      const height = outerHeight - margin.top - margin.bottom

      const d3n = new D3Node()
      const d3 = d3n.d3

      const svg = d3n.createSVG(outerWidth, outerHeight)

      const chartG = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

      const guildDataMap = {}
      data.forEach(d => {
        const guild = d._id.guild
        if (!guildDataMap[guild]) {
          guildDataMap[guild] = []
        }
        guildDataMap[guild].push(d)
      })

      const allGuilds = Object.keys(guildDataMap)
      const topGuilds = allGuilds.sort((a, b) => {
        const totalA = guildDataMap[a].reduce((acc, d) => acc + d.totalPoints, 0)
        const totalB = guildDataMap[b].reduce((acc, d) => acc + d.totalPoints, 0)
        return totalB - totalA
      }).slice(0, 10)

      for (const guild of allGuilds) {
        if (!topGuilds.includes(guild)) {
          delete guildDataMap[guild]
        }
      }
      const guildNames = topGuilds

      const parseTime = d3.timeParse("%Y-%m-%d")
      for (const guild in guildDataMap) {
        guildDataMap[guild].forEach(d => {
          d.date = parseTime(d._id.date)
          d.totalPoints = +d.totalPoints
        })
        guildDataMap[guild].sort((a, b) => a.date - b.date)
        let cumulative = 0
        guildDataMap[guild].forEach(d => {
          cumulative += d.totalPoints
          d.cumulativePoints = cumulative
        })
      }
    
      let allDates = [], allCumulativePoints = []
      Object.values(guildDataMap).forEach(arr => {
        arr.forEach(d => {
          allDates.push(d.date)
          allCumulativePoints.push(d.cumulativePoints)
        })
      })

      const initialTotals = await getGuildInitialTotalPoints()
      const globalStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const globalEnd = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      for (const guild in guildDataMap) {
        const initialValue = initialTotals[guild] || 0
        guildDataMap[guild] = fillMissingDays(guildDataMap[guild], globalStart, globalEnd, "cumulativePoints", initialValue)
      }

      const x = d3.scaleTime()
      .domain(d3.extent([globalStart, globalEnd]))
        .range([0, chartWidth])

      const y = d3.scaleLinear()
        .domain([0, d3.max(allCumulativePoints)])
        .nice()
        .range([height, 0])

      const xAxis = d3.axisBottom(x).ticks(6)
      const gx = chartG.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
      gx.selectAll("path, line").attr("stroke", "black")
      gx.selectAll("text").attr("fill", "black")

      const yAxis = d3.axisLeft(y)
      const gy = chartG.append("g")
        .call(yAxis)
      gy.selectAll("path, line").attr("stroke", "black")
      gy.selectAll("text").attr("fill", "black")

      const color = d3.scaleOrdinal(d3.schemeCategory10).domain(guildNames)

      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.cumulativePoints))
    
      guildNames.forEach(guild => {
        const guildData = guildDataMap[guild]
        chartG.append("path")
          .datum(guildData)
          .attr("fill", "none")
          .attr("stroke", color(guild))
          .attr("stroke-width", 2)
          .attr("d", line)
        chartG.selectAll(`.dot-${guild}`)
          .data(guildData)
          .enter().append("circle")
          .attr("class", `dot-${guild}`)
          .attr("cx", d => x(d.date))
          .attr("cy", d => y(d.cumulativePoints))
          .attr("r", 3)
          .attr("fill", color(guild))
      })

      const legendX = margin.left + chartWidth + 20
      const legendG = svg.append("g")
        .attr("transform", `translate(${legendX},${margin.top})`)
      guildNames.forEach((guild, i) => {
        const legendItemY = i * 25
        legendG.append("rect")
          .attr("x", 0)
          .attr("y", legendItemY)
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", color(guild))
        legendG.append("text")
          .attr("x", 20)
          .attr("y", legendItemY + 12)
          .text(guild)
          .style("font-size", "12px")
          .attr("fill", "black")
      })

      svg.append("text")
        .attr("x", outerWidth / 2)
        .attr("y", outerHeight - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Date")
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -outerHeight / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Total Points")
      svg.append("text")
        .attr("x", outerWidth / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Total Points for Top 10 Guilds (Last 7 Days)")
    
      const svgString = d3n.svgString()
      fs.writeFileSync("combinedGuildTotalPoints.svg", svgString)
      console.log("Total Points SVG generated at: combinedGuildTotalPoints.svg")
    }

    async function generateGuildHistogramChart(guild, users) {
      const data = users.map(u => u.points.total)
  
      const outerWidth = 1042, outerHeight = 745
      const margin = { top: 30, right: 30, bottom: 50, left: 50 },
            width = outerWidth - margin.left - margin.right,
            height = outerHeight - margin.top - margin.bottom
  
      const d3n = new D3Node()
      const d3 = d3n.d3
      const svg = d3n.createSVG(outerWidth, outerHeight)
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)
  
      const x = d3.scaleLinear()
        .domain([d3.min(data), d3.max(data)])
        .nice()
        .range([0, width])
  
      const histogram = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(20))
      const bins = histogram(data)
  
      const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height, 0])

      const bar = g.selectAll(".bar")
        .data(bins)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`)

      bar.append("rect")
        .attr("x", 1)
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", d => height - y(d.length))
        .attr("fill", "steelblue")
  
      g.append("g")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(x))
       .selectAll("text")
       .attr("fill", "black")
      g.selectAll("path, line").attr("stroke", "black")
  
      g.append("g")
       .call(d3.axisLeft(y))
       .selectAll("text")
       .attr("fill", "black")
      g.selectAll("path, line").attr("stroke", "black")
  
      svg.append("text")
        .attr("x", outerWidth / 2)
        .attr("y", outerHeight - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Total Points")
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -outerHeight / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Frequency")
      svg.append("text")
         .attr("x", outerWidth / 2)
         .attr("y", margin.top / 2)
         .attr("text-anchor", "middle")
         .style("font-size", "16px")
         .text(`Distribution of Points for ${guild}`)
  
      const svgString = d3n.svgString()
      fs.writeFileSync(`histogram_${guild}.svg`, svgString)
      console.log(`Histogram for guild "${guild}" saved at: histogram_${guild}.svg`)
    }

    async function generateHistogramsForAllGuilds() {
      const guilds = User.validGuilds;
      for (const guild of guilds) {
        const users = await getUsersByGuild(guild);
        const validUsers = users.filter(user => user.points.total > 0);
        const totalParticipants = validUsers.length;
        const totalPoints = validUsers.reduce((sum, user) => sum + user.points.total, 0);
        if (totalParticipants > 2 && totalPoints > 0) {
          await generateGuildHistogramChart(guild, validUsers);
        } else {
          console.log(`Skipping guild ${guild}: participants=${totalParticipants}, totalPoints=${totalPoints}`);
        }
      }
    }    

    async function generateGuildScatterPlot() {
      const outerWidth = 1042, outerHeight = 745
      const margin = { top: 30, right: 30, bottom: 50, left: 50 }
      const width = outerWidth - margin.left - margin.right
      const height = outerHeight - margin.top - margin.bottom
      
      const d3n = new D3Node()
      const d3 = d3n.d3
      
      const svg = d3n.createSVG(outerWidth, outerHeight)
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
      
      const guildStats = await pointService.getGuildsTotals()
      const data = guildStats.map(d => ({
        guild: d.guild,
        participants: d.participants,
        average: d.total.average
      }))
      
      const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.participants)])
        .range([0, width])
        .nice()
        
      console.log(d3.max(data, d => d.average))

      const y = d3.scaleLinear()
        .domain([0, 155])
        .range([height, 0])
        .nice()
      
      const xAxis = d3.axisBottom(x)
      const gx = g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
      gx.selectAll("path, line").attr("stroke", "black")
      gx.selectAll("text").attr("fill", "black")
      
      const yAxis = d3.axisLeft(y)
      const gy = g.append("g")
        .call(yAxis)
      gy.selectAll("path, line").attr("stroke", "black")
      gy.selectAll("text").attr("fill", "black")
      
      const color = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(data.map(d => d.guild))
      
      g.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => x(d.participants))
        .attr("cy", d => y(d.average))
        .attr("r", 5)
        .attr("fill", d => color(d.guild))
      
      g.selectAll("text.label")
        .data(data)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(d.participants) + 7)
        .attr("y", d => y(d.average) - 7)
        .text(d => d.guild)
        .style("font-size", "10px")
        .attr("fill", "black")
      
      svg.append("text")
        .attr("x", outerWidth / 2)
        .attr("y", outerHeight - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Number of Participants")
      
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -outerHeight / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Average Points per Participant")
      
      svg.append("text")
        .attr("x", outerWidth / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Guild Participants vs. Average Points")
      
      const svgString = d3n.svgString()
      const fs = require('fs')
      fs.writeFileSync("guildScatterPlot.svg", svgString)
      console.log("Scatter Plot generated at: guildScatterPlot.svg")
    }

    async function generateGuildCharts() {
      const aggregatedData = await getDailyAveragePointsByGuild()
      await generateCombinedGuildAverageChart(aggregatedData)
      await generateCombinedGuildTotalPointsChart(aggregatedData)
      await generateHistogramsForAllGuilds()
      await generateGuildScatterPlot()
    }

    if (process.argv.includes('--test')) {
      console.log("Running in test mode with generated test data...")
      const testGuilds = ["TiK", "PT", "FK", "MK"]
      const testData = generateTestDataForCombinedChart(testGuilds, "2025-02-02", 7)
      await generateCombinedGuildAverageChart(testData)
      await generateCombinedGuildTotalPointsChart(testData)
      await generateHistogramsForAllGuilds()
    } else {
      try {
        await mongoose.connect(config.mongodbUri)
        console.log("Connected to MongoDB")
        await generateGuildCharts()
        await mongoose.disconnect()
        console.log("Disconnected from MongoDB")
      } catch (error) {
        console.error("Error generating charts:", error)
      }
    }
})()
