import './styles/global.css'
import { map, reverse, max } from 'lodash-es';
let figureSample = require('./plotly-sample/figure.js').figure;

//let Plotly = require('plotly.js');
let Plotly = require('plotly.js/lib/index-basic');

var lookerVisualizationOptions = {
  color_range: {
    order: 4,
    section: "Colors",
    type: "array",
    label: "Color Range",
    display: "colors",
    display_size: "third",
  },
  /*
  top_label: {
    order: 3,
    section: "Colors",
    type: "string",
    label: "Label (for top)",
    placeholder: "My Great Chart",
    display_size: "third",
  },
  test_1: {
    order: 2,
    section: "Colors",
    type: "number",
    display: "range",
    label: "Slide!!",
    display_size: "third",
    min: 0,
    max: 10,
    step: 2,
  },
  boolean_option: {
    section: "Colors",
    type: "boolean",
    label: "Boolean option",
    order: 1
  },
  transport_mode: {
    section: "Modes",
    type: "string",
    label: "Mode of Transport",
    display: "select",
    values: [
       {"Airplane": "airplane"},
       {"Car": "car"},
       {"Unicycle": "unicycle"}
    ],
    default: "unicycle"
  }*/
}

//if (!processLooker) throw new Error;

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "horizontal-error-bars",
  label: "Horizontal Error Bars",
  options: lookerVisualizationOptions,
  // Set up the initial state of the visualization
  create: function(element, config) {
    
    // Insert a <style> tag with some styles we'll use later.
    element.innerHTML = `
      <style>
        .hello-world-vis {
          /* Vertical centering */
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }
      </style>
    `;

    // Create a container element to let us center the text.
    var container = element.appendChild(document.createElement("div"));
    container.className = "hello-world-vis";

    // Create an element to contain the text.
    this._textElement = container.appendChild(document.createElement("div"));
    
    this._textElement.id = "canvas";
    this._textElement.style.height = "100%"

    // SAMPLE: add Plotly chart to canvas, after title
    let chartElement = document.createElement('div');
    chartElement.id = 'the-plotly-chart'
    this._textElement.appendChild(chartElement);
    
    // Add an extra div in case we want to add some text after the chart
    function insertAfter(newNode, referenceNode) {
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }
    let ref =  this._textElement;
    let additionalInfoElement = document.createElement('div');
    additionalInfoElement.id = 'additional-info';
    additionalInfoElement.style.color = 'gray'
    additionalInfoElement.style.fontSize = '13px'
    insertAfter(additionalInfoElement, ref);

  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {
    console.log('updateAsync triggered')
    
    // Check for errors
    var requirementsMet = HandleErrors(this, queryResponse, {
      min_measures: 3, 
      max_measures: 4, 
      min_pivots: 0, 
      max_pivots: 0, 
      min_dimensions: 1, 
      max_dimensions: 1,
    })
    if (!requirementsMet) return

    let chartElement = document.getElementById('the-plotly-chart');

    data = reverse(data); //Reverse data for Plotly, so order of charting matches that in the data table

    // Set some global variables to help with debugging
    let theData = data
    let theQuery = queryResponse
    let theOptions = config
    let self = this
    window.theData = theData
    window.theQuery = theQuery
    window.theOptions = theOptions

    // Get measures data. The order is assumed to be as follows:
    // 1: Value at the center of the bar
    // 2: Lower bound of bar
    // 3: Upper bound of bar
    // 4 (Optional): sample size to display in labels
    let centerValue = map(theData, theQuery.fields.measure_like[0].name + '.value') 
    let lowerBoundValue = map(theData, theQuery.fields.measure_like[1].name + '.value');
    let upperBoundValue = map(theData, theQuery.fields.measure_like[2].name + '.value');
    let diffMinus = map(centerValue, (val, index) => val - lowerBoundValue[index]);
    let diffPlus = map(centerValue, (val, index) => upperBoundValue[index] - val);
    

    // Get dimension data
    let dimLabels = map(theData, (x) => x[theQuery.fields.dimension_like[0].name]['value'].toString())
    // Update labels if sample size was provided
    if (theQuery.fields.measure_like.length == 4) {
      let sampleSize = map(theData, theQuery.fields.measure_like[3].name + '.value');
      dimLabels = map(dimLabels, (val, index) => val + ' (n=' + formatNumber(sampleSize[index]) + ')')
    }
    let stringLengths = map(dimLabels, (x) => x.length)
    let maxLabelLength = max(stringLengths);
    let numberOfLabels = theData.length;
    
    // Update figure
    figureSample.data[0].x = centerValue;
    figureSample.data[0].y = dimLabels;
    figureSample.data[0].error_x.array = diffPlus;
    figureSample.data[0].error_x.arrayminus = diffMinus;
    figureSample.layout.margin.l = Math.min(maxLabelLength * 4, 300);
    console.log('Setting left margin to ' + figureSample.layout.margin.l);
    
    //Plotly.purge(chartElement);
    Plotly.react(chartElement,  {
      data: figureSample.data,
      layout: figureSample.layout,
      frames: figureSample.frames,
      config: {
        displayModeBar: false
      }
    }).then(function() {
      console.log('Finished loading. Now resizing.');
      window.previousData = theData;
      resizePlot();
    });

    // Handle auto-resizing for Plotly chart
    let resizeDebounce = null;
    function resizePlot() {
        let bb = document.getElementById('canvas').getBoundingClientRect();
        console.log('Resizing! Height of canvas: ' + bb.height);
        // Set max height based on range of Y.
        // let yRange = Math.max(...chartElement.layout.yaxis.range) - Math.min(...chartElement.layout.yaxis.range);
        //let heightOfPlot = bb.height - 70;
        let heightOfPlot = Math.min(numberOfLabels*28 + 30, 1000);
        console.log('Setting height to ' + heightOfPlot);
        Plotly.relayout(chartElement, {
            width: bb.width,
            height: heightOfPlot
            //height: bb.height
        });
    }
    window.addEventListener('resize', function() {
        if (resizeDebounce) {
            window.clearTimeout(resizeDebounce);
        }
        resizeDebounce = window.setTimeout(resizePlot, 100);
    });
    
    function formatNumber(num) {
      return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

    // EXAMPLE: Register additional options
    // newOptions = lookerVisualizationOptions
    // queryResponse.fields.dimension_like.forEach(function(field) {
    //   id = "color_" + field.name
    //   newOptions[id] =
    //     {
    //       label: field.label_short + " Color",
    //       default: "#bbaabb", // use selected palette for defaults
    //       section: "Style",
    //       type: "string",
    //       display: "color"
    //     }
    // })
    // this.trigger('registerOptions', newOptions) // register options with parent page to update visConfig
    // END Example

    // Grab the first cell of the data
    // var firstRow = data[0];
    // var firstCell = firstRow[queryResponse.fields.dimensions[0].name];
    
    // Insert the data into the page
    // this._textElement.innerHTML = LookerCharts.Utils.htmlForCell(firstCell);

    // We are done rendering! Let Looker know.
    done()
  }
});



