'use strict';

const socket = io();

const karaokeVideos = ['YCLyAmXtpfY', 'XjuE4DKw0Hg', 'h5y-oiu2f98'];

const songSearchElem = document.getElementById('songSearch');
const bannedWordsElem = document.getElementById('bannedWords');
const attributionElem = document.getElementById('attribution');
const lyricsWrapperElem = document.getElementById('lyricsWrapper');
const btnWrapperElem = document.getElementById('buttons');
const btnRhymeElem = document.getElementById('btnRhyme');
const btnBiblicalElem = document.getElementById('btnBiblical');
const btnLevenElem = document.getElementById('btnLeven');
const btnSwapElem = document.getElementById('btnSwap');
const btnFavorRhymesElem = document.getElementById('btnFavorRhymes');
const btnSFWElem = document.getElementById('btnSFW');
const btnMasterElem = document.getElementById('btnMaster');

// utils
const randomFactory = () => {
  let seed = 1;
  return {
    get: () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    },
    reset: () => {
      seed = 1;
    },
  };
};

const random = randomFactory();
const _randomVal = num => Math.floor(random.get() * num);
const _isNotPlural = (str1, str2) => str1 !== str2 + 's' && str2 !== str1 + 's';
const _isAppropriate = w => (sfw ? swears.indexOf(w) === -1 : w);
const _isNotBanned = w => bannedWords.indexOf(w) === -1;
const _isArrWithLength = arr => Array.isArray(arr) && arr.length > 0;
const _randomValueFromArr = (origArr, val) => {
  const arr = origArr
    .filter(_isAppropriate)
    .filter(_isNotBanned)
    .filter(_isNotPlural.bind(null, val));
  return arr.length > 0 ? arr[_randomVal(arr.length)] : val;
};
const _resolveProbability = prob => random.get() < prob;
const _wrapInSpan = (val, c) => `<span class="${c}">${val}</span>`;
const _clone = obj => JSON.parse(JSON.stringify(obj));

// swappers
const _masterSwapper = (word, classToUse, keyName) => {
  let replacement = _randomValueFromArr(
    word[keyName].filter(word => !bannedWords.includes(word)),
    word.val,
  );
  if (replacement !== word.val) {
    word.originalVal = word.val;
    word.mutated = true;
    word.val = _wrapInSpan(replacement, classToUse);
  }
  return word;
};

const _wordSwapper = w => {
  if (!w.mutated && swap && w.swapWords) {
    // console.log('swap ' + w.val);
    return _masterSwapper(w, 'swap', 'swapWords');
  }
  return w;
};

const _rhymeSwapper = w => {
  if (
    !w.mutated &&
    w.rhymeCandidates &&
    w.rhymeCandidates.length > 0 &&
    _resolveProbability(rhymeProbability * masterMultiplier)
  ) {
    // console.log('rhyme ' + w.val);
    return _masterSwapper(w, 'rhyme', 'rhymeCandidates');
  }
  return w;
};

const _biblicalSwapper = w => {
  if (
    !w.mutated &&
    w.biblicalCandidates &&
    w.biblicalCandidates.length > 0 &&
    _resolveProbability(biblicalProbability * masterMultiplier)
  ) {
    // console.log('biblical ' + w.val);
    return _masterSwapper(w, 'biblical', 'biblicalCandidates');
  }
  return w;
};

const _levenSwapper = w => {
  if (
    !w.mutated &&
    w.levenCandidates &&
    w.levenCandidates.length > 0 &&
    _resolveProbability(levenProbability * masterMultiplier)
  ) {
    // console.log('leven ' + w.val);
    return _masterSwapper(w, 'leven', 'levenCandidates');
  }
  return w;
};

$(songSearchElem).keypress(event => {
  if (event.which == 13) {
    event.preventDefault();
    loadNewSong();
  }
});

const _setBannedWords = event =>
  setTimeout(() => {
    bannedWords = bannedWordsElem.value.split(',').map(str => str.trim());
    recalculateLyrics();
  }, 0);

$(bannedWordsElem).on('input', _setBannedWords);

