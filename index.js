import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

let data = await d3.csv("df_arabica_clean.csv", d3.autoType); 

// function to normalize range values
function normalize(val, max, min) {
  return (val - min) / (max - min);
}

function world_map(color) {
  const map_svg = document.getElementById('map'); // Get the SVG element
   
  // Loop through the loaded data
  data.forEach(function(d,i) {
    const country = d["Country of Origin"];
    const countryPath = map_svg.querySelector(`[data-name="${country}"]`); // Find the path element with the corresponding country code
    if (countryPath) {
      countryPath.style.fill = color(country); // Update the fill color of the country
      countryPath.style.stroke = "black";
    }
  });
}

function histogram(width, height, color) {
  const margin = { top: 10, left: 70, bottom: 20, right: 20 };
  const barWidth = (height - margin.top) / Object.keys(countryCounts).length;
  const padding = 5;
  const labelSpace = 200;

  const parent = d3.select("div#hist")
  const svg = parent.append("svg")
    .attr("viewBox", [0, 0, width, height]);

  // sort countryCounts dictionary --> arrray of arrays
  const sortedCountryCounts = Object.keys(countryCounts).map(function(key) {
    return [key, countryCounts[key]];
  });
  // sort the array based on the second element
  sortedCountryCounts.sort(function(first, second) {
    return second[1] - first[1];
  });
  const countryCountsValueArray = [];
  const countryCountsKeyArray = [];
  // create an array of the country counts based on the sorted dictionary
  sortedCountryCounts.forEach(item => {
    countryCountsKeyArray.push(item[0]);
    countryCountsValueArray.push(item[1]);
  });
  // calculate scaling parameter to display the bar chart properly
  const scaling = (width - labelSpace) / Math.max.apply(null, countryCountsValueArray);  
console.log(countryCountsValueArray)
  // scale with country names
  const y = d3.scaleBand()
  .range([0, height])
  .domain(countryCountsKeyArray);

  const bars = svg.selectAll('rect')
  .data(countryCountsValueArray)
  .enter()
  .append('rect')
  .attr('x', margin.left + 5)
  .attr('y', function(d,i) {
    const country = countryCountsKeyArray[i];
    return y(country) + 3;
  })
  .attr("width", 0)
  .attr("height", barWidth - padding)
  .attr("fill", function(d,i) {
    const country = countryCountsKeyArray[i];
    return color(country);
  });
  
  
  svg.selectAll('text')
  .data(countryCountsValueArray)
  .enter()
  .append('text')
  .text('0')
  .attr('x', margin.left + 5)
  .attr('y', function(d,i) {
    return barWidth * i + margin.top + barWidth / 1.8;
  })
  .attr("font-family", "Work Sans")
  .attr("font-weight", 500)
  .style("font-size","8px")
  .attr("fill", `#ffffff`)

  svg.selectAll('rect')
  .transition()
  .duration(900)
  .attr("width", function(d) {
    return d * scaling;
  })
  .attr("height", barWidth - padding)
  .delay(function(d,i) {
    return 100*i;
  })

  svg.selectAll('text')
  .transition()
  .duration(100)
  .attr('x', function(d,i) {
    const offset = margin.left + 10 + countryCountsValueArray[i] * scaling;
    return offset;
  })
  .attr('y', function(d,i) {
    const country = countryCountsKeyArray[i];
    return y(country) + barWidth / 1.5;
  })
  .delay(function(d,i) {
    return 100*i;
  })
  .tween("text", function(d) {
    const interpolator = d3.interpolateNumber(0, d);
    return function(t) {
      d3.select(this).text(Math.round(interpolator(t))) 
    }
  })
  .duration(900);

  svg.append("g")
  .call(d3.axisLeft(y)
  .tickSizeInner(0)
  .tickSizeOuter(0))
  .attr("transform", "translate(70,0)")
  .selectAll("text")
  .style("font-size", 8)
  .style("fill", "#ffffff")
  .attr("font-family", "Work Sans")
}

