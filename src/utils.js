'use strict';

const pronouncing = require('pronouncing');

const throttle = (callback, wait, context = this) => {
  let timeout = null;
  let callbackArgs = null;

  const later = () => {
    callback.apply(context, callbackArgs);
    timeout = null;
  };

  return function() {
    if (!timeout) {
      callbackArgs = arguments;
      timeout = setTimeout(later, wait);
    }
  };
};

const isArrayWithLength = arr => Array.isArray(arr) && arr.length > 0;

/**
 * dedupes values from an array when used with .filter
 */
const dedupe = (val, i, arr) => arr.indexOf(val) === i;

const sameSyllableCountAs = origWord => word =>
  getSyllableCount(origWord) === getSyllableCount(word);
const getSyllableCount = word =>
  pronouncing.syllableCount(pronouncing.phonesForWord(word)[0]);

module.exports = {
  throttle,
  isArrayWithLength,
  dedupe,
  sameSyllableCountAs,
  getSyllableCount,
};
