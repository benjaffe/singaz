'use strict';

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

module.exports = {
  throttle,
  isArrayWithLength,
  dedupe,
};
