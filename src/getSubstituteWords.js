'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const pronouncing = require('pronouncing');
const leven = require('leven');
const {englishUsa} = require('word-list-google');

const {dedupe} = require('./utils');
const {wordList, getWord, getPos, getWordObj} = require('./wordList');

const _toLowerCase = str => str.toLowerCase();
const mostCommonWords = englishUsa.map(_toLowerCase);

const _sameSyllableCountAs = origWord => word =>
  _getSyllableCount(origWord) === _getSyllableCount(word);
const _getSyllableCount = word =>
  pronouncing.syllableCount(pronouncing.phonesForWord(word)[0]);

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
const cache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath))
  : {};

function getSubstituteWords(_word, opts) {
  const word = _word.toLowerCase();
  if (cache[word] != null) {
    return cache[word];
  }

  const rhymes = pronouncing
    .rhymes(word)
    .map(_toLowerCase)
    .filter(dedupe)
    .filter(_sameSyllableCountAs(word))
    .filter(_isCommon)
    .filter(_isSamePartOfSpeechAs(word))
    .sort(_sortByFrequency);

  const newWord = {rhymes, pos: getPos(word)};
  cache[word] = newWord;
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  return newWord;
}

module.exports = getSubstituteWords;
