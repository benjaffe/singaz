const path = require('path');
const express = require('express');
const scraperjs = require('scraperjs');

const app = express();

const baseURL = 'https://www.azlyrics.com/';

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
      const result = results.filter(r => r.url.startsWith('http'))[0];
      const url = result.url.startsWith('http')
        ? result.url
        : baseURL + result.url;
      if (!result) {
        res.send({
          type: 'error',
          text: `unable to find results for query:\n${req.query.q}`,
        });
        return;
      }
      // get lyrics for first result
      getLyricsFromPage(url).then(song => {
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
        .text()
        .trim(),
    };
  });
}

function getSearchResultsFromPage(url) {
  var url =
    'https://search.azlyrics.com/search.php?q=' + url.split(' ').join('+');
  console.log(`looking for results at ${url}`);
  return scraperjs.StaticScraper.create(url).scrape($ => {
    // console.log(
    //   $('.container .panel')
    //     .last()
    //     .find('.table tr td a')
    // );
    return $('.container .panel')
      .last()
      .find('.table tr')
      .map(function() {
        const result = {
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
        return result;
      })
      .get();
  });
}
