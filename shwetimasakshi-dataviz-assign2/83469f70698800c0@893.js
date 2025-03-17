function _1(md){return(
md`# ShwetimaSakshi-dataviz-assign2`
)}

function _2(md){return(
md`data = d3.csv("FileAttachment("temperature_daily.csv").csv()", d => ({
  date: new Date(d.date),
  temperature: +d.temperature
}))`
)}

function _temperature_daily(__query,FileAttachment,invalidation){return(
__query(FileAttachment("temperature_daily.csv"),{from:{table:"temperature_daily"},sort:[],slice:{to:null,from:null},filter:[],select:{columns:null}},invalidation)
)}

function _4(md){return(
md`# Load and transform data`
)}

async function _dataset(d3,FileAttachment){return(
d3.csvParse(await FileAttachment("temperature_daily.csv").text(), d3.autoType)
)}

function _transformedData(dataset){return(
dataset.map(d => {
  const dateObj = new Date(Date.UTC(
    parseInt( d.date.toISOString().substring(0, 4)), // Year is first 4 characters
    parseInt( d.date.toISOString().substring(5, 7))-1, // Month
    parseInt( d.date.toISOString().substring(8, 10)) // Day
  ));
  const year = dateObj.getUTCFullYear();
  const month = dateObj.getUTCMonth()+1;
  return { ...d, year, month };
})
)}

function _groupedData(transformedData){return(
transformedData.reduce((acc, d) => {
  const key = `${d.year}-${String(d.month).padStart(2, '0')}`;
  if (!acc[key]) {
    acc[key] = { max: -Infinity, min: Infinity };
  }
  acc[key].max = Math.max(acc[key].max, d.max_temperature);
  acc[key].min = Math.min(acc[key].min, d.min_temperature);
  return acc;
}, {})
)}

