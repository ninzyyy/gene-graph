
export function createLegend(categoryToColor) {
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

export function refreshGraphStyles(sigmaInstance, currentState, categoryToColor) {
  sigmaInstance.setSetting('nodeReducer', (node, data) => {
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
