'use strict';
const express = require('express');

const {
  getLyricsFromPage,
  getSearchResultsFromPage,
} = require('./src/getLyrics');
const {mangleLyrics} = require('./src/mangleLyrics');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const {throttle, isArrayWithLength} = require('./src/utils');

const tokenSocketThrottle = 100;

let wordsToSendToClient;
const handleLoadSongByUrl = (socket, url) => {
  console.log(`attempting to load url: ${url}`);
  if (!url.startsWith('https://www.azlyrics.com')) {
    socket.emit('err', {
      text: `Sorry, only urls from azlyrics.com are supported.`,
    });
    return;
  }

  getLyricsFromPage(url, socket).then(
    song => {
      console.log(`loaded and parsed url: ${url}`);
      mangleAndLoadSong(song, socket);
    },
    err => {
      socket.emit('err', {
        text: `Unable to load lyrics from ${url}`,
      });
    }
  );
};

const mangleAndLoadSong = (song, socket) => {
  socket.emit('invalidate', true);
  wordsToSendToClient = [];
  let sentIndex = 0;

  // this function sends tokens back to the client, throttled
  const sendWordQueue = throttle(words => {
    if (!isArrayWithLength(words)) return;
    const tokens = words.slice(sentIndex); // only send new tokens
    socket.emit('tokens', {tokens});
    sentIndex = sentIndex + tokens.length;
  }, tokenSocketThrottle);

  mangleLyrics(song.lyrics, newWords => {
    wordsToSendToClient.push.apply(wordsToSendToClient, newWords);
    sendWordQueue(wordsToSendToClient);
  });
};

const handleLoadSongByQuery = (socket, query) => {
  if (query.length > 100) {
    mangleAndLoadSong({lyrics: query}, socket);
    return;
  }
  console.log('song request by search query ', query);
  // get results for query
  getSearchResultsFromPage(query).then(
    results => {
      console.log('results gotten');
      const result = results.filter(r => r.url.startsWith('http'))[0];
      if (!result || !result.url) {
        socket.emit('err', {
          text: `unable to find results for query:\n${query}`,
        });
        return;
      }
      const url = result.url;
      handleLoadSongByUrl(socket, url);
    },
    () => {
      console.log('failed');
    }
  );
};

io.on('connection', function(socket) {
  console.log('a user connected');
  socket.on('disconnect', function() {
    console.log('user disconnected');
  });

  socket.on('loadSongByUrl', handleLoadSongByUrl.bind(null, socket));

  socket.on('loadSongByQuery', handleLoadSongByQuery.bind(null, socket));
});

http.listen(8080, function() {
  console.log('listening on *:8080');
});

app.use(express.static(__dirname + '/public'));
