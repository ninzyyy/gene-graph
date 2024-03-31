import Sigma from "sigma";
import Papa from "papaparse";
import Graph from "graphology";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { cropToLargestConnectedComponent } from "graphology-components";
import { refreshGraphStyles } from './visuals.js';
import { stringToColor } from './utils.js';
import { createLegend } from './visuals.js';
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

  results.data.forEach(function(line) {
      const sourceNode = line['Official Symbol Interactor A'];
      const targetNode = line['Official Symbol Interactor B'];
      const category = line['Ontology Term Names'];
      console.log(`Processing: ${sourceNode}, ${targetNode}, Category: ${category}`);


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

  // Call createLegend to populate the legend initially
  createLegend(categoryToColor); // Assuming categoryToColor is defined

  // Additional interactive features integration starts here

  function updateHoverState(nodeId) {
    if (nodeId) {
      currentState.hoveredNode = nodeId;
      currentState.hoveredNeighbors = new Set(graph.neighbors(nodeId));
    } else {
      currentState.hoveredNode = null;
      currentState.hoveredNeighbors.clear();
    }
  }

  sigmaInstance.on('clickNode', (event) => {
    const nodeId = event.node;
    updateHoverState(nodeId);

    // Collect categories of clicked node and its neighbors
    const relevantCategories = new Set();
    relevantCategories.add(graph.getNodeAttribute(nodeId, 'category'));
    graph.neighbors(nodeId).forEach(neighborId => {
      relevantCategories.add(graph.getNodeAttribute(neighborId, 'category'));
    });

    // Filter categoryToColor for relevant categories and create the legend
    const filteredCategoryToColor = Object.keys(categoryToColor)
      .filter(category => relevantCategories.has(category))
      .reduce((obj, key) => {
        obj[key] = categoryToColor[key];
        return obj;
      }, {});

    createLegend(filteredCategoryToColor);
    refreshGraphStyles(sigmaInstance, currentState, categoryToColor);

  });

  sigmaInstance.on('clickStage', () => {
    updateHoverState(null); // Reset the hover state when the background is clicked
    createLegend(categoryToColor); // Reset the legend to its full state
    refreshGraphStyles(sigmaInstance, currentState, categoryToColor);

  });

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
