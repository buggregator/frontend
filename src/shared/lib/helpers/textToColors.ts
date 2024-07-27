export const textToColors = (input: string): string[] => {
  // Utility function to convert a character to a base hue value
  const charToHue = (char: string): number => {
    const code = char.toLowerCase().charCodeAt(0);
    return (code - 97) * 20 % 360; // Map 'a' to 'z' to a hue value between 0 and 360
  };

  // Function to generate an HSL color based on a base hue
  const getHslColor = (hue: number) => `hsl(${hue}, 70%, 50%)`;

  // Extract up to three characters from the input string
  const chars = input.length >= 3 ? input.slice(0, 3).split('') : input.padEnd(3, input[0]).slice(0, 3).split('');

  // Calculate the hue for each character
  // Generate the HSL colors list
  return chars.map(charToHue).map(getHslColor);
}
