var routes = require('./routes/index');
var email = require('./routes/email');
var past = require('./routes/past');
var draw = require('./routes/draw');

module.exports = function(app, passport) {
  app.get('/', routes.index);
  
  app.post('/draw', draw.index);

  app.get('/past/:id', past.index);

  app.post('/email', email.send);

  // =====================================
  // TWITTER ROUTES ======================
  // =====================================
  // route for twitter authentication and login
  app.get('/auth/twitter', passport.authenticate('twitter'));

  // handle the callback after twitter has authenticated the user
  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      successRedirect : '/',
      failureRedirect : '/'
    })
  );

  // =====================================
  // FACEBOOK ROUTES =====================
  // =====================================
  // route for facebook authentication and login
  app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

  // handle the callback after facebook has authenticated the user
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect : '/',
      failureRedirect : '/'
    })
  );
}