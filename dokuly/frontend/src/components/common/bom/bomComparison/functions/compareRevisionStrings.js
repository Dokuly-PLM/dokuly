export function compareRevisionStrings(a, b) {
  let i = 0;
  while (i < a.length && i < b.length) {
    const charA = a.charCodeAt(i);
    const charB = b.charCodeAt(i);
    if (charA !== charB) {
      return charA - charB;
    }
    i++;
  }
  return a.length - b.length;
}
