import './styles/global.css'
import { countBy, mapValues, cloneDeep, uniq, map, sumBy, reduce, isEqual } from 'lodash-es';
let figureSample = require('./plotly-sample/figure.js').figure;

// Simulation parameters
const Nsims = 10000;
const priorAlpha = 1;
const priorBeta = 10;

const processLooker = true;


let jStat = require('jstat').jStat;
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
    
    this._textElement.id = "canvas";
    this._textElement.style.height = "100%"

    // SAMPLE: add Plotly chart to canvas, after title
    let chartElement = document.createElement('div');
    chartElement.id = 'the-plotly-chart'
    this._textElement.appendChild(chartElement);

  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {
    console.log('updateAsync triggered')
    
    // Check for errors
    var requirementsMet = HandleErrors(this, queryResponse, {
      min_measures: 2, 
      max_measures: 2, 
      min_pivots: 0, 
      max_pivots: 0, 
      min_dimensions: 1, 
      max_dimensions: 2,
    })
    if (!requirementsMet) return

    let chartElement = document.getElementById('the-plotly-chart');

    // Set some global variables to help with debugging
    let theData = data
    let theQuery = queryResponse
    let theOptions = config
    let self = this
    window.theData = theData
    window.theQuery = theQuery
    window.theOptions = theOptions

    window.jStat = jStat;

    // Get measure names. The first one is assumed to be the number of trials; the second one is the number of successes.
    let nTrialFieldName = theQuery.fields.measure_like[0].name;
    let nSuccessFieldName = theQuery.fields.measure_like[1].name;

    let nSegments;

    if (theQuery.fields.dimension_like.length == 1) {
      // If there's 1 dimension, each row represents a variant. There's a single segment.
      let variantNameFieldName = theQuery.fields.dimension_like[0].name;
      let nVariants = theData.length;
      nSegments = 1;

      let paramObject = {};
      let sampleSize = 0
      for (let variant = 0; variant < nVariants; variant++) {
        let variantName = theData[variant][variantNameFieldName].value;
        let successes = theData[variant][nSuccessFieldName].value ;
        let trials = theData[variant][nTrialFieldName].value;
        paramObject[variantName] = [successes, trials];
        sampleSize = sampleSize + trials;
      }

      // Generate sim results
      let simResults = simulateProbVariantIsBest(paramObject);
      // Add sample size of segment to results
      simResults['_sampleSize'] = sampleSize;
      let simObject = {'Overall': simResults};

      // Generate Traces
      figureSample.data = generatePlotlyTraceArray(simObject);

    } else if (theQuery.fields.dimension_like.length == 2) {
      // If there's 2 dimensions, each row represents a segment-variant combination.
      // We assume that the first dimension represents a segment, and the second one is a variant.
      let segmentNameFieldName = theQuery.fields.dimension_like[0].name;
      let variantNameFieldName = theQuery.fields.dimension_like[1].name;

      let variantNames = uniq(map(theData, (x) => String(x[variantNameFieldName].value)));
      let nVariants = variantNames.length;

      let segmentNames = uniq(map(theData, (x) => x[segmentNameFieldName].value))
      nSegments = segmentNames.length;

      // Initialize objects for simulation
      // simObject and paramObject will have one entry per segment
      let paramObject = {};
      for (let segmentName of segmentNames) {
        paramObject[segmentName] = {}
      }
      let simObject = cloneDeep(paramObject);

      for (let thisData of theData) {
        let segmentName = thisData[segmentNameFieldName].value;
        let variantName = thisData[variantNameFieldName].value;
        let successes = thisData[nSuccessFieldName].value ;
        let trials = thisData[nTrialFieldName].value;
        paramObject[segmentName][variantName] = [successes, trials]
      }
      
      // Generate sims and store results
      for (let [segment, val] of Object.entries(simObject)) {
        simObject[segment] = simulateProbVariantIsBest(paramObject[segment]);
        simObject[segment]['_sampleSize'] = reduce(paramObject[segment], (sum,val) => sum+val[1], 0); //add sample size (number of trials) across all variants for this segment
      }
      
      // Generate traces
      figureSample.data = generatePlotlyTraceArray(simObject);
    }

    /** @description Computes the probability that each variant beats all others.  
     * @param {Object} paramArray An object with one key for each variant. The value for each key should be the number of successes and
     * number of trials for the variant. Example: {"c": [2, 100], "v1": [6, 102]} 
     * @return {Object} An object with one key for each variant, showing the probability that it is the best.
     */  
    function simulateProbVariantIsBest(paramArray) {
      // Generate array of arrays of random beta values.
      // Each "row" is a simulation instance and each "column" represents a variant
      let samplesArray = Array();
      let variantNamesArray = Array();
      for (let [variantName, variantData] of Object.entries(paramArray)) {
        variantNamesArray.push(variantName);

        let sample = Array();
        let alpha = priorAlpha + variantData[0];
        let beta = priorBeta + Math.max(0, variantData[1] - variantData[0]);
        console.log('Simulating variant ' + variantName + ' with alpha=' + alpha + ' and beta=' + beta);
        for (let i = 0; i < Nsims; i++) {
          sample.push(jStat.beta.sample(alpha, beta))
        }
        samplesArray.push(sample);
      }
      samplesArray = jStat.transpose(samplesArray);
      
      // Find the top variant for each simulation, and tabulate the results
      let topVariantArray = Array()
      for (let sim = 0; sim < samplesArray.length; sim++) {
        let indexOfMax = samplesArray[sim].indexOf(Math.max(...samplesArray[sim]));
        topVariantArray.push(variantNamesArray[indexOfMax])
      }
      // To prevent cases in which a variant has no elements in which it's top, add a fake 'success' for each variant.
      // With a large enough N, this addition is irrelevant (with N = 10,000, this adds a 0.01% prob of being top)
      topVariantArray = topVariantArray.concat(variantNamesArray);

      let topVariantFreqTable = mapValues(countBy(topVariantArray), (x) => 100*x/Nsims);


      return topVariantFreqTable;
    }

    // TODO: Write doc for this function
    // Input variable must be an object. 
    // Each key in this object is the segment of the experiment.
    // Each value is an object in which each key is a variant and each value is the probability that that variant is the best.
    // There's an optional additional key called '_sampleSize', which shows the total sample size across all variants, for display purposes.
    // Example: {'Desktop': {'c': 90, 'v1': 10, '_sampleSize': 1392}, 'Mobile': {'c': 100, '_sampleSize': 248}}
    function generatePlotlyTraceArray(topVariantFreqTableBySegment) {

      let traceSample = require('./plotly-sample/figure.js').traceSample;
      let traceArray = [];

      // Get sample size by segment, and remove the _sampleSize key
      let sampleSizeBySegment = mapValues(topVariantFreqTableBySegment, (x) => x['_sampleSize']);
      Object.keys(topVariantFreqTableBySegment).forEach( (key) => delete topVariantFreqTableBySegment[key]['_sampleSize'])
      /*for (key in Object.keys(topVariantFreqTableBySegment))
        delete topVariantFreqTableBySegment[key]['_sampleSize'];
*/
      // Restructure object so that each key is a variant, and each value has the values for that variant by segment
      // Example: {'c': {'Mobile': 100, 'Desktop': 90}, 'v1': {'Desktop': 10}}
      let segmentNames = Object.keys(topVariantFreqTableBySegment).sort();
      let variantNames = []
      for (let segment of segmentNames) {
        variantNames = variantNames.concat(Object.keys(topVariantFreqTableBySegment[segment]));
      }
      variantNames = uniq(variantNames).sort();

      let experimentDataRestructured = {}
      for (let variant of variantNames) {
        experimentDataRestructured[variant] = {}
        for (let segment of segmentNames) {
          experimentDataRestructured[variant][segment] = topVariantFreqTableBySegment[segment][variant]
        }
      }
      
      // Generate traces
      for (let [variantName, topVariantFreqTableBySegment] of Object.entries(experimentDataRestructured)) {
        let thisTrace = cloneDeep(traceSample);
        thisTrace["name"] = variantName;
        thisTrace["x"] = [];
        thisTrace["y"] = [];
        thisTrace["text"] = [];
        for (let [segmentName, variantProb] of Object.entries(topVariantFreqTableBySegment)) {
          thisTrace["x"].push(variantProb);
          thisTrace["y"].push(segmentName + '<br>n=' + formatNumber(sampleSizeBySegment[segmentName]));
          let thisText = Math.round(variantProb) + '%';
          if (variantProb > 75) {
            thisText = thisText + ' &#x2b50;'
          }
          thisTrace["text"].push(thisText);
        }
        traceArray.push(thisTrace)
      }
      return traceArray;
    }

    function formatNumber(num) {
      return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

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

    // SAMPLE: handle auto-resizing for Plotly chart
    let resizeDebounce = null;
    function resizePlot() {
        let bb = document.getElementById('canvas').getBoundingClientRect();
        console.log('Resizing! Height of canvas: ' + bb.height);
        // Set max height based on range of Y.
        // let yRange = Math.max(...chartElement.layout.yaxis.range) - Math.min(...chartElement.layout.yaxis.range);
        //let heightOfPlot = bb.height - 70;
        let heightOfPlot = Math.max(Math.min(bb.height, nSegments*100 + 70), 0);
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

