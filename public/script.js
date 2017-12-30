'use strict';

const songSearchElem = document.getElementById('songSearch');
const attributionElem = document.getElementById('attribution');
const lyricsElem = document.getElementById('lyrics');

$(songSearchElem).keypress(event => {
  if (event.which == 13) {
    event.preventDefault();
    loadNewSong();
  }
});

function loadNewSong() {
  attributionElem.style.opacity = 0.6;
  lyricsElem.style.opacity = 0.6;
  const isUrl = songSearchElem.value.startsWith('http');
  console.log(isUrl ? 'isURL' : 'isNotUrl');
  const url = `http://localhost:5000/${isUrl
    ? 'song/?url'
    : 'search/?q'}=${songSearchElem.value}`;
  $.get(url, res => {
    if (res.type === 'song') {
      attributionElem.innerHTML = res.song.attribution;
      lyricsElem.innerHTML = res.song.lyrics;
      attributionElem.style.opacity = 1;
      lyricsElem.style.opacity = 1;
    } else if (res.type === 'error') {
      alert(`error: ${res.text}`);
    } else {
      console.log('response: ', res);
    }
  });
}
