const jStat = require('jStat').jStat;
const math = require('mathjs')
window.jStat = jStat
window.math = math


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