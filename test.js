'use strict';

const {getSubstituteWords} = require('./src/getSubstituteWords');

(async function() {
  const words = await getSubstituteWords(`hello`);
  console.log('words:\n', words.slice(0, 10));
})();
