'use strict';

const scraperjs = require('scraperjs');

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
module.exports = {getLyricsFromPage, getSearchResultsFromPage};
