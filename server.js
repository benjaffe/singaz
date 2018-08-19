'use strict';
const express = require('express');

const {mangleLyrics} = require('./src/mangleLyrics');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const {throttle, isArrayWithLength} = require('./src/utils');

const tokenSocketThrottle = 100;

let wordsToSendToClient;
const mangleAndLoadSong = ({lyrics}, socket) => {
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

  mangleLyrics(lyrics, newWords => {
    wordsToSendToClient.push.apply(wordsToSendToClient, newWords);
    sendWordQueue(wordsToSendToClient);
  });
};

const loadKaraokeVideo = ({title}, socket) => {
  const query = `${title} karaoke instrumental`;
  console.log(`searching for youtube video with query, "${query}"`);
  socket.emit('videoUpdate', query);
};

const {genius: geniusKey} = require('./api-keys');
const Lyricist = require('lyricist');
const lyricist = new Lyricist(geniusKey);

const handleLoadSongByQuery = async (socket, query) => {
  if (query.length > 100) {
    console.log('interpreting the query as direct lyrics input');
    mangleAndLoadSong({lyrics: query}, socket);
    return;
  }

  // TODO: test error handling
  console.log(`loading song with initial query, "${query}"`);
  const searchResults = await lyricist.search(encodeURIComponent(query));
  // TODO: add support for multiple results
  const searchResult = searchResults[0];
  const song = await lyricist.song(searchResult.id, {fetchLyrics: true});
  console.log(`loaded song "${song.full_title}"`);
  mangleAndLoadSong(song, socket);
  loadKaraokeVideo(song, socket);
};

io.on('connection', function(socket) {
  console.log('a user connected');
  socket.on('disconnect', function() {
    console.log('user disconnected');
  });

  socket.on('loadSongByQuery', handleLoadSongByQuery.bind(null, socket));
});

http.listen(8080, function() {
  console.log('listening on *:8080');
});

app.use(express.static(__dirname + '/public'));
