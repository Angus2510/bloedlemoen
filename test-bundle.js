// Test bundle detection patterns
const testText = "Bloedlemoen 750ml + FREE Fever Tree Tonic Water (Pack of 4)";
const cleanLine = testText.trim().toLowerCase();

console.log("Testing text:", testText);
console.log("Clean line:", cleanLine);

// Test individual components
const hasBloedlemoen = /bloedlemoen/i.test(cleanLine);
const hasFree = /free/i.test(cleanLine);
const hasFeverTree = /fever.*tree|tonic.*water/i.test(cleanLine);

console.log("Has Bloedlemoen:", hasBloedlemoen);
console.log("Has FREE:", hasFree);
console.log("Has Fever Tree/Tonic:", hasFeverTree);

// Test bundle patterns
const pattern1 = /bloedlemoen.*\+.*free.*fever.*tree/i.test(cleanLine);
const pattern2 = /bloedlemoen.*\+.*free.*tonic.*water/i.test(cleanLine);
const pattern3 = /bloedlemoen.*free.*fever.*tree/i.test(cleanLine);
const pattern4 = /bloedlemoen.*free.*tonic.*water/i.test(cleanLine);
const pattern5 = hasBloedlemoen && hasFree && hasFeverTree;

console.log("Pattern 1 (bloedlemoen.*\\+.*free.*fever.*tree):", pattern1);
console.log("Pattern 2 (bloedlemoen.*\\+.*free.*tonic.*water):", pattern2);
console.log("Pattern 3 (bloedlemoen.*free.*fever.*tree):", pattern3);
console.log("Pattern 4 (bloedlemoen.*free.*tonic.*water):", pattern4);
console.log("Pattern 5 (all three components):", pattern5);

const isBundlePattern =
  pattern1 || pattern2 || pattern3 || pattern4 || pattern5;
console.log("Is Bundle Pattern:", isBundlePattern);
