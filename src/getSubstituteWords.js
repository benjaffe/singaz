'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const pronouncing = require('pronouncing');
const leven = require('leven');
const {englishUsa} = require('word-list-google');

const {dedupe, sameSyllableCountAs} = require('./utils');
const {wordList, getWord, getPos, getWordObj} = require('./wordList');

const _toLowerCase = str => str.toLowerCase();
const mostCommonWords = englishUsa.map(_toLowerCase);

/**
 * @return  function which returns true if the word passed into it is the same
 * part of speech as the original word.
 */

const _isSamePartOfSpeechAs = origWord => word => {
  const origWordPos = getPos(origWord);
  const wordPos = getPos(word);
  return (
    (origWordPos && origWordPos.length === 0) ||
    _.intersection(origWordPos, wordPos).length > 0
  );
};

/**
 * Roughly sorts by word frequency
 */
const _sortByFrequency = (a, b) =>
  _isCommon(a) ? mostCommonWords.indexOf(a) - mostCommonWords.indexOf(b) : 1;

/**
 * returns true if the word is in the mostCommonWords
 */
const _isCommon = w => mostCommonWords.includes(w);

const cachePath = path.join(__dirname, '../data/cache.json');
let cache;
try {
  cache = fs.existsSync(cachePath)
    ? JSON.parse(fs.readFileSync(cachePath))
    : {};
} catch (e) {
  console.log(e);
  cache = {};
}

const biblicalWordMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/biblicalWordMap.json')),
);

function getSubstituteWords(_word, opts) {
  const word = _word.toLowerCase();
  const frequencies = biblicalWordMap[word];
  const biblical =
    frequencies == null
      ? []
      : Object.keys(frequencies)
          .sort((a, b) => frequencies[b] - frequencies[a])
          .map(_toLowerCase)
          .filter(sameSyllableCountAs(word));

  if (cache[word] != null) {
    return {biblical, ...cache[word]};
  }

  const rhymes = pronouncing
    .rhymes(word)
    .map(_toLowerCase)
    .filter(dedupe)
    .filter(sameSyllableCountAs(word))
    .filter(_isCommon)
    .filter(_isSamePartOfSpeechAs(word))
    .sort(_sortByFrequency);

  const newWord = {rhymes, biblical, pos: getPos(word)};
  cache[word] = newWord;
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error(e);
    console.log('swallow the error and carrying on...');
  }
  return newWord;
}

module.exports = getSubstituteWords;
