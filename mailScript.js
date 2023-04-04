var request = require('request');
request('https://api-cfl.herokuapp.com/autoemails/shoot', function (error, response, body) {
    if (!error && response.statusCode === 200) {
        console.log("Email Script started...") // Print the google web page.
     }else{
        console.log(error);
     }
})