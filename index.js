var Twitter           = require('twitter-stream-channels'),
    fs                = require('fs'),
    GoogleSpreadsheet = require("google-spreadsheet"),
    ini               = require('ini');

var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));


var client = new Twitter({
  "consumer_key": config.TW_CONSUMER_KEY,
  "consumer_secret": config.TW_CONSUMER_SEC,
  "access_token": config.TW_ACCESS_TOKEN_KEY,
  "access_token_secret": config.TW_ACCESS_TOKEN_SEC
});

var channels = {
  "general": config.KW_TRAVEL,
  "hawaii": config.KW_HAWAII,
  "sam": config.KW_SAM,
  "SF": config.KW_SF,
  "carlos": config.KW_CARLOS
};

var stream = client.streamChannels({track:channels});
var my_sheet = new GoogleSpreadsheet(config.GOOGLE_SPREADSHEET);
var creds = require('./google-cred.json');

function handleError(err) {
  if (err) {
    console.log(err);
    return true;
  }
  return false;
}

function logTweetToGoogle(tweet, category) {
  console.log('logging to Google');
  my_sheet.useServiceAccountAuth(creds, function(err){
    // getInfo returns info about the sheet and an array or "worksheet" objects
    my_sheet.getInfo( function( err, sheet_info ){
        if((sheet_info !== undefined) && (sheet_info !== null)){
          console.log( sheet_info.title + ' is loaded' );
        }
      });

    if(category === 'general'){
      // column names are set by google and are based
      // on the header row (first row) of your sheet
      my_sheet.addRow(1, {
        text: tweet.text, url: "https://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id_str, followers: tweet.user.followers_count, username: tweet.user.screen_name, createdAt: tweet.created_at
      }, handleError);
    } else if(category === 'hawaii'){
      my_sheet.addRow(2, {
        text: tweet.text, url: "https://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id_str, followers: tweet.user.followers_count, username: tweet.user.screen_name, createdAt: tweet.created_at
      }, handleError);
    } else if(category === 'SF'){
      my_sheet.addRow(3, {
        text: tweet.text, url: "https://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id_str, followers: tweet.user.followers_count, username: tweet.user.screen_name, createdAt: tweet.created_at
      }, handleError);
    } else if(category === 'sam'){
      my_sheet.addRow(4, {
        text: tweet.text, url: "https://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id_str, followers: tweet.user.followers_count, username: tweet.user.screen_name, createdAt: tweet.created_at
      }, handleError);
    } else if(category === 'carlos'){
      my_sheet.addRow(5, {
        text: tweet.text, url: "https://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id_str, followers: tweet.user.followers_count, username: tweet.user.screen_name, createdAt: tweet.created_at
      }, handleError);
    }
  });
}

stream.on('channels/general', function(tweet){
  logTweetToGoogle(tweet, 'general');
});

stream.on('channels/hawaii', function(tweet){
  logTweetToGoogle(tweet, 'hawaii');
});

stream.on('channels/SF', function(tweet){
  logTweetToGoogle(tweet, 'SF');
});

stream.on('channels/sam', function(tweet){
  logTweetToGoogle(tweet, 'sam');
});

stream.on('channels/carlos', function(tweet){
  logTweetToGoogle(tweet, 'carlos');
});

// setTimeout(function(){
//     stream.stop();//closes the stream connected to Twitter
//     console.log('>stream closed after 100 seconds');
// },100000);
