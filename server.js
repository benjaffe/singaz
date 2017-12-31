'use strict';
const express = require('express');

const {
  getLyricsFromPage,
  getSearchResultsFromPage,
} = require('./src/getLyrics');
const {mangleLyrics} = require('./src/mangleLyrics');

const app = express();

app.use(express.static(__dirname + '/public'));

app.get('/song/', (req, res, next) => {
  console.log('song request by url ', req.query.url);
  let wordsToSendToClient = [];
  if (!req.query.url.startsWith('https://www.azlyrics.com')) {
    res.send({
      type: 'error',
      text: `Sorry, only urls from azlyrics.com are supported.`,
    });
    return;
  }
  // scrape page by url
  getLyricsFromPage(req.query.url).then(
    song => {
      const sendWordQueue = throttle(() => {
        res.send({type: 'tokens', tokens: wordsToSendToClient});
        wordsToSendToClient = [];
      }, 500);

      // res.send({type: 'song', song: song});
      // console.log('yo');
      mangleLyrics(song.lyrics, newWords => {
        wordsToSendToClient = wordsToSendToClient.concat(newWords);
        sendWordQueue();
      });
    },
    () => {
      console.log('failed');
    }
  );
});

function throttle(callback, wait, context = this) {
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
}

app.get('/search/', (req, res, next) => {
  console.log('song request by search query ', req.query.q);
  // get results for query
  getSearchResultsFromPage(req.query.q).then(
    results => {
      console.log('results gotten');
      const result = results.filter(r => r.url.startsWith('http'))[0];
      if (!result || !result.url) {
        res.send({
          type: 'error',
          text: `unable to find results for query:\n${req.query.q}`,
        });
        return;
      }
      const url = result.url;
      // get lyrics for first result
      getLyricsFromPage(url).then(song => {
        console.log('song fetched', song);
        res.send({type: 'song', song: song});
      });
    },
    () => {
      console.log('failed');
    }
  );
});

var port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Listening on ' + port);
});
