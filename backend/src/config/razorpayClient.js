const Razorpay = require('razorpay');

apiKey="provide your api key"
apiSecret="provide your secret key"


const razorpay = new Razorpay({
    key_id: apiKey,
    key_secret: apiSecret,
  });


  module.exports = razorpay;