'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const pronouncing = require('pronouncing');
const leven = require('leven');
const {englishUsa} = require('word-list-google');

const posListRaw = String(
  fs.readFileSync(path.join(__dirname, '../data/2of12id.txt'))
);
const posList = posListRaw.split('\n').reduce((acc, val) => {
  const word = val.split(' ')[0];
  const posRaw = val.split(' ')[1];
  const pos = posRaw ? [posRaw.split(':')[0]] : null;
  const altWordsRaw = val.split(': ')[1];
  const altWords = altWordsRaw ? altWordsRaw.split('  ') : [];
  const words = [word, ...altWords];
  words.map(word => {
    if (acc[word] == null) {
      acc[word] = {word, pos};
    } else {
      if (acc[word].pos) {
        acc[word].pos = acc[word].pos.concat(pos);
      } else {
        acc[word].pos = pos;
      }
    }
  });
  return acc;
}, {});

const _toLowerCase = str => str.toLowerCase();
const mostCommonWords = englishUsa.map(_toLowerCase);

const _sameSyllableCountAs = origWord => word =>
  _getSyllableCount(origWord) === _getSyllableCount(word);
const _getSyllableCount = word =>
  pronouncing.syllableCount(pronouncing.phonesForWord(word)[0]);
const _getPos = word => (posList[word] != null ? posList[word].pos : null);

/**
 * @return  function which returns true if the word passed into it is the same
 * part of speech as the original word.
 */

const _isSamePartOfSpeechAs = origWord => word => {
  const origWordPos = _getPos(origWord);
  const wordPos = _getPos(word);
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

/**
 * dedupes values from an array when used with .filter
 */
const _dedupe = (val, i, arr) => arr.indexOf(val) === i;

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
    .filter(_dedupe)
    .filter(_sameSyllableCountAs(word))
    .filter(_isCommon)
    .filter(_isSamePartOfSpeechAs(word))
    .sort(_sortByFrequency);

  if (cache[word] == null) {
    cache[word] = {rhymes, pos: _getPos(word)};
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  }
  return rhymes != null ? rhymes : null;
}

module.exports = getSubstituteWords;