function _monthNames(){return(
["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
)}

function _combinedData(groupedData,monthNames){return(
Object.keys(groupedData).map(key => {
  const [year, month] = key.split('-');
  return {
    year: parseInt(year, 10),
    month: parseInt(month, 10),
    month_name: monthNames[parseInt(month, 10) - 1],
    max_temperature: groupedData[key].max,
    min_temperature: groupedData[key].min
  };
})
)}

function _10(md){return(
md`# Level 1 challenge: Year/Month Heatmap`
)}

async function _11(html,Inputs,vl,combinedData)
{
  // Create a container element to have the radio button and heatmap rendered together
  const container = html`<div></div>`;
  
  // Create the radio button to select what temoerature we want to show on heatmap
  const radio = Inputs.radio(
    ["max_temperature", "min_temperature"],
    {
      label: "Select temperature",
      value: "max_temperature",
      format: d => d === "max_temperature" ? "Max Temperature" : "Min Temperature"
    }
  );
  
  // Add the radio input to the container
  container.appendChild(radio);

  // Creating asynchronous function to render the heatmap using vega-light
  async function renderChart(fieldName) {
    return await vl.markRect()
      .data(combinedData)
      // transform date and year to use in tooltip
      .transform([
        {
          "calculate": "datum.year + '-' + (datum.month < 10 ? '0' : '') + datum.month",
          "as": "formatted_date"
        }
      ])
      .encode(
        vl.x().fieldO('year').title("Year"),
        vl.y().fieldO('month_name').title("Month").sort({field: 'month', op: 'min',order: 'ascending'}),
        vl.color().fieldQ(fieldName).scale({scheme: "reds" }).title("Temperature"),
        vl.tooltip([
           { field: 'formatted_date', title: 'Date' },
           { field: 'max_temperature', title: 'Max' },
           { field: 'min_temperature', title: 'Min' }
         ])
      )
      .title({ text: 'Monthly temperature of Hong Kong over years' })
      .width(600)
      .height(400)
      .render();
  }
  
  // Render the initial chart using the default value from the radio button choices
  let currentChart = await renderChart(radio.value);
  container.appendChild(currentChart);
  
  // Listen for changes on the radio input and update the chart accordingly
  radio.addEventListener("input", async () => {
    currentChart.remove();
    currentChart = await renderChart(radio.value);
    container.appendChild(currentChart);
  });
  
  return container;
}


function _12(md){return(
md`# Level 2 Challenge: Improvement of the Year/Month Heatmap`
)}

function _lastYear(d3,dataset){return(
d3.max(dataset, d => d.date).getFullYear()
)}

function _lastTenYearData(dataset,lastYear){return(
dataset.filter(d => {
  const entryYear = d.date.getFullYear();
  return entryYear >= (lastYear-10) && entryYear <= lastYear;
})
)}

function _groupDataByMonthYear(lastTenYearData,monthNames){return(
lastTenYearData.reduce((acc, d) => {
  const date = new Date(d.date);
  d.year = date.getFullYear();
  d.month = date.getMonth() + 1;
  d.month_name = monthNames[parseInt(d.month, 10) - 1];
  const key = `${d.year}-${d.month < 10 ? '0' + d.month : d.month}`; 
  if (!acc[key]) {
    acc[key] = [];
  }
  acc[key].push(d);
  return acc;
}, {})
)}

function _a(groupDataByMonthYear){return(
Object.keys(groupDataByMonthYear)
)}

function _tenYearData(groupDataByMonthYear){return(
Object.keys(groupDataByMonthYear).flatMap(key => 
  groupDataByMonthYear[key].map(d => ({
    ...d,
    month: parseInt(key.split("-")[1], 10) // Extracts just the month part ("1") from "2007-1"
  }))
)
)}

async function _18(html,Inputs,vl,tenYearData)
{
  // Create a container element to have the radio button and heatmap rendered together
  const container = html`<div></div>`;
  
  // Create the radio button to select what temoerature we want to show on the chart
  const radio = Inputs.radio(
    ["max_temperature", "min_temperature"],
    {
      label: "Select temperature",
      value: "max_temperature",
      format: d => d === "max_temperature" ? "Max Temperature" : "Min Temperature"
    }
  );
  
  // Add the radio input to the container
  container.appendChild(radio);

  // Creating asynchronous function to render the chart with layers using vega-light
  async function renderChart(fieldName) {
    return await vl.data(tenYearData)
    .transform([{ timeUnit: "date", field: "date", as: "day" },
               { calculate: "datum.year + '-' + (datum.month < 10 ? '0' : '') + datum.month", as: "formatted_date" }
     ])
    .facet({ // Facet is used to create the tiled chart
      column: { field: "year", type: "ordinal", title: "Year" },
      row: { field: "month", type: "ordinal", title: "Month Number" ,sort: "ascending"}
    })
    .spec(
      vl.layer(
        [
          // Line chart showing the temperature trend for each month
          vl.markLine()
            .encode(
              vl.x().fieldQ("day").title(null).axis({ grid: false }),
              vl.y().fieldQ(fieldName).title(null).axis({ grid: false }),
              vl.color().value("black"), // Set line color to black
              vl.tooltip([{ field: 'formatted_date', title: 'Date' },
                          { field: 'max_temperature', title: 'Max' },
                          { field: 'min_temperature', title: 'Min' }
                         ])
            )
            .width(65)
            .height(65),
          
          // Set the background just as we would have in the heatmap to show overall max and min temperature for each month tile
          vl.markRect({ opacity: 0.1 })
            .encode(
              vl.x().fieldQ("day").title(null).axis(null),
              vl.y().fieldQ(fieldName).title(null).axis(null).scale({ domain: [0,30] }),
              vl.color().fieldQ(fieldName).scale({scheme:"reds" }).title("Max Temperature"),
              vl.tooltip([{ field: 'formatted_date', title: 'Date' },
                          { field: 'max_temperature', title: 'Max' },
                          { field: 'min_temperature', title: 'Min' }
                         ])
            )
            .width(50)
            .height(50)
        ]
      )
    )
    .render();
  }
  
  // Render the initial chart using the default value from the radio button choices
  let currentChart = await renderChart(radio.value);
  container.appendChild(currentChart);
  
  // Listen for changes on the radio input and update the chart accordingly
  radio.addEventListener("input", async () => {
    currentChart.remove();
    currentChart = await renderChart(radio.value);
    container.appendChild(currentChart);
  });
  
  return container;
}


function _19(md){return(
md`# Refrences:
- https://observablehq.com/@stanfordvis/multi-view-composition
- https://hexdocs.pm/vega_lite/VegaLite.html
- https://vega.github.io/vega-lite/docs/facet.html
- https://observablehq.com/documentation/cells/markdown
- https://htmlcolorcodes.com`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["temperature_daily.csv", {url: new URL("./files/b14b4f364b839e451743331d515692dfc66046924d40e4bff6502f032bd591975811b46cb81d1e7e540231b79a2fa0f4299b0e339e0358f08bef900595e74b15.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer("temperature_daily")).define("temperature_daily", ["__query","FileAttachment","invalidation"], _temperature_daily);
  main.variable(observer()).define(["md"], _4);
  main.variable(observer("dataset")).define("dataset", ["d3","FileAttachment"], _dataset);
  main.variable(observer("transformedData")).define("transformedData", ["dataset"], _transformedData);
  main.variable(observer("groupedData")).define("groupedData", ["transformedData"], _groupedData);
  main.variable(observer("monthNames")).define("monthNames", _monthNames);
  main.variable(observer("combinedData")).define("combinedData", ["groupedData","monthNames"], _combinedData);
  main.variable(observer()).define(["md"], _10);
  main.variable(observer()).define(["html","Inputs","vl","combinedData"], _11);
  main.variable(observer()).define(["md"], _12);
  main.variable(observer("lastYear")).define("lastYear", ["d3","dataset"], _lastYear);
  main.variable(observer("lastTenYearData")).define("lastTenYearData", ["dataset","lastYear"], _lastTenYearData);
  main.variable(observer("groupDataByMonthYear")).define("groupDataByMonthYear", ["lastTenYearData","monthNames"], _groupDataByMonthYear);
  main.variable(observer("a")).define("a", ["groupDataByMonthYear"], _a);
  main.variable(observer("tenYearData")).define("tenYearData", ["groupDataByMonthYear"], _tenYearData);
  main.variable(observer()).define(["html","Inputs","vl","tenYearData"], _18);
  main.variable(observer()).define(["md"], _19);
  return main;
}
