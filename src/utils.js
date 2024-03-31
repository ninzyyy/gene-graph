
export function stringToColor(str) {
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
