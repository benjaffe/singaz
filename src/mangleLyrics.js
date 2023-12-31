const fs = require('fs');
const leven = require('leven');
const getSubstituteWords = require('./getSubstituteWords');
const { sameSyllableCountAs } = require('./utils');
const {
  verboseLogging,
  levenCoolWords,
  levenUncoolWords,
} = require('./constants');
const Tokenizer = require('tokenize-text');
const tokenize = new Tokenizer();
const { englishUsa } = require('word-list-google');

let startTime = Date.now();
let swapsCount = 0;
let randomRhymeCount = 0;
let randomBiblicalCount = 0;
let randomLevenCount = 0;

const minLengthToSwap = 3;

const _mostCommonWords = englishUsa
  .map(w => w.toLowerCase())
  .filter(w => w.length > minLengthToSwap);

const swapSearchRadius = 100;
const swapCandidateMinLength = 4;
const { wordsToNotProcess } = require('./constants');

const wordsNotToReplaceWith = englishUsa
  .slice(0, 100)
  .concat(['though', 'through'])
  .map(s => s.toLowerCase());

let processedWordsInQueue = [];

function tokenizeLyrics(lyrics) {
  const wordsTokenized = tokenize.words()(lyrics);
  const words = wordsTokenized.map(token => token.value);
  return wordsTokenized;
}

function mangleLyrics(lyrics, callback) {
  const wordsTokenized = tokenize.words()(lyrics);
  const words = wordsTokenized.map(token => token.value);
  processWords(words, callback, {
    allWords: words,
    wordsTokenized,
    lyrics,
  });
}

function processWords(
  words,
  callback,
  { i = 0, allWords, wordsTokenized, lyrics },
) {
  const word = words[0];
  if (!word) return;
  const restOfWords = words.slice(1);
  const processedStuff = processWord(word, i, allWords, wordsTokenized, lyrics);
  processedWordsInQueue = processedWordsInQueue.concat(processedStuff);
  callback(processedStuff);
  setImmediate(() =>
    processWords(restOfWords, callback, {
      i: i + 1,
      allWords,
      wordsTokenized,
      lyrics,
    }),
  );
}

function processWord(val, i, arr, wordsTokenized, originalLyrics) {
  let acc = [];
  let originalVal = val;
  let token = wordsTokenized[i];
  let nextToken = wordsTokenized[i + 1] || wordsTokenized[i];
  let matches = arr
    .slice(i - swapSearchRadius, i + swapSearchRadius)
    // .filter(r.doRhyme.bind(null, val))
    .filter(val => !_isUpperCase(val))
    .filter(val => val.length >= swapCandidateMinLength);

  if (_isTitle(val)) {
    acc.push({ val: val, isTitle: true });
    acc.push(_getInterstitial(token, nextToken, originalLyrics));
    return acc;
  }

  let wordObj = { val: val };

  if (wordsToNotProcess.indexOf(val.toLowerCase()) === -1 && val.length > 2) {
    // get swap words
    // if (matches.length) {
    //   wordObj.swapWords = matches.filter(_isValidReplacement);
    //   swapsCount++;
    // }

    // get random rhyme candidates
    const rhymeCandidates = getSubstituteWords(val).rhymes;
    if (verboseLogging) {
      console.log(val, rhymeCandidates);
    }
    if (rhymeCandidates && rhymeCandidates.length > 0) {
      randomRhymeCount++;
      wordObj.rhymeCandidates = rhymeCandidates.filter(_isValidReplacement);
    }

    // get random biblical candidates
    const biblicalCandidates = getSubstituteWords(val).biblical;
    if (verboseLogging) {
      console.log(val, biblicalCandidates);
    }
    if (biblicalCandidates && biblicalCandidates.length > 0) {
      randomBiblicalCount++;
      wordObj.biblicalCandidates = biblicalCandidates.filter(
        _isValidReplacement,
      );
    }

    // get random leven candidates
    // const levenCandidates = _getLevenCandidates(val); // skip leven
    const levenCandidates = [];
    if (levenCandidates.length > 0) {
      randomLevenCount++;
      wordObj.levenCandidates = levenCandidates.filter(_isValidReplacement);
    }
  }
  if (verboseLogging) {
    console.log(
      `  ${i}: ${
        wordObj.rhymeCandidates ? wordObj.rhymeCandidates.length : 0
      }/${
        wordObj.levenCandidates ? wordObj.levenCandidates.length : 0
      } ${val} - ${token.value}`,
    );
  }

  acc.push(wordObj);
  acc.push(_getInterstitial(token, nextToken, originalLyrics));
  return acc;
}

const _isTitle = s => _isUpperCase(s);

const _isUpperCase = s =>
  typeof s === 'string' &&
  s === s.toUpperCase() &&
  s.length > 2 &&
  isNaN(Number(s));

const _isValidReplacement = w => wordsNotToReplaceWith.indexOf(w) === -1;

function _getInterstitial(t1, t2, original) {
  let val = original.slice(t1.index + t1.offset, t2.index);
  return { isInterstitial: true, val: val };
}

function _getLevenCandidates(word) {
  let totalScore = 1000;
  let candidates = [];
  _mostCommonWords.forEach(dWord => {
    // if the dictionary word we're considering is the word we're comparing
    // against, or if the word is uncool, skip it
    if (dWord === word || levenUncoolWords.indexOf(dWord) !== -1) {
      return;
    }
    let score = leven(word, dWord);
    if (levenCoolWords.indexOf(dWord) !== -1) {
      score--;
    }
    if (score < totalScore) {
      candidates = [];
      totalScore = score;
    }
    if (score === totalScore) {
      if (sameSyllableCountAs(word)(dWord) && word.toLowerCase() !== dWord) {
        candidates.push(dWord);
      }
    }
  });
  if (candidates.length > 0) {
    // console.log(`for word "${word}", found leven candidates "${candidates}"`);
  }
  return totalScore < 3 && candidates.length > 0 ? candidates : [];
}

module.exports = { mangleLyrics, tokenizeLyrics };
