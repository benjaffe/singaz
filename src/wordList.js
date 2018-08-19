'use strict';

const fs = require('fs');
const path = require('path');

const {dedupe} = require('./utils');

const wordListRaw = String(
  fs.readFileSync(path.join(__dirname, '../data/2of12id.txt'))
);
const wordList = wordListRaw.split('\n').reduce((acc, val) => {
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
        acc[word].pos = acc[word].pos.concat(pos).filter(dedupe);
      } else {
        acc[word].pos = pos;
      }
    }
  });
  return acc;
}, {});

const get = word =>
  wordList[word] != null ? wordList[word] : {word, pos: [], generated: true};
const getPos = word => get(word).pos;

module.exports = {wordList, getPos, get};
