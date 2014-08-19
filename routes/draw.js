var configAuth = require('../config/auth');
var util = require('util');
var async = require('async');
var request = require('request');
var _ = require('underscore');
var md5 = require('MD5');
var url = require('url');
var scraper = require('scraper');

var Drawing = require('../models/drawing');

exports.index = function(req, res) {
  var tweet_url = req.param('tweet_url', null);
      tweet_url_split = tweet_url.split('/');
  var twitter_username = tweet_url_split[3];
  var tweet_id = tweet_url_split[5];
  
  var fb_post_url = req.param('facebook_post_url', null);
  var fb_post_id = false;

  var drawing_key = md5(tweet_url+'--'+fb_post_url);
  
  if (fb_post_url) {
    fb_post_url = url.parse(fb_post_url.toString(), true);
    fb_post_id =(fb_post_url.query.fbid) ? fb_post_url.query.fbid : fb_post_url.pathname.split('/').pop();
  }

  if (!tweet_url && !fb_post_url) {
    return res.redirect('/');
  }
  
  var locals = {};

  Drawing.findOne({ 'drawing.key' : drawing_key }, function(err, drawing) {
    if (err)
      throw err;

    if (drawing && drawing.drawing.key == drawing_key) {
      console.log('exists', drawing.drawing.key);
      var data = JSON.parse(drawing.drawing.data);
      return res.render('index_drawing', data);
    } else {
      console.log('not exists', drawing_key);
      async.parallel([
        function(callback){
          if ( !tweet_id ) {
            return callback();
          } else {
            
            locals.tweets = [];
            scraper(tweet_url, function(err, jQuery) {
              if (err) {return callback( err ) }
              jQuery('#stream-items-id .js-stream-tweet').each(function() {
                var data = jQuery(this).data();
                data.profile_image_url = jQuery(this).find('.avatar').attr('src');
                locals.tweets.push(data);
              });
              callback();
            });
            
          }
        },
        function(callback){
          if ( !fb_post_id ){
            return callback();
          } else {
            request.get('https://graph.facebook.com/'+fb_post_id+'?access_token='+req.user.facebook.token, function(err, res, body){
              locals.facebook = JSON.parse(body);
              if (locals.facebook.error) {
                callback(locals.facebook.error);
                return; //It's important to return so that the task callback isn't called twice
              }
              callback();
            });
          }
        }
      ], function(err){
        if (err) {
          throw new Error(err.message);
        }
        var participants = [],
            tweet_count = 0,
            fb_count = 0;
        if ( locals.tweets ) {
          _.each(locals.tweets, function(idx) {
            if ( idx.screen_name == twitter_username ) {
              return;
            }
            var participant = {
              'name': '@' + idx.screenName ,
              'url' : 'http://twitter.com/' + idx.screenName,
              'id': idx.userId,
              'pic': idx.profile_image_url,
              'large':idx.profile_image_url.replace('normal', 'bigger') };
            if (_.findWhere(participants, participant) == null) {
              participants.push(participant);
              tweet_count++;
            }
          });
        }

        if ( locals.facebook ) {
          _.each(locals.facebook.comments.data, function(idx, el) {
            if ( idx.from.category ){
              return;
            }
            var participant = idx.from;
            participant.pic = 'https://graph.facebook.com/'+idx.from.id+'/picture';
            participant.large = participant.pic + '?type=large';
            participant.url = 'http://www.facebook.com/' + idx.from.id;
            if (_.findWhere(participants, participant) == null) {
              participants.push(participant);
              fb_count++;
            }
          });
        }
        _.uniq(participants,function(item,key,participants){
          return JSON.stringify(item)
        })
        
        var winner = Math.floor(Math.random() * participants.length);
        participants[winner].winner = 1;
        
        var data = { 
          title: 'Results', 
          winner: participants[winner], 
          participants: participants,
          total: participants.length,
          twitter: tweet_count,
          facebook: fb_count,
          key: drawing_key
        };

        if ( fb_post_id ) {
          data.fb_post = 'http://www.facebook.com/' + fb_post_id;
        }

        if ( twitter_username && tweet_id ) {
          data.tweet = 'https://twitter.com/'+twitter_username+'/status/'+tweet_id;
        }

        // find the user in the database based on their facebook id
        Drawing.findOne({ 'drawing.key' : data.key }, function(err, drawing) {

            // if there is an error, stop everything and return that
            // ie an error connecting to the database
            if (err)
              throw err;

            if (drawing) {
                return drawing;
            } else {
                var newDrawing = new Drawing();
                newDrawing.drawing.key = data.key;               
                newDrawing.drawing.data = JSON.stringify(data);             
                // save our drawing to the database
                newDrawing.save(function(err) {
                    if (err)
                        throw err;

                    // if successful, return the new drawing
                    return newDrawing;
                });
            }

        });
        res.render('index_drawing', data);
      })
    }
  });
}