// Define margins and dimensions
const margin = { top: 50, right: 50, bottom: 50, left: 80 },
      width = 900 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

// Append SVG container
const svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load the data
d3.csv("temperature_daily.csv").then(data => {
    data.forEach(d => {
        d.date = new Date(d.date);
        d.year = d.date.getFullYear();
        d.month = d.date.getMonth() + 1;
        d.temperature = +d.temperature;
    });

    // Nest data by year and month
    const nestedData = d3.group(data, d => d.year, d => d.month);

    // Define scales
    const years = Array.from(new Set(data.map(d => d.year)));
    const months = Array.from(new Set(data.map(d => d.month)));
    
    const xScale = d3.scaleBand().domain(years).range([0, width]).padding(0.05);
    const yScale = d3.scaleBand().domain(months).range([0, height]).padding(0.05);
    
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
        .domain(d3.extent(data, d => d.temperature));

    // Draw heatmap cells
    svg.selectAll(".cell")
        .data(data)
        .enter().append("rect")
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.month))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.temperature))
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                .html(`Date: ${d.date.toDateString()}<br>Temp: ${d.temperature}°C`)
                .style("top", `${event.pageY - 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));
    
    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => d3.timeFormat("%B")(new Date(0, d - 1, 1))));
    
    // Tooltip
    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("visibility", "hidden");
    
    // Add legend
    // const legend = svg.append("g")
    //     .attr("transform", `translate(${width - 100}, 0)");

    // const legendScale = d3.scaleLinear()
    //     .domain(colorScale.domain())
    //     .range([100, 0]);

    // const legendAxis = d3.axisRight(legendScale)
    //     .ticks(5);
    
    // legend.selectAll(".legend-bar")
    //     .data(d3.range(0, 1.1, 0.1))
    //     .enter().append("rect")
    //     .attr("y", d => legendScale(d * (colorScale.domain()[1] - colorScale.domain()[0]) + colorScale.domain()[0]))
    //     .attr("width", 10)
    //     .attr("height", 10)
    //     .attr("fill", d => colorScale(d * (colorScale.domain()[1] - colorScale.domain()[0]) + colorScale.domain()[0]));
    
    // legend.append("g")
    //     .attr("transform", "translate(10,0)")
    //     .call(legendAxis);

});