socket.on('tokens', res => {
  console.log(res);
  words = words.concat(res.tokens);
  recalculateLyrics();
});
socket.on('invalidate', res => {
  words = [];
  recalculateLyrics();
});
socket.on('err', res => {
  alert(`error: ${res.text}`);
});
socket.on('videoUpdate', res => {
  console.log('videoUpdate', res);
  player.cuePlaylist({
    listType: 'search',
    list: res,
  });
});

// init youtube player
let player;
const playerID = 'ytplayer';
(function() {
  const playerElem = document.getElementById(playerID);
  const tag = document.createElement('script');

  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  playerElem.addEventListener('click', e => {
    player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo();
  });
})();

function onYouTubeIframeAPIReady() {
  player = new YT.Player(playerID, {
    height: '240',
    width: '320',
    videoId: karaokeVideos[Math.floor(Math.random() * karaokeVideos.length)],
    events: {
      onReady: event => event.target.playVideo(),
      onStateChange: event => {
        if (event.data === YT.PlayerState.CUED) {
          event.target.playVideo();
        }
        if (event.data === YT.PlayerState.ENDED) {
          event.target.stopVideo();
        }
      },
    },
  });
}

let rhymeProbability = 1;
let biblicalProbability = 0.5;
let levenProbability = 0;
let masterMultiplier = 1;
let swap = false;
let sfw = true;
let favorRhymes = true;
let bannedWords;

let words = [];
let swears = [];

init();

// ======================

function recalculateLyrics() {
  random.reset();
  console.log(words.length);
  const wordsWithBible = _clone(words)
    .map(_wordSwapper)
    .map(_biblicalSwapper);

  random.reset();
  const wordsWithEverything = wordsWithBible
    .map(favorRhymes ? _rhymeSwapper : _levenSwapper)
    .map(favorRhymes ? _levenSwapper : _rhymeSwapper);

  lyricsWrapperElem.innerHTML = wordsWithEverything.map(w => w.val).join('');
}

function init() {
  document.body.style.display = 'block';
  btnRhymeElem.value = rhymeProbability * 100;
  btnBiblicalElem.value = biblicalProbability * 100;
  btnLevenElem.value = levenProbability * 100;
  btnMasterElem.value = masterMultiplier * 100;
  btnSwapElem.checked = swap;
  btnSFWElem.checked = sfw;
  btnFavorRhymesElem.checked = favorRhymes;

  btnRhymeElem.addEventListener('input', function(e) {
    rhymeProbability = e.target.value / 100;
    recalculateLyrics();
  });

  btnBiblicalElem.addEventListener('input', function(e) {
    biblicalProbability = e.target.value / 100;
    recalculateLyrics();
  });

  btnLevenElem.addEventListener('input', function(e) {
    levenProbability = e.target.value / 100;
    recalculateLyrics();
  });

  btnMasterElem.addEventListener('input', function(e) {
    masterMultiplier = e.target.value / 100;
    recalculateLyrics();
  });

  btnSwapElem.addEventListener('click', function(e) {
    swap = e.target.checked;
    recalculateLyrics();
  });

  btnSFWElem.addEventListener('click', function(e) {
    sfw = e.target.checked;
    btnSFWElem.parentElement.style.background = sfw ? '#CFC' : '#FAA';
    recalculateLyrics();
  });

  btnFavorRhymesElem.addEventListener('click', function(e) {
    console.log('btnFavorRhymesElem: ', favorRhymes);
    favorRhymes = e.target.checked;
    recalculateLyrics();
  });

  recalculateLyrics();
  _setBannedWords();
}

/* === Utils === */
// hit the server for new lyrics
function loadNewSong() {
  attributionElem.style.opacity = 0.6;
  lyricsWrapperElem.style.opacity = 0.6;
  const isUrl = songSearchElem.value.startsWith('http');
  console.log(isUrl ? 'isURL' : 'isNotUrl');

  if (isUrl) {
    console.log('loadSongByUrl');
    socket.emit('loadSongByUrl', songSearchElem.value);
  } else {
    console.log('loadSongByQuery');
    socket.emit('loadSongByQuery', songSearchElem.value);
  }
}
