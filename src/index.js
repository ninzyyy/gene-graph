import Sigma from "sigma";
import Papa from "papaparse";
import Graph from "graphology";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { cropToLargestConnectedComponent } from "graphology-components";
import './styles.css';

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');

    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                delimiter: ",",
                skipEmptyLines: true,
                complete: function(results) {
                    processCSV(results);
                }
            });
        }
    });
});

function processCSV(results) {

  const graph = new Graph();
  const categoryToColor = {}; // Object to map categories to colors

  // Color hashing function: converts a string to a color code
  function stringToColor(str) {
    // Ensure str is a string to prevent errors
    if (typeof str !== 'string' || str === undefined || str === null) {
      str = 'default'; // Fallback string in case of undefined or non-string input
    }

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    console.log(`Category: ${str}, Color: ${color}`); // Logging for debugging
    return color;
  }

  results.data.forEach(function(line) {
      const sourceNode = line['Official Symbol Interactor A'];
      const targetNode = line['Official Symbol Interactor B'];
      const category = line['Ontology Term Names'];
      console.log(`Processing: ${sourceNode}, ${targetNode}, Category: ${category}`); // Debug log


      if (!categoryToColor[category]) {
        // Use the stringToColor function to convert category to a unique color
        categoryToColor[category] = stringToColor(category);
      }

      if (!graph.hasNode(sourceNode)) {
        graph.addNode(sourceNode, {category: category, color: categoryToColor[category]});
      }

      if (!graph.hasNode(targetNode)) {
        graph.addNode(targetNode, {category: category, color: categoryToColor[category]});
      }

      if (!graph.hasEdge(sourceNode, targetNode)) {
        graph.addEdge(sourceNode, targetNode, {weight: 0.2});
      }
  });

  cropToLargestConnectedComponent(graph);
  circular.assign(graph);
  const inferredSettings = forceAtlas2.inferSettings(graph);
  const forceSettings = {
    ...inferredSettings,
  };

  forceAtlas2.assign(graph, {
    settings: forceSettings,
    iterations: 1
  });

  const container = document.getElementById('sigma-container');
  const sigmaInstance = new Sigma(graph, container, {
    nodeReducer: (node, data) => ({
      ...data,
      label: node, // Showing node as label
      color: data.color // Color based on category
    })
  });

  let currentState = {
    hoveredNode: null,
    hoveredNeighbors: new Set(),
  };

  function updateHoverState(nodeId) {
    if (nodeId) {
      currentState.hoveredNode = nodeId;
      currentState.hoveredNeighbors = new Set(graph.neighbors(nodeId));
    } else {
      currentState.hoveredNode = null;
      currentState.hoveredNeighbors.clear();
    }
  }

  // Additional interactive features integration starts here

  // Add clickNode listener for clicking on a node
  sigmaInstance.on('clickNode', (event) => {
    const nodeId = event.node;
    updateHoverState(nodeId);
    refreshGraphStyles();
  });

  // Add clickStage listener for clicking on the background
  sigmaInstance.on('clickStage', () => {
    updateHoverState(null); // Reset the hover state when the background is clicked
    refreshGraphStyles();
  });

  function updateHoverState(nodeId) {
    if (nodeId) {
      currentState.hoveredNode = nodeId;
      currentState.hoveredNeighbors = new Set(graph.neighbors(nodeId));
    } else {
      currentState.hoveredNode = null;
      currentState.hoveredNeighbors.clear();
    }
  }

  function refreshGraphStyles() {
    sigmaInstance.setSetting('nodeReducer', (node, data) => {
      // Adjusted logic based on click events instead of hover
      if (currentState.hoveredNode && (node === currentState.hoveredNode || currentState.hoveredNeighbors.has(node))) {
        return { ...data, color: data.color, size: data.size * 4, label: node };
      } else if (!currentState.hoveredNode) {
        const originalColor = categoryToColor[data.category] || '#CCCCCC';
        return { ...data, color: originalColor, size: data.size, label: node };
      } else {
        return { ...data, color: '#CCCCCC', label: node };
      }
    });
    sigmaInstance.refresh();
  }

  createLegend(categoryToColor);

  // Call createLegend to populate the legend initially
  createLegend(categoryToColor); // Assuming categoryToColor is defined

  document.getElementById('legend-search').addEventListener('input', function() {
    const searchValue = this.value.toLowerCase();
    const items = document.querySelectorAll('#legend-container .legend-item');

    items.forEach(item => {
      const category = item.querySelector('span').textContent.toLowerCase();
      if (category.includes(searchValue)) {
        item.style.display = ''; // Show the item if it matches
      } else {
        item.style.display = 'none'; // Hide the item if it doesn't match
      }
    });
  });
}

function createLegend(categoryToColor) {
  const legendContainer = document.getElementById('legend-container');
  // Clear existing legend items first, to prevent duplicates if function is called multiple times
  legendContainer.innerHTML = '';

  // Object.keys() to get categories, then sort them alphabetically
  Object.keys(categoryToColor).sort().forEach(category => {
    const item = document.createElement('div');
    item.classList.add('legend-item');

    const colorBox = document.createElement('div');
    colorBox.classList.add('color-box');
    colorBox.style.backgroundColor = categoryToColor[category];

    const categoryText = document.createElement('span');
    categoryText.textContent = category;

    item.appendChild(colorBox);
    item.appendChild(categoryText);

    legendContainer.appendChild(item);
  });
}
