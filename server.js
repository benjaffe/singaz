var express = require('express');
var scraperjs = require('scraperjs');

var app = express();

app.get('/song/', function(req, res, next) {
  console.log('song request by url');
  // scrape page by url
  getLyricsFromPage(req.query.url)
    .then(function(song) {
      console.log(song);
      res.send(song);
    }, function(){
      console.log('failed');
    });
});

app.get('/search/', function(req, res, next) {
  console.log('song request by search query');
  // get results for query
  getSearchResultsFromPage(req.query.q)
    .then(function(results) {
      console.log('results gotten');
      // get lyrics for first result
      getLyricsFromPage(results[0].url)
        .then(function(song){
          console.log('song fetched', song);
          res.send({
            song: song,
            results: results
          });
        });
    }, function(){
      console.log('failed');
    });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
 console.log("Listening on " + port);
});

function getLyricsFromPage(url) {
  return scraperjs.StaticScraper.create(url)
    .scrape(function($) {
      return {
        attribution: $('.smt:not(.noprint)')
          .map(function(){ return $(this).text(); })
          .get()
          .reverse()
          .join('\n\n'),
        lyrics: $(".lyricsh ~ b").eq(0).nextAll('div').eq(0).text()
      };
    });
}

function getSearchResultsFromPage(query) {
  var url = 'http://search.azlyrics.com/search.php?q=' + query.split(' ').join('+');
  return scraperjs.StaticScraper.create(url)
    .scrape(function($) {
      return $('.container .table tr').map(function() {
        return {
          title: $(this).find('td a').eq(0).text(),
          artist: $(this).find('td b').eq(0).text(),
          lyrics: $(this).find('td small').text(),
          url: $(this).find('td a').attr('href')
        };
      }).get();
    });
}