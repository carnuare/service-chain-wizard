// Import the required modules
const fs = require('fs');
const yaml = require('js-yaml');

// Get the file name from the command line arguments
const fileName = process.argv[2];

// Read the file contents
const fileContents = fs.readFileSync(fileName, 'utf8');

// Parse the YAML file
const data = yaml.load(fileContents);

// Log the contents of the YAML file to the console
console.log(data);