'use strict';

const fs = require('fs');
const pronouncing = require('pronouncing');
const leven = require('leven');
const syllable = require('syllable');
const {englishUsa} = require('word-list-google');

const _sameSyllableCountAs = origWord => word =>
  _getSyllableCount(origWord) === _getSyllableCount(word);
const _getSyllableCount = word =>
  pronouncing.syllableCount(pronouncing.phonesForWord(word)[0]);

function getSubstituteWords(word, opts) {
  const rhymes = pronouncing.rhymes(word).filter(_sameSyllableCountAs(word));
  return rhymes;
}

module.exports = {getSubstituteWords};
