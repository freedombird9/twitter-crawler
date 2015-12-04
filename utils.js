var AYLIENTextAPI     = require("aylien_textapi"),
    GoogleSpreadsheet = require("google-spreadsheet"),
    fs                = require('fs'),
    ini               = require('ini');

var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
//exports.config = config;
// Confidence level is always between 0.5 and 1, therefore in the example below
// setting the positive confidence level to 0.49 instead of 0 does not make any
// difference in the results that are put in the spreadsheet.

var creds = require('./google-cred.json');

const POLARITY_OPTIONS    = {
  // Do not show any positive tweets.
  positive: 0,
  // Show all the negative tweets.
  negative: 1,
  // Show neutral tweets with at most 65% confidence.
  neutral: 0.75
};

var my_sheet = new GoogleSpreadsheet(config.GOOGLE_SPREADSHEET);

var textapi = new AYLIENTextAPI({
  application_id: config.AYLIEN_APP_ID,
  application_key: config.AYLIEN_APP_KEY
});


function handleError(err) {
  if (err) {
      console.log(err);
      return true;
    }
    return false;
}


function measureSentiment(tweet) {
  textapi.sentiment({"text": tweet.text}, function(error, response) {
    if (handleError(error)) return;

    for (polarity in POLARITY_OPTIONS) {
      if (POLARITY_OPTIONS[polarity] > 0.5) {
        if (response.polarity == polarity && response.polarity_confidence <= POLARITY_OPTIONS[polarity]) {
          console.log("Polarity confidence: " + Math.round(response.polarity_confidence*100)/100);
          logTweetToGoogleSentiment(tweet, response);
        }
      }
    }
  });
}


function measureSemantic(tweet) {
  textapi.unsupervisedClassify({
    'text': tweet.text,
    'class':['travel', 'vacation', 'holiday', 'trip']
  }, function(error, response) {
    if(handleError(error)) return;

    for(i = 0; i < response.classes.length; i++) {
      // may need to do a null/undefined/empty test
      // for score
      if ('score' in response.classes[i] && response.classes[i].score >= 0.01){
        logTweetToGoogleTravel(tweet, response);
        break;
      }
    }
  });
}

function logTweetToGoogleSentiment(tweet, response) {

  my_sheet.useServiceAccountAuth(creds, function(err) {

    my_sheet.getInfo( function( err, sheet_info ){
        console.log( sheet_info.title + ' is loaded' );
          // use worksheet object if you want to stop using the # in your calls
    });

    my_sheet.addRow(1, {
      text: tweet.text, url: "https://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id_str,
      polarity: response.polarity,
      confidence: Math.round(response.polarity_confidence*100)/100,
      followers: tweet.user.followers_count
    }, handleError);
  });
}

function logTweetToGoogleTravel(tweet, response) {
  var trip      = 0,
      holiday   = 0,
      vacation  = 0,
      travel    = 0;

  for (i = 0; i < response.classes.length; i++) {
    switch (response.classes[i].label) {
      case 'trip':
        trip = response.classes[i].score;
        break;
      case 'holiday':
        holiday = response.classes[i].score;
        break;
      case 'vacation':
        vacation = response.classes[i].score;
        break;
      case 'travel':
        travel = response.classes[i].score;
        break;
    }

  }

  my_sheet.useServiceAccountAuth(creds, function(err){

    my_sheet.getInfo( function(err, sheet_info) {
      console.log(sheet_info.title + 'is loaded');
    });
    my_sheet.addRow(2, {
      text: tweet.text,
      url: "https://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id_str,
      travel: travel,
      trip: trip,
      vacation: vacation,
      holiday: holiday,
      followers: tweet.user.followers_count
    }, handleError);
  });
}

function UserException(message) {
   this.message = message;
   this.name = "UserException";
}

module.exports = {

  checkLanguage: function(tweet, measure) {
    console.log(tweet.text);

    console.log("https://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id_str);

    textapi.language({"text": tweet.text}, function(error, languageResponse) {
      if (handleError(error)) return;

      if (languageResponse.lang == config.LANGUAGE) {
        if(measure === 'sentiment' ) {
          measureSentiment(tweet);
        } else if(measure === 'semantic') {
          measureSemantic(tweet);
        } else {
          throw new UserException('UndefinedMethod');
        }
      }
    });
  }
};

