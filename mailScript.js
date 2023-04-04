var http = require('http');

http.get("http://api-cfl.herokuapp.com/autoemails/shoot", function(res) {
    console.log("Got response: " + res.statusCode);
});
