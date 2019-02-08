// BEGIN Calculations specific to the A/B Testing Visualization
const jStat = require('jStat').jStat;
window.jStat = jStat

const pdfOfAandB = function(x1, x2, S1, F1, S2, F2) {
  return jStat.beta.pdf(x1, S1, F1) * jStat.beta.pdf(x2, S2, F2)
}
function integrate (f, start, end, step) {
  let total = 0
  step = step || 0.01
  // Integrate over X2 > X1
  for (let x1 = start; x1 < end; x1 += step) {
    for (let x2 = x1; x2 < end; x2 += step) {
      //total += f(x + step / 2) * step
      total += f(x1 + step/2, x2 + step/2, S1, F1, S2, F2) * step * step
    }
  }
  return total
}

const S1 = 50000;
const F1 = 50000;
const S2 = 51000;
const F2 = 49000;

let startTime = new Date(); 
console.log(integrate(pdfOfAandB, 0, 1, 0.001))
let timeDiff = new Date() - startTime;
console.log(timeDiff)
// END Calculations specific to the A/B Testing Visualization

var lookerVisualizationOptions = {
  skip_intermediate_nulls: {
    section: "Main",
    type: "boolean",
    label: "Skip intermediate nulls",
    order: 1,
    default: false,
  },
  /*color_range: {
    order: 4,
    section: "Colors",
    type: "array",
    label: "Color Range",
    display: "colors",
    display_size: "third",
  },
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

looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "bayesian-ab-testing-results",
  label: "Bayesian A/B Testing Results",
  options: lookerVisualizationOptions,
  // Set up the initial state of the visualization
  create: function(element, config) {
    
    $('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', 'https://localhost:4443/dependencies/global.css') );

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
    theData = data
    theQuery = queryResponse
    theOptions = config
    self = this
    this._textElement.id = "canvas";
    
    // Check for errors
    var requirementsMet = HandleErrors(this, queryResponse, {
      min_measures: 1, 
      max_measures: 1, 
      min_pivots: 0, 
      max_pivots: 0, 
      min_dimensions:1, 
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

    // Set the size to the user-selected size
    /*
    if (config.font_size == "small") {
      this._textElement.className = "hello-world-text-small";
    } else {
      this._textElement.className = "hello-world-text-large";
    }
    */

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

