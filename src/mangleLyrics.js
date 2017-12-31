const fs = require('fs');
const rhyme = require('rhyme-plus');
const leven = require('leven');
const syllable = require('syllable');
const Tokenizer = require('tokenize-text');
const tokenize = new Tokenizer();
const {englishUsa, englishUsaNoSwears} = require('word-list-google');

const allowSwears = true;
const commonWordList = allowSwears ? englishUsa : englishUsaNoSwears;

let startTime = Date.now();
let swapsCount = 0;
let randomRhymeCount = 0;
let randomLevenCount = 0;
let cacheHits = 0;

const _mostCommonWords = commonWordList
  .map(w => w.toLowerCase())
  .filter(w => w.length > 3);

// const lyrics = fs.readFileSync('./data/lyrics-with-speaker.txt', 'utf-8');

let wordsToProcess = 0;
const whereToStart = 0;
const SEARCH_RADIUS = 100;
const MIN_REPLACEMENT_CANDIDATE_LENGTH = 4;
const wordsNotToProcess = commonWordList
  .slice(0, 100)
  .concat(['though', 'through'])
  .map(s => s.toLowerCase());

const wordsNotToReplaceWith = commonWordList
  .slice(0, 100)
  .concat(['though', 'through'])
  .map(s => s.toLowerCase());

const _rand = num => Math.floor(num * Math.random());
const _randFromArray = arr => arr[_rand(arr.length)];

let cache = {};

let r;
rhyme(_r => {
  r = _r;
});

let processedWordsInQueue = [];

function tokenizeLyrics(lyrics) {
  const wordsTokenized = tokenize.words()(lyrics);
  const words = wordsTokenized.map(token => token.value);
  return wordsTokenized;
}

function mangleLyrics(lyrics, callback) {
  const wordsTokenized = tokenize.words()(lyrics);
  // wordsToProcess = wordsToProcess !== 0 ? wordsToProcess : wordsTokenized.length;
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
  {i = 0, allWords, wordsTokenized, lyrics}
) {
  const word = words[0];
  if (!word) return;
  const restOfWords = words.slice(1);
  const processedStuff = processWord(word, i, allWords, wordsTokenized, lyrics);
  processedWordsInQueue = processedWordsInQueue.concat(processedStuff);
  callback(processedWordsInQueue);
  setImmediate(() =>
    processWords(restOfWords, callback, {
      i: i + 1,
      allWords,
      wordsTokenized,
      lyrics,
    })
  );
}

function processWord(val, i, arr, wordsTokenized, originalLyrics) {
  console.log(val);
  let acc = [];
  let originalVal = val;
  let token = wordsTokenized[i];
  let nextToken = wordsTokenized[i + 1] || wordsTokenized[i];
  console.log(`${i}/${wordsToProcess}: ${val} - ${token.value}`);
  let matches = arr
    .slice(i - SEARCH_RADIUS, i + SEARCH_RADIUS)
    .filter(r.doRhyme.bind(null, val))
    .filter(val => !_isUpperCase(val))
    .filter(val => val.length >= MIN_REPLACEMENT_CANDIDATE_LENGTH);

  if (_isTitle(val)) {
    acc.push({val: val, isTitle: true});
    acc.push(_getInterstitial(token, nextToken, originalLyrics));
    return acc;
  }

  if (cache[val]) {
    acc.push(cache[val]);
    acc.push(_getInterstitial(token, nextToken, originalLyrics));
    cacheHits++;
    return acc;
  }

  let wordObj = {val: val};

  if (wordsNotToProcess.indexOf(val.toLowerCase()) === -1 && val.length > 2) {
    // get swap words
    if (matches.length) {
      wordObj.swapWords = matches.filter(_isValidReplacement);
      swapsCount++;
    }

    // get random rhyme candidates
    const rhymeCandidates = _getRhymeCandidates(val);
    if (rhymeCandidates.length > 0) {
      randomRhymeCount++;
      wordObj.rhymeCandidates = rhymeCandidates.filter(_isValidReplacement);
    }

    // get random leven candidates
    const levenCandidates = _getLevenCandidates(val);
    if (levenCandidates.length > 0) {
      randomLevenCount++;
      wordObj.levenCandidates = levenCandidates.filter(_isValidReplacement);
    }
  }
  acc.push(wordObj);
  acc.push(_getInterstitial(token, nextToken, originalLyrics));
  cache[originalVal] = wordObj;
  return acc;
}

const _isTitle = s => _isUpperCase(s);

const _isUpperCase = s =>
  typeof s === 'string' &&
  s === s.toUpperCase() &&
  s.length > 2 &&
  isNaN(Number(s));

