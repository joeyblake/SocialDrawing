var configAuth = require('../config/auth');
/*
 * GET home page.
 */
exports.index = function(req, res){
  res.render('index', { title: 'Social Drawing', user: req.user });
};