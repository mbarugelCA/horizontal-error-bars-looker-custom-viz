let figure = {
    "data": [
        {
          x: [.1, .3, .2, .5],
          y: ['asdsad', 'ssadasdas', 'sdsdsadas asd asd ', 'sd sad asasds'],
          error_x: {
            type: 'data',
            symmetric: false,
            array: [0.1, 0.2, 0.1, 0.1],
            arrayminus: [0.2, 0.4, 1, 0.2]
          },
          type: 'scatter',
          mode: 'markers',
          marker: {
              color: 'black'
          }
        }
    ],
    "layout": {
        xaxis: {
            tickformat: ',.1%',
            //range: [0,1]
        },
        margin: {
            l: 150,
        }
    },
    "frames": []
}

module.exports = {
    figure: figure,
}