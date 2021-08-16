const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

//get list of urls that link to the pattern urls
function getPatternDirectory() {
  const patternsBaseUrl =
    "https://www.dmc.com/uk/free-patterns-5041/free-patterns-5042/free-cross-stitch-patterns-5044.html?page=";
  const patternDirectoryUrls = [
    "https://www.dmc.com/uk/free-patterns-5041/free-patterns-5042/free-cross-stitch-patterns-5044.html",
  ];

  for (let pageNumber = 1; pageNumber <= 12; pageNumber++) {
    patternDirectoryUrls.push(`${patternsBaseUrl}${pageNumber}`);
  }

  return patternDirectoryUrls;
}

//gets a list of pattern urls
function getPatternUrls(patternDirectoryUrls) {
  return Promise.all(
    patternDirectoryUrls.map((page) => {
      return axios(page)
        .then((response) => {
          const html = response.data;
          const $ = cheerio.load(html);
          const patternTable = $(".listbloc > .grid-item");
          const patternUrls = [];

          patternTable.each(function () {
            const baseUrl = "https://www.dmc.com";
            const patternUrl =
              baseUrl + $(this).find(".blockInfos > a").attr("href");

            patternUrls.push(patternUrl);
          });
          return patternUrls;
        })
        .catch(console.error);
    })
  );
}

function getPatternData(patternUrls) {
  return Promise.all(
    patternUrls.map((url) => {
      return axios(url)
        .then((response) => {
          function tidyNameData(name) {
            let patternName = name;

            if (patternName.endsWith("- pattern")) {
              patternName = patternName.substr(0, patternName.length - 9);
            }

            return patternName.trim();
          }

          const html = response.data;
          const $ = cheerio.load(html);
          const threadTable = $("#table_couleur > ul > li");
          let patternData = {};
          let threads = [];

          const patternName = tidyNameData(
            $(
              "div.breadNPaging.hidden-sm > div > div > div.col-xs-12 > p > span"
            ).text()
          );
          const imageSrc = $("#imagemodele0 > a > img").attr("src");

          threadTable.each(function () {
            const rawThread = $(this)
              .find("input.qte_ref_color")
              .attr("data-ref");
            const thread = rawThread.substr(rawThread.indexOf("_") + 1);
            const amountOfThread = $(this)
              .find("input.qte_ref_color")
              .attr("value");

            threads.push({
              threadName: thread,
              threadCount: parseInt(amountOfThread),
            });
          });

          patternData = {
            name: patternName,
            url: url,
            imageLink: imageSrc,
            threadData: threads,
          };
          return patternData;
        })
        .catch(console.error);
    })
  );
}

function setPatternJSON(patterns) {
  patterns.forEach((pattern) => {
    if (!patternJSON.includes(pattern)) {
      patternJSON.push(pattern);
    }
  });
}

const patternJSON = [];

//gets the list of pages
const patternDirectory = getPatternDirectory();

//gets the urls of all the patterns
getPatternUrls(patternDirectory).then((patternUrls) =>
  getPatternData(patternUrls.flat()).then((data) =>
    fs.writeFile("data.json", JSON.stringify(data, undefined, 4), (err) => {
      if (err) console.error(err);
      console.log("done");
    })
  )
);

// const testUrls = [
//   "https://www.dmc.com/uk/christmas-heart-pattern-9009915.html",
//   "https://www.dmc.com/uk/herbs-basil-9010802.html",
// ];
