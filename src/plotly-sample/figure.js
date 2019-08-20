let figure = {
    "data": [
        {
            "meta": {
                "columnNames": {
                    "x": "A",
                    "y": "D",
                    "text": "E"
                }
            },
            "mode": "markers",
            "name": "Variant A",
            "type": "bar",
            "xsrc": "mbarugel:6:d90a37",
            "x": [
                "60",
                "",
                "30"
            ],
            "ysrc": "mbarugel:6:52ba71",
            "y": [
                "Tablet",
                "Mobile",
                "Desktop"
            ],
            "textsrc": "mbarugel:6:a9071a",
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
            "meta": {
                "columnNames": {
                    "x": "B",
                    "y": "D",
                    "text": "F"
                }
            },
            "name": "Variant B",
            "type": "bar",
            "xsrc": "mbarugel:6:42e199",
            "x": [
                "30",
                "95",
                "5"
            ],
            "ysrc": "mbarugel:6:52ba71",
            "y": [
                "Tablet",
                "Mobile",
                "Desktop"
            ],
            "textsrc": "mbarugel:6:2ee100",
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
            "meta": {
                "columnNames": {
                    "x": "C",
                    "y": "D",
                    "text": "G"
                }
            },
            "name": "Variant C",
            "type": "bar",
            "xsrc": "mbarugel:6:fb89f2",
            "x": [
                "10",
                "5",
                "65"
            ],
            "ysrc": "mbarugel:6:52ba71",
            "y": [
                "Tablet",
                "Mobile",
                "Desktop"
            ],
            "opacity": 1,
            "textsrc": "mbarugel:6:8b3da9",
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
            "title": {
                "text": "Probability that variant beats others"
            },
            "autorange": true
        },
        "yaxis": {
            "type": "category",
            "range": [
                -0.5,
                2.5
            ],
            "autorange": true
        },
        "barmode": "stack",
        "autosize": true,
        //"dragmode": "zoom",
        "dragmode": false,
        "hovermode": false,
        "margin": {
            "t": 10,
            "b": 30,
            "l": 80,
            "r": 80,
            "pad": 0,
            "autoexpand": true
        }
    },
    "frames": []
}

module.exports = {
    figure: figure
}