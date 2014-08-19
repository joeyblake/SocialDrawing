var Drawing = require('../models/drawing');

exports.index = function(req, res){
  
  var key = req.params.id;    
  Drawing.findOne({ 'drawing.key' : req.params.id }, function(err, drawing) {
    if (err)
      throw err;

    if (drawing) {
      var data = JSON.parse(drawing.drawing.data);
      res.render('index_drawing', data);
    } else {
      res.redirect('/');
    }
  });
  
}