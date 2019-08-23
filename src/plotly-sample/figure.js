let traceSample = {
    "mode": "markers",
    "name": "Variant A",
    "type": "bar",
    "x": [
        "60",
        "",
        "30"
    ],
    "y": [
        "Tablet",
        "Mobile",
        "Desktop"
    ],
    "text": [
        "60% &#x2b50;",
        "",
        "30%"
    ],
    "textfont": {
        "size": 20,
        "family": "Roboto"
    },
    "orientation": "h",
    "textposition": "inside"
};

let figure = {
    "data": [
        {
            "mode": "markers",
            "name": "Variant A",
            "type": "bar",
            "x": [
                "60",
                "",
                "30"
            ],
            "y": [
                "Tablet",
                "Mobile",
                "Desktop"
            ],
            "text": [
                "60% &#x2b50;",
                "",
                "30%"
            ],
            "textfont": {
                "size": 20,
                "family": "Roboto"
            },
            "orientation": "h",
            "textposition": "inside"
        },
        {
            "name": "Variant B",
            "type": "bar",
            "x": [
                "30",
                "95",
                "5"
            ],
            "y": [
                "Tablet",
                "Mobile",
                "Desktop"
            ],
            "text": [
                "30%",
                "95% &#x2b50;",
                "5%"
            ],
            "textfont": {
                "size": 20,
                "family": "Roboto"
            },
            "orientation": "h",
            "textposition": "inside"
        },
        {
            "name": "Variant C",
            "type": "bar",
            "x": [
                "10",
                "5",
                "65"
            ],
            "y": [
                "Tablet",
                "Mobile",
                "Desktop"
            ],
            "opacity": 1,
            "text": [
                "10%",
                "5%",
                "65% &#x2b50;"
            ],
            "textfont": {
                "size": 20,
                "family": "Roboto"
            },
            "orientation": "h",
            "textposition": "inside"
        }
    ],
    "layout": {
        "xaxis": {
            "type": "linear",
            "range": [
                0,
                105.26315789473685
            ],
            "ticksuffix": '%',
            "title": {
                "text": "Probability that variant beats others"
            },
            "autorange": true
        },
        "yaxis": {
            "type": "category",
            "autorange": true
        },
        "barmode": "stack",
        "autosize": true,
        //"dragmode": "zoom",
        "dragmode": false,
        "hovermode": false,
        "margin": {
            "t": 10,
            "b": 50,
            "l": 80,
            "r": 80,
            "pad": 5,
            "autoexpand": true
        }
    },
    "frames": []
}

module.exports = {
    figure: figure,
    traceSample: traceSample
}