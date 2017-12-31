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

const {throttle} = require('./src/utils');

const tokenSocketThrottle = 100;

const handleLoadSongByUrl = (socket, url) => {
  console.log('song request by url ', url);
  let wordsToSendToClient = [];
  if (!url.startsWith('https://www.azlyrics.com')) {
    socket.emit('err', {
      text: `Sorry, only urls from azlyrics.com are supported.`,
    });
    return;
  }
  socket.emit('invalidate', true);
  // scrape page by url
  getLyricsFromPage(url).then(
    song => {
      let sentIndex = 0;
      const sendWordQueue = throttle(words => {
        if (!words || !Array.isArray(words)) return;
        const wordsToSendToClient = words.slice(sentIndex);
        console.log(`\nemitting ${wordsToSendToClient.length} tokens\n`);
        socket.emit('tokens', {
          tokens: wordsToSendToClient,
        });
        sentIndex += wordsToSendToClient.length;
      }, tokenSocketThrottle);

      // socket.emit('song',{
      //   song: song
      // });
      // console.log('yo');
      mangleLyrics(song.lyrics, newWords => {
        // console.log('newWords', newWords);
        wordsToSendToClient.push.apply(wordsToSendToClient, newWords);
        // console.log('wordsToSendToClient', wordsToSendToClient);
        sendWordQueue(wordsToSendToClient);
      });
    },
    () => {
      console.log('failed');
    }
  );
};

const handleLoadSongByQuery = (socket, query) => {
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

http.listen(3000, function() {
  console.log('listening on *:3000');
});

app.use(express.static(__dirname + '/public'));

var port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Listening on ' + port);
});
