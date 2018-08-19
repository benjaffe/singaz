'use strict';

const process = require('process');
const fs = require('fs');
const path = require('path');
const getSubstituteWords = require('./src/getSubstituteWords');

(async function() {
  if (process.argv.includes('--clean')) {
    const cachePath = path.join(__dirname, 'data/cache.json');
    fs.existsSync(cachePath) && fs.unlinkSync(cachePath);
  }
  const word = process.argv[process.argv.indexOf('--word') + 1] || 'default';
  console.log('original word: ', word);
  const words = await getSubstituteWords(word);
  console.log('words:\n', words);
})();