function HandleErrors(vis, res, options) {
  var fields = res.fields
  var pivots = fields.pivots
  var dimensions = fields.dimension_like
  var measures = fields.measure_like
  
  return (checkErrors(vis, 'pivot-req', 'Pivot', pivots.length, options.min_pivots, options.max_pivots)
      && checkErrors(vis, 'dim-req', 'Dimension', dimensions.length, options.min_dimensions, options.max_dimensions)
      && checkErrors(vis, 'mes-req', 'Measure', measures.length, options.min_measures, options.max_measures))
}

function checkErrors(vis, group, noun, count, min, max) {
  if (!vis.addError || !vis.clearErrors) return false
  if (count < min) {
      vis.addError({
          title: `Not Enough ${noun}s`,
          message: `This visualization requires ${min === max ? 'exactly' : 'at least'} ${min} ${noun.toLowerCase()}${ min === 1 ? '' : 's' }.`,
          group
      })
      return false
  }
  if (count > max) {
      vis.addError({
          title: `Too Many ${noun}s`,
          message: `This visualization requires ${min === max ? 'exactly' : 'no more than'} ${max} ${noun.toLowerCase()}${ min === 1 ? '' : 's' }.`,
          group
      })
      return false
  }
  vis.clearErrors(group)
  return true
}

