// Setup =======================================================================

var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var app = express();
var port = 8080;

// Config =======================================================================

app.set("x-powered-by", false);
app.set("root", __dirname);
app.use(bodyParser.json());

var config = require("./config");
mongoose.set('bufferCommands', false);
mongoose.connect("mongodb://" + config.mongo.user + ":" + config.mongo.pass + "@" + config.mongo.servers.join(",") + "/" + config.mongo.db + "?authSource=" + config.mongo.db, {useNewUrlParser: true});

var sensorModel = mongoose.model("sensor", {
	logTime: Date,
	temp: Number,
	humidity: Number
});

// Routes =======================================================================

app.post("/api/savesensor", (request, response) => {
	if (!request.body.sensor) {
		response.status(501).send("Invalid sensor data");
		response.end();
		return;
	}
	
	new sensorModel({
		logTime: new Date(request.body.sensor.logTime),
		temp: request.body.sensor.temp,
		humidity: request.body.sensor.humidity
	})
	.save()
	.then((sensorDB) => {
		response.status(200).json({sensorId: sensorDB._id});
		response.end();
	})
	.catch((error) => {
		response.status(500).json({error: error.message});
		response.end();
	});
});

app.get("/test", function(request, response) {
	response.sendFile("/client/test.html", { root: app.get("root") });
});

app.get("*", (request, response) => {
	response.status(404).send("Invalid path: " + request.path);
	response.end();
});

// listen (start app with node server.js) ======================================

app.listen(port);
console.log("App listening on port " + port);