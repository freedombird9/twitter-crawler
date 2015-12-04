var Twitter           = require('twitter'),
    AYLIENTextAPI     = require("aylien_textapi"),
    GoogleSpreadsheet = require("google-spreadsheet"),
    fs                = require('fs'),
    ini               = require('ini');

var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'))

// Confidence level is always between 0.5 and 1, therefore in the example below
// setting the positive confidence level to 0.49 instead of 0 does not make any
// difference in the results that are put in the spreadsheet.
const POLARITY_OPTIONS    = {
  // Do not show any positive tweets.
  positive: 0,
  // Show all the negative tweets.
  negative: 1,
  // Show neutral tweets with at most 65% confidence.
  neutral: 0.65
};


var my_sheet = new GoogleSpreadsheet(config.GOOGLE_SPREADSHEET);

var creds = require('./google-cred.json');
var textapi = new AYLIENTextAPI({
  application_id: config.AYLIEN_APP_ID,
  application_key: config.AYLIEN_APP_KEY
});

var client = new Twitter({
  consumer_key: config.TW_CONSUMER_KEY,
  consumer_secret: config.TW_CONSUMER_SEC,
  access_token_key: config.TW_ACCESS_TOKEN_KEY,
  access_token_secret: config.TW_ACCESS_TOKEN_SEC
});



function checkLanguage(tweet) {
  console.log(tweet.text);
  console.log("https://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id_str);

  textapi.language({"text": tweet.text}, function(error, languageResponse) {
    if (handleError(error)) return;

    if (languageResponse.lang == config.LANGUAGE) {
      logTweetToGoogle(tweet);
    }
  });
}

function measureSentiment(tweet) {
  textapi.sentiment({"text": tweet.text}, function(error, response) {
    if (handleError(error)) return;

    for (polarity in POLARITY_OPTIONS) {
      if (POLARITY_OPTIONS[polarity] > 0.5) {
        if (response.polarity == polarity && response.polarity_confidence <= POLARITY_OPTIONS[polarity]) {
          console.log("Polarity confidence: " + Math.round(response.polarity_confidence*100)/100);
          logTweetToGoogle(tweet, response);
        }
      }
    }
  });
}

function logTweetToGoogle(tweet) {
  console.log('logging to Google');
  my_sheet.useServiceAccountAuth(creds, function(err){
    // getInfo returns info about the sheet and an array or "worksheet" objects
    my_sheet.getInfo( function( err, sheet_info ){
        console.log( sheet_info.title + ' is loaded' );
          // use worksheet object if you want to stop using the # in your calls
      });

      // column names are set by google and are based
      // on the header row (first row) of your sheet
    my_sheet.addRow(2, {
      text: tweet.text, url: "https://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id_str, followers: tweet.user.followers_count, username: tweet.user.screen_name, createdAt: tweet.created_at
    }, handleError);
    });
}

function handleError(err) {
  if (err) {
    console.log(err);
    return true;
  }
  return false;
}

client.stream('statuses/filter', {track: config.KW_HAWAII}, function(stream) {
  stream.on('data', logTweetToGoogle);
  stream.on('error', handleError);
});
