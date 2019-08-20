import './styles/global.css'
const processLooker = true;


let jStat = require('jstat').jStat;
let Plotly = require('plotly.js');
//let Plotly = require('plotly.js/lib/index-basic');

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

if (!processLooker) throw new Error;

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "bayesian-ab-testing-results",
  label: "Bayesian A/B Testing Results",
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

  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {
    
    // Set some global variables to help with debugging
    let theData = data
    let theQuery = queryResponse
    let theOptions = config
    let self = this
    window.theData = theData
    window.theQuery = theQuery
    window.theOptions = theOptions

    this._textElement.id = "canvas";
    this._textElement.style.height = "100%"

    // SAMPLE: add HTML to the canvas
    this._textElement.innerHTML = `
      <h1>
        Hello World!
      </h1>
    `;

    // SAMPLE: add Plotly chart to canvas, after title
    let chartElement = document.createElement('div');
    chartElement.id = 'the-plotly-chart'
    this._textElement.appendChild(chartElement);
    
    let figureSample = require('./plotly-sample/figure.js').figure;
    Plotly.plot(chartElement,  {
      data: figureSample.data,
      layout: figureSample.layout,
      frames: figureSample.frames,
      config: {
        displayModeBar: false
      }
    }).then(function() {
      console.log('Finished loading. Now resizing.');
      resizePlot();
    });

    // SAMPLE: handle auto-resizing for Plotly chart
    let resizeDebounce = null;
    function resizePlot() {
        //let bb = chartElement.getBoundingClientRect();
        let bb = document.getElementById('canvas').getBoundingClientRect();
        console.log('Resizing! Height ' + bb.height);
        Plotly.relayout(chartElement, {
            width: bb.width,
            height: bb.height - 70
        });
    }
    window.addEventListener('resize', function() {
        if (resizeDebounce) {
            window.clearTimeout(resizeDebounce);
        }
        resizeDebounce = window.setTimeout(resizePlot, 100);
    });
    
    
    

    // Check for errors
    var requirementsMet = HandleErrors(this, queryResponse, {
      min_measures: 0, 
      max_measures: 99, 
      min_pivots: 0, 
      max_pivots: 99, 
      min_dimensions:0, 
      max_dimensions: 99,
    })
    if (!requirementsMet) return


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
  var dimensions = fields.dimensions
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

