var http = require('http');

http.get("http://api-cfl.herokuapp.com/autoemails/shoot", function(res) {
    console.log("Got response: " + res.statusCode);
});
// request('https://api-cfl.herokuapp.com/autoemails/shoot', function (error, response, body) {
//     if (!error && response.statusCode === 200) {
//         console.log("Email Script started...") // Print the google web page.
//      }else{
//         console.log(error);
//      }
// })