function heatmap(width, height) {
  const margin = { top: 10, left: 130, bottom: 20, right: 20 };

  var svg = d3.select("#heatmap")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

  // initialize labels for the axes
  const groups = d3.map(heatmapData, function(d){return d[0];});
  const vars = Object.keys(averagedCoffeeAttributes[0]).filter(key => key !== 'Variety');

  const x = d3.scaleBand()
    .range([ 0, width ])
    .domain(vars)
    .padding(0.01);
  svg.append("g")
    .call(d3.axisBottom(x).tickSize(0))
    .selectAll("text")
    .style("font-size", 15)
    .style("fill", "#ffffff")
    .attr("font-family", "Work Sans")
  svg.select(".domain").remove()

  const y = d3.scaleBand()
    .range([ height, 0 ])
    .domain(groups)
    .padding(0.05);
  svg.append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .selectAll("text")
    .style("font-size", 10)
    .style("fill", "#ffffff")
    .attr("font-family", "Work Sans")
    .attr("transform", "translate(0,10)")
  svg.select(".domain").remove()

    const tooltip = d3.select("body")
    .append("div")
    .style("opacity", 0.3)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position", "absolute");

  // colormap
  const color = d3.scaleSequential(d3.interpolateBlues).domain([0,1])

  // add the tiles
  averagedCoffeeAttributes.forEach(row => {
    const variety = row.Variety;
    for (const key in row) {
      // exclude the "variety" key
      if (key !== 'Variety') {
        const value = row[key];
      
        svg.append('rect')
        .attr('x', x(key))
        .attr('y', y(variety) + 15)
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("width", x.bandwidth() )
        .attr("height", 0)
        .style("fill", color(value))
        .style("stroke-width", 4)
        .style("opacity", 0.7)
        .on("mouseover", function (event) {
          tooltip.transition()
            .duration(200)
            .style("opacity", 1);
          tooltip.html(`Exact value: ${parseFloat(value).toFixed(2)}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
            d3.select(this)
            .style("stroke", "black")
            .style("stroke-width", 2);
        })
        .on("mousemove", function (event) {
          tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
          // hide the tooltip on mouseout
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
            d3.select(this)
            .style("stroke", "none");
        })
        .transition() // Apply a transition for animation
        .duration(1000) // Set the animation duration in milliseconds
        .attr("height", y.bandwidth()) // Animate the width to its final value
        .style("opacity", 0.7); // Animate the opacity to make it visible
    }}
  })
}

function linechart(width, height, data, attribute) {
  const margin = { top: 10, left: 80, bottom: 20, right: 50 };

  const svg = d3.select("#linechart")
  .append("svg")
  .attr("width", width - margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(0," + margin.top + ")");

  // add x scale
  const x = d3.scaleLinear()
  .domain([d3.min(data, function(d) { return +d.Altitude; }),
           2200])
  .range([ margin.left, width]);
  svg.append("g")
  .attr("transform", "translate(0," + (height - margin.bottom) + ")")
  .call(d3.axisBottom(x))
  .selectAll("text")
  .style("font-size", 11)
  .style("fill", "#ffffff")
  .attr("font-family", "Work Sans");

  // add y scale
  const y = d3.scaleLinear()
  .domain([1,0])
  .range([ margin.top, height - margin.bottom]);
  svg.append("g")
  .attr("transform", "translate("+ margin.left +",0)")
  .call(d3.axisLeft(y).ticks(5))
  .selectAll("text")
  .style("font-size", 11)
  .style("fill", "#ffffff")
  .attr("font-family", "Work Sans");

  svg.append('path')
  .datum(data.slice(1, -3))
  .attr("class", "line")
  .attr("fill", "none")
  .style("stroke", `#045ec2`)
  .attr("stroke-opacity", 1)
  .attr("stroke-width", 3)
  .attr("d", d3.line()
    .x(function(d) { return x(d.Altitude) })
    .y(function(d) { return y(d[attribute])})
    )

  // x label
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("x", width - margin.right)
  .attr("y", height + margin.top + 8)
  .text("Altitude [m]")
  .style("font-size", 14)
  .style("fill", "#ffffff")
  .attr("font-family", "Work Sans");

  // y label:
  svg.append("text")
  .attr("text-anchor", "end")
  .attr("transform", "rotate(-90)")
  .attr("y", margin.left / 2)
  .attr("x", margin.top - 15)
  .text(attribute)
  .style("font-size", 14)
  .style("fill", "#ffffff")
  .attr("font-family", "Work Sans");
}

function radar(width, height, coffee_varieties, colors) {
  const radar_data = averagedCoffeeAttributes.filter((d) => d.Variety == coffee_varieties[0] || d.Variety == coffee_varieties[1] || d.Variety == coffee_varieties[2]);
  const coffeeFeatures = ["Aroma", "Flavor", "Aftertaste", "Acidity", "Body", "Balance"];

  const svg = d3.select("#radar")
  .append("svg")
  .attr("width", width + 10)
  .attr("height", height + 10)
  .attr("transform", "translate(30,0)");

  const radialScale = d3.scaleLinear()
    .domain([0, 1.2])
    .range([0, 180]);
  const ticks = [0.2, 0.4, 0.6, 0.8, 1];

  // function to convert angle values to xy coordinates
  function angleToCoordinate(angle, value){
    let x = Math.cos(angle) * radialScale(value);
    let y = Math.sin(angle) * radialScale(value);
    return {"x": width / 2 + x, "y": height / 2 - y};
  }

  // draw circles
  svg.selectAll("circle")
    .data(ticks)
    .join(d => d.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("r", d => radialScale(d))
    );

  // draw tick labels
  svg.selectAll(".ticklabel")
  .data(ticks)
  .join(d => d.append("text")
    .attr("class", "ticklabel")
    .attr("x", width / 2 + 5)
    .attr("y", d => height / 2 - radialScale(d) - 5)
    .text(d => d.toString())
    .style("font-size", 11)
    .style("fill", "#ffffff")
    .attr("font-family", "Work Sans")
    );
  
    const features = coffeeFeatures.map((d, i) => {
      const angle = (Math.PI / 2) + (2 * Math.PI * i / coffeeFeatures.length);
      return {"name": d,
              "angle": angle,
              "line_coord": angleToCoordinate(angle, 1),
              "label_coord": angleToCoordinate(angle, 1.2)
            };
          });
          console.log(features)

  // draw axis lines
  svg.selectAll("line")
  .data(features)
  .join(d => d.append("line")
    .attr("x1", width / 2)
    .attr("y1", height / 2)
    .attr("x2", d => d.line_coord.x)
    .attr("y2", d => d.line_coord.y)
    .attr("stroke","gray")
  );

  // draw axis label
  svg.selectAll(".axislabel")
  .data(features)
  .join(d => d.append("text")
    .attr("x", d => d.label_coord.x - 15)
    .attr("y", d => d.label_coord.y)
    .text(d => d.name)
    .style("font-size", 11)
    .style("fill", "#ffffff")
    .attr("font-family", "Work Sans")
  );

  const line = d3.line()
    .x(d => d.x)
    .y(d => d.y);

  function getPathCoordinates(data_entry){
    let coordinates = [];
    for (var i = 0; i < coffeeFeatures.length; i++){
        let ft_name = coffeeFeatures[i];
        let angle = (Math.PI / 2) + (2 * Math.PI * i / coffeeFeatures.length);
        coordinates.push(angleToCoordinate(angle, data_entry[ft_name]));
    }
    return coordinates;
  };

  // draw the path element
  svg.selectAll("path")
  .data(radar_data)
  .join(d => d.append("path")
    .datum(d => getPathCoordinates(d))
    .attr("d", line)
    .attr("stroke-width", 3)
    .attr("stroke", (_, i) => colors[i])
    .attr("fill", (_, i) => colors[i])
    .attr("stroke-opacity", 1)
    .attr("opacity", 0.3)
  );

  // legend
  const legendItemSize = 12;
  const legendSpacing = 4;
  const xOffset = width / 2;
  const yOffset = 0;

  const legend = d3.select('#legend')
    .append('svg')
    .selectAll('.legendItem')
    .attr("width", 500)
    .data(coffee_varieties);
   
  // legend items
  legend.enter()
   .append('rect')
   .attr('class', 'legendItem')
   .attr('width', legendItemSize)
   .attr('height', legendItemSize)
   .style('fill', (d,i) => colors[i])
   .attr('transform', (d, i) => {
      const x = xOffset;
      const y = yOffset + (legendItemSize + legendSpacing) * i;
      return `translate(${x}, ${y})`;
    });
  
  // legend labels
  legend
   .enter()
   .append('text')
   .attr('x', xOffset + legendItemSize + 10)
   .attr('y', (d, i) => yOffset + (legendItemSize + legendSpacing) * i + 12)
   .text(d => d)
   .style("font-size", 11)
   .style("fill", "#ffffff")
   .attr("font-family", "Work Sans")
}

function pie(width, height, data) {
  // set the radius based on dimensions
  const radius = Math.min(width, height) / 4;
  // append the svg object to the div
  const svg = d3.select("#pie")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  // set the color scale
  const color = d3.scaleOrdinal()
  .domain(Object.values(data))
  .range(d3.schemeBlues);

  // set the position of each method
  const pie = d3.pie()
  .value(function(d) {return Object.values(d)[1];})
  const pieData = pie(Object.entries(data))

  // shape helper to build arcs
  const createArc = d3.arc()
  .innerRadius(60)
  .outerRadius(radius)

  const createOuterArc = d3.arc()
  .innerRadius(radius * 0.9)
  .outerRadius(radius * 0.9)

  svg.selectAll('slices')
    .data(pieData)
    .enter()
    .append('path')
    .attr('d', createArc)
    .attr('fill', function(d,i){ return(color(d.data.value)[i]) })
    .attr("stroke", "red")
    .style("stroke-width", "2px")
    .style("opacity", 0.7)

  svg.selectAll('slices')
    .data(pieData)
    .enter()
    .append('text')
    .text(function(d){ return d.data[0] })
    .attr("transform", function(d) { 
      return "translate(" + createOuterArc.centroid(d)[0]*1.7 + createOuterArc.centroid(d)[1]*1.3 + ")"; })
    .style("text-anchor", "middle")
    .style("font-size", 17)
    .style("fill", "#ffffff")
    .attr("font-family", "Work Sans");
  
}

  /////////////////////////////////////////
 //////// DATA PROCESSING ////////////////
/////////////////////////////////////////

// find min and max of coffee flavor attributes (for normalization)
const maxAcidity = d3.max(data, function(d) { return d.Acidity; });
const minAcidity = d3.min(data, function(d) { return d.Acidity; });
const maxAftertaste = d3.max(data, function(d) { return d.Aftertaste; });
const minAftertaste = d3.min(data, function(d) { return d.Aftertaste; });
const maxAroma = d3.max(data, function(d) { return d.Aroma; });
const minAroma = d3.min(data, function(d) { return d.Aroma; });
const maxBalance = d3.max(data, function(d) { return d.Balance; });
const minBalance  = d3.min(data, function(d) { return d.Balance; });
const maxBody = d3.max(data, function(d) { return d.Body; });
const minBody  = d3.min(data, function(d) { return d.Body; });
const maxFlavor = d3.max(data, function(d) { return d.Flavor; });
const minFlavor = d3.min(data, function(d) { return d.Flavor; });
const maxOverall = d3.max(data, function(d) { return d.Overall; });
const minOverall = d3.min(data, function(d) { return d.Overall; });

// count occurrences of each country
const countryCounts = {};
   data.forEach(item => {
     const country = item["Country of Origin"];
     countryCounts[country] = (countryCounts[country] || 0) + 1;
   });

///////////// HEATMAP /////////////////

// clean the dataset and also exclude coffee blends
const excludedValues = ["unknow", "unknown", "MARSELLESA, CATUAI, CATURRA & MARSELLESA, ANACAFE 14, CATUAI", "Castillo,Caturra,Bourbon", "Caturra,Colombia,Castillo", 
"Typica Bourbon Caturra Catimor", "SL28,SL34,Ruiru11", "Bourbon, Catimor, Caturra, Typica", null, "Red Bourbon,Caturra", "Typica + SL34", "Catimor,Catuai,Caturra,Bourbon", 
"BOURBON, CATURRA Y CATIMOR", "Jember,TIM-TIM,Ateng", "Castillo and Colombia blend", "Wolishalo,Kurume,Dega", "Sl34+Gesha"];

const heatmapData = d3.group(data.filter(d => !excludedValues.includes(d.Variety)), (d) => d.Variety)
// initialize an array to store the average values
const averagedCoffeeAttributes = [];
heatmapData.forEach(function(group, variety) {
  // initialize the accumulator variables
  let sumAroma = 0; let sumFlavor = 0; let sumAftertaste = 0; let sumAcidity = 0; 
  let sumBody = 0; let sumBalance = 0; let sumOverall = 0;

  // sum up all values
  let count = 0;
  group.forEach(function(d,i) {
    sumAroma += d.Aroma; sumFlavor += d.Flavor; sumAftertaste += d.Aftertaste; sumAcidity += d.Acidity; 
    sumBody += d.Body; sumBalance += d.Balance; sumOverall += d.Overall;
    count++;
  })
  // calculate the average of each attribute
  const averageAroma = sumAroma / count; const averageFlavor = sumFlavor / count; const averageAftertaste = sumAftertaste / count; const averageAcidity = sumAcidity / count; 
  const averageBody = sumBody / count; const averageBalance = sumBalance / count; const averageOverall = sumOverall / count;

  // create an object that stores all averaged attributes, and push it into the resulting array
  const averagedAttrObj = {
    Variety: variety,
    Aroma: normalize(averageAroma, maxAroma, minAroma),
    Flavor: normalize(averageFlavor, maxFlavor, minFlavor),
    Aftertaste: normalize(averageAftertaste, maxAftertaste, minAftertaste),
    Acidity: normalize(averageAcidity, maxAcidity, minAcidity),
    Body: normalize(averageBody, maxBody, minBody),
    Balance: normalize(averageBalance, maxBalance, minBalance),
    Overall: normalize(averageOverall, maxOverall, minOverall)
  };
  averagedCoffeeAttributes.push(averagedAttrObj);
});

//////////// LINE CHART ////////////
// group data first time by altitudes to average acidity values
const groupedAltitudes = d3.group(data, (d) => d.Altitude);

// create array of objects from the map
const altitudesArray = Array.from(groupedAltitudes, 
  ([key, value]) => ({key, value}));
// exclude NaN entries
const altitudesArrayClean =  altitudesArray.filter(item => !isNaN(item.key));

// sort the array by keys in ascending order
altitudesArrayClean.sort((a, b) => a.key - b.key);

// initialize an array to store the average acidity, aroma, and flavor values
const averageAltitudeAttributes = [];

altitudesArrayClean.forEach(function(altitude) {
  let sumAltAcidity = 0;
  let sumAltAroma = 0;
  let sumAltFlavor = 0;
  let count = 0;
  // sum values for each altitude
  altitude.value.forEach(function(d,i) {
    sumAltAcidity += d.Acidity;
    sumAltAroma += d.Aroma;
    sumAltFlavor += d.Flavor;
    count++;
    })
    // calculate the average
    const averageAltAcidity = sumAltAcidity / count;
    const averageAltAroma = sumAltAroma / count;
    const averageAltFlavor = sumAltFlavor / count;
  // create an object that stores the averaged values
  const avgAttrObj = {
    Altitude: parseFloat(altitude.key),
    Acidity: averageAltAcidity,
    Aroma: averageAltAroma,
    Flavor: averageAltFlavor
  };
  averageAltitudeAttributes.push(avgAttrObj);
})

// group again by altitudes to average attributes over the same altitude value (due to parsing)
const avgAltitudeAttributes = [];
const groupedAltitudesFinal = d3.group(averageAltitudeAttributes, (d) => d.Altitude) 
// convert to array
const altitudes = Array.from(groupedAltitudesFinal, 
  ([key, value]) => ({key, value}));
// sum attributes
altitudes.forEach(function(altitude) {
  let sumAltAcidity = 0;
  let sumAltAroma = 0;
  let sumAltFlavor = 0;
  let count = 0;
  altitude.value.forEach(function(d,i) {
    sumAltAcidity += d.Acidity; 
    sumAltAroma += d.Aroma;
    sumAltFlavor += d.Flavor;
    count++;
  })
  // calculate the average
  const averageAltAcidity = sumAltAcidity / count;
  const averageAltAroma = sumAltAroma / count;
  const averageAltFlavor = sumAltFlavor / count;
// create an object that stores averaged acidity values
const avgAttrObj = {
  Altitude: altitude.key,
  Acidity: normalize(averageAltAcidity, maxAcidity, minAcidity),
  Aroma: normalize(averageAltAroma, maxAroma, minAroma),
  Flavor: normalize(averageAltFlavor, maxFlavor, minFlavor)
};
avgAltitudeAttributes.push(avgAttrObj);
});


/////////// PIE CHART //////////

const dataGroupedByProcess = d3.group(data, d => d["Processing Method"]);
let otherMethods = 0;
let allMethods = {};
dataGroupedByProcess.forEach(function(d,i) {
  // add the enties that have value length > 10, otherwise count as "Other"
  if (Object.values(d).length <= 10) {otherMethods++;} 
  else {allMethods[i] = Object.values(d).length;}
});
allMethods.Other = otherMethods;

  /////////////////////////////////////////////
 //////// END OF DATA PROCESSING /////////////
/////////////////////////////////////////////



// colormap for the world map and the bar chart
const colormap = d3.scaleOrdinal()
  .domain(data)
  .range(d3.schemeSet1);

world_map(colormap);

histogram(700, 350, colormap);

heatmap(700, 550);

// initialize the color and coffee variety arrays for the radar plots
const varieties1 = [ "Red Bourbon", "Caturra", "Gayo"];
const color1 = ["gray", "red", "blue"]; 
const varieties2 = ["Java", "Castillo Paraguaycito", "Mundo Novo"];
const color2 = ["green", "orange", "red"];

radar(400, 500, varieties1, color1);
radar(400, 500, varieties2, color2);

linechart(800, 200, avgAltitudeAttributes, "Acidity");
linechart(800, 200, avgAltitudeAttributes, "Aroma");
linechart(800, 200, avgAltitudeAttributes, "Flavor");

pie(800, 800, allMethods);