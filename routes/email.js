var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('IimI6fUKtCh45hrpSXYSRg');
var Drawing = require('../models/drawing');

exports.send = function(req, res) {
 var email_address = req.param('email_address', null);
 var key = req.param('key', null);
 res.render('email', {key: key}, function(err, html) {
    console.log(html);
    var message = {
    "html": html,
    "text": "You have recently asked us to save a social drawing for you, here it is: \n\n http://socialdrawing.codenimbus.com/past/"+key+"\n\n Thanks for checking it out! \n\n P.S. Still serious about that amazon giftcard...It won't cost you any more money, and it will help support this app! You rock! Click the link. Do it. http://www.amazon.com/b?_encoding=UTF8&camp=1789&creative=9325&linkCode=ur2&node=2238192011&site-redirect=&tag=frespenc0c-20",
    "subject": "Way to go! Here are your recent social drawing results!",
    "from_email": "socialdrawing@codenimbus.com",
    "from_name": "Social Drawing - Codenimbus",
    "to": [{
            "email": email_address,
            "name": "Recipient Name",
            "type": "to"
        }],
    "headers": {
        "Reply-To": "socialdrawing@codenimbus.com"
    },
    "important": false,
    "track_opens": null,
    "track_clicks": null,
    "auto_text": null,
    "auto_html": null,
    "inline_css": null,
    "url_strip_qs": null,
    "preserve_recipients": null,
    "view_content_link": null,
    "tracking_domain": null,
    "signing_domain": null,
    "return_path_domain": null,
    "merge": false,
    "tags": [
        "save-drawing"
    ],
    "metadata": {
      "website": "socialdrawing.codenimbus.com"
    }
  };
  var async = false;
  mandrill_client.messages.send({"message": message, "async": async}, function(result) {
    Drawing.findOne({ 'drawing.key' : key }, function(err, drawing) {
      if (err)
        throw err;

      if (drawing) {
        drawing.drawing.email = email_address;
        drawing.save(function(err) {
          if (err)
            throw err;
          res.json({'sent_to': email_address});
        });
      } 
    });
  }, function(e) {
      // Mandrill returns the error as an object with name and message keys
      console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
      // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });  
 });
};