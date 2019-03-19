const myChart = Sunburst()
var actual_JSON;

var selected_descriptors = [];

function getNodeTopCategory(node) {
    if (node.__dataNode.depth == 0) {
        return 'N/A';
    }
    else {
        let pn = node.__dataNode;
        while (pn.depth > 1) {
            pn = pn.parent;
        }
        return pn.data.name;
    }
}

function clearDescription() {
    selected_descriptors = [];
    var description_div = document.getElementById("textbox");
    description_div.innerHTML = createDescriptionHTML(selected_descriptors);
}

function copyDescriptionToClipboard() {
    let s = createDescriptionText(selected_descriptors);
    copyStringWithNewLineToClipBoard(s);
}

function createDescriptionHTML(descriptors) {
    s = "";
    for (var key in descriptors) {
        s += '<h3>' + key + '</h3>'
        values = descriptors[key];
        for (var index in values) {
            s += '<li>' + values[index] + '</li>'
        }
    }
    return s;
}

function createDescriptionText(descriptors) {
    s = document.getElementById("wine-name").value + ", "
        + document.getElementById("wine-vintage").value + '\n\n';

    for (var key in descriptors) {
        s += key + ': '
        values = descriptors[key];
        for (var index in values) {
            s += values[index] + ', '
        }
        s = s.slice(0, -2);
        s += '\n'
    }

    return s;
}

// Modified from https://stackoverflow.com/questions/46041831/copy-to-clipboard-with-break-line
function copyStringWithNewLineToClipBoard(input_string) {
    const dummy = document.createElement('textarea');
    dummy.innerHTML = input_string;
    const parentElement = document.getElementById('textbox');
    parentElement.appendChild(dummy);
    dummy.select();
    document.execCommand('copy');
    parentElement.removeChild(dummy);
}

function loadJSON(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', './data/wwheel_fin.json', true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}

function init() {
    loadJSON(function (response) {
        // Parse JSON string into object
        actual_JSON = JSON.parse(response);
        colorize(actual_JSON);
        myChart.data(actual_JSON)
            .size('size')
            .color('color')
            .onNodeClick(function (data_node) {
                if (data_node.children) {
                    myChart.focusOnNode(data_node);
                }
                else {
                    let node_top_category = getNodeTopCategory(data_node);
                    if (!selected_descriptors[node_top_category]) {
                        selected_descriptors[node_top_category] = [];
                    }

                    if (!selected_descriptors[node_top_category].find(
                        function (element) { return element === data_node.name; })) {
                        selected_descriptors[node_top_category].push(data_node.name);
                    }
                    description_div = document.getElementById("textbox")
                    description_div.innerHTML = createDescriptionHTML(selected_descriptors);
                }
            })
            (document.getElementById('chart'));

    });
}

// Colorizes child nodes based on root node properties.
function colorize(node) {
    if (!node.color) {
        node.color = "#aaaaaa";
    }
    // If node has a field child-gradient-end, colorize childs with a color
    // gradient based on root color and the child-gradient-end
    let element = node;
    if (element['child-gradient-end']) {
        var n_childs = element.children.length;
        var root_color = hexToRgb(element.color);
        var child_gradient_end = hexToRgb(element['child-gradient-end'])
        for (let i = 0; i < n_childs; i++) {
            let child_color = interpolateColor((i + 1) / n_childs, root_color, child_gradient_end);
            element.children[i].color = rgbToHex(child_color.r,
                child_color.g, child_color.b);
        }
    }
    else if (element.children) {
        element.children.forEach(e => {
            if (e.children) {
                colorize(e);
            }
        });
    }
}

function interpolateColor(interp_amount, rbg_start, rgb_end) {
    var diff_r = rgb_end.r - rbg_start.r;
    var diff_g = rgb_end.g - rbg_start.g;
    var diff_b = rgb_end.b - rbg_start.b;

    return {
        r: parseInt(Math.floor(rbg_start.r + (diff_r * interp_amount)), 10),
        g: parseInt(Math.floor(rbg_start.g + (diff_g * interp_amount)), 10),
        b: parseInt(Math.floor(rbg_start.b + (diff_b * interp_amount)), 10),
    };
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
init();