const _isCommonEnoughWord = w => {
  return _mostCommonWords.indexOf(w.toLowerCase()) !== -1;
};

const _isValidReplacement = w => wordsNotToReplaceWith.indexOf(w) === -1;

function _getInterstitial(t1, t2, original) {
  let val = original.slice(t1.index + t1.offset, t2.index);
  return {isInterstitial: true, val: val};
}

function doHam(config) {
  let startTime = Date.now();
  let swapsCount = 0;
  let randomRhymeCount = 0;
  let randomLevenCount = 0;
  let cacheHits = 0;
  const result = _wordsIsolatedSanitized.reduce((acc, val, i, arr) => {
    // let originalVal = val;
    // let token = _wordsTokenized[i];
    // let nextToken = _wordsTokenized[i + 1] || _wordsTokenized[i];
    // console.log(`${i}/${wordsToProcess}: ${val} - ${token.value}`);
    // let matches = arr
    //   .slice(i - SEARCH_RADIUS, i + SEARCH_RADIUS)
    //   .filter(r.doRhyme.bind(null, val))
    //   .filter(val => !_isUpperCase(val))
    //   .filter(val => val.length >= MIN_REPLACEMENT_CANDIDATE_LENGTH);
    //
    // if (_isTitle(val)) {
    //   acc.push({val: val, isTitle: true});
    //   acc.push(_getInterstitial(token, nextToken, lyrics));
    //   return acc;
    // }
    //
    // if (cache[val]) {
    //   acc.push(cache[val]);
    //   acc.push(_getInterstitial(token, nextToken, lyrics));
    //   cacheHits++;
    //   return acc;
    // }
    //
    // let wordObj = {val: val};
    //
    // if (wordsNotToProcess.indexOf(val.toLowerCase()) === -1 && val.length > 2) {
    //   // get swap words
    //   if (matches.length) {
    //     wordObj.swapWords = matches.filter(_isValidReplacement);
    //     swapsCount++;
    //   }
    //
    //   // get random rhyme candidates
    //   const rhymeCandidates = _getRhymeCandidates(val);
    //   if (rhymeCandidates.length > 0) {
    //     randomRhymeCount++;
    //     wordObj.rhymeCandidates = rhymeCandidates.filter(_isValidReplacement);
    //   }
    //
    //   // get random leven candidates
    //   const levenCandidates = _getLevenCandidates(val);
    //   if (levenCandidates.length > 0) {
    //     randomLevenCount++;
    //     wordObj.levenCandidates = levenCandidates.filter(_isValidReplacement);
    //   }
    // }
    // acc.push(wordObj);
    // acc.push(_getInterstitial(token, nextToken, lyrics));
    // cache[originalVal] = wordObj;
    // return acc;
  }, []);

  fs.writeFileSync('./public/data.json', JSON.stringify(result, null, 2));
  let duration = (Date.now() - startTime) / 1000;
  console.log(
    `Processed ${wordsToProcess} in ${duration} seconds, hitting the cache ${cacheHits} times, performed ${swapsCount} swaps, and ${randomRhymeCount} random rhyme replacements`
  );
}

function _getRhymeCandidates(word) {
  let randomCandidates = r
    .rhyme(word)
    .map(s => s.toLowerCase())
    .filter(_isCommonEnoughWord);
  if (randomCandidates.length > 0) {
    console.log(
      `for word "${word}", found rhyme candidates "${randomCandidates}"`
    );
  }
  return randomCandidates;
}

function _getLevenCandidates(word) {
  // prettier-ignore
  const COOL_WORDS = [
    'fart','lumpy','poop','pee','boop','beep','beeper','chicken','monkey','crap'
  ];
  const UNCOOL_WORDS = ['donut', 'donate', 'greatness'];
  let totalScore = 1000;
  let candidates = [];
  _mostCommonWords.forEach(dWord => {
    // if the dictionary word we're considering is the word we're comparing
    // against, or if the word is uncool, skip it
    if (dWord === word || UNCOOL_WORDS.indexOf(dWord) !== -1) {
      return;
    }
    let score = leven(word, dWord);
    if (COOL_WORDS.indexOf(dWord) !== -1) {
      score--;
    }
    if (score < totalScore) {
      candidates = [];
      totalScore = score;
    }
    if (score === totalScore) {
      if (syllable(word) === syllable(dWord) && word.toLowerCase() !== dWord) {
        candidates.push(dWord);
      }
    }
  });
  if (candidates.length > 0) {
    console.log(`for word "${word}", found leven candidates "${candidates}"`);
  }
  return totalScore < 3 && candidates.length > 0 ? candidates : [];
}

module.exports = {mangleLyrics, tokenizeLyrics};
