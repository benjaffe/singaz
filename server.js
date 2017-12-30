var express = require('express');
var scraperjs = require('scraperjs');

var app = express();

app.use(express.static(__dirname + '/public'));

app.get('/song/', (req, res, next) => {
  console.log('song request by url ', req.query);
  // scrape page by url
  getLyricsFromPage(req.query.url).then(
    song => {
      res.send(song);
    },
    () => {
      console.log('failed');
    }
  );
});

app.get('/search/', (req, res, next) => {
  console.log('song request by search query ', req.query.q);
  // get results for query
  getSearchResultsFromPage(req.query.q).then(
    results => {
      console.log('results gotten');
      console.log(results);
      const result = results[0];
      if (!result) {
        res.send({
          type: 'error',
          text: `unable to find results for query ${req.query.q}`,
        });
        return;
      }
      // get lyrics for first result
      getLyricsFromPage(results[0].url).then(song => {
        console.log('song fetched', song);
        // res.send({
        //   song: song,
        //   results: results,
        // });
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

function getLyricsFromPage(url) {
  console.log(`getLyricsFromPage: ${url}`);
  const scraper = scraperjs.StaticScraper.create(url);
  if (!scraper) {
    res.send({
      type: 'error',
      text: `unable to find results at url ${url}`,
    });
    return;
  }
  return scraper.scrape($ => {
    console.log($('.smt:not(.noprint)'));
    return {
      attribution: $('.smt:not(.noprint)')
        .map(function() {
          return $(this)
            .text()
            .trim();
        })
        .get()
        .reverse()
        .join('\n'),
      lyrics: $('.lyricsh ~ b')
        .eq(0)
        .nextAll('div')
        .eq(0)
        .text(),
    };
  });
}

function getSearchResultsFromPage(url) {
  var url =
    'http://search.azlyrics.com/search.php?q=' + url.split(' ').join('+');
  return scraperjs.StaticScraper.create(url).scrape($ => {
    // console.log(
    //   $('.container .panel')
    //     .last()
    //     .find('.table tr td a')
    // );
    return $('.container .panel')
      .last()
      .find('.table tr')
      .map(function(elem) {
        return {
          title: $(this)
            .find('a')
            .eq(0)
            .text(),
          artist: $(this)
            .find('td b')
            .eq(0)
            .text(),
          lyrics: $(this)
            .find('td small')
            .text(),
          url: $(this)
            .find('td a')
            .attr('href'),
        };
      })
      .get();
  });
}
