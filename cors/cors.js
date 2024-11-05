var host = process.env.HOST || "0.0.0.0";
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

var cors = require("cors");
var express = require("express");
var app = express();

app.options("*", cors());

app.use(cors());

app.listen(port, host, function () {
  // console.log(`CORS-enabled web server running on ${host}:${port}`);
});
