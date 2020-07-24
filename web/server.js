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
mongoose.connect("mongodb://" + config.mongo.user + ":" + config.mongo.pass + "@" + config.mongo.servers.join(",") + "/" + config.mongo.db + "?authSource=" + config.mongo.db, {useNewUrlParser: true});

var sensorModel = mongoose.model("sensor", {
	logTime: Date,
	temp: Number,
	humidity: Number,
	isLightOn: Boolean,
	hasDoorChange: Boolean,
	isDoorOpen: Boolean,
	hasMotion: Boolean,
	isFanOn: Boolean
});

var commandModel = mongoose.model("command", {
	insertTime: Date,
	type: String,
	status: Boolean
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
		humidity: request.body.sensor.humidity,
		isLightOn: request.body.sensor.light == 1 ? true : false,
		hasDoorChange: request.body.sensor.doorChange == 1 ? true : false,
		isDoorOpen: request.body.sensor.isDoorOpen == 1 ? true : false,
		hasMotion: request.body.sensor.motion == 1 ? true : false,
		isFanOn: request.body.sensor.fan == 1 ? true : false
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

app.post("/api/command", (request, response) => {
	if (!request.body.command) {
		response.status(501).json({ error: "Command missing from request" });
		response.end();
		return;
	}
	
	new commandModel({
		insertTime: new Date(),
		type: request.body.command.type,
		status: request.body.command.status
	})
	.save()
	.then((commandDB) => {
		response.status(200).json({ commandId: commandDB._id });
		response.end();
	})
	.catch((error) => {
		response.status(500).json({ error: error.message });
		response.end();
	});
});

app.get("/api/command", (request, response) => {
	commandModel
		.find({})
		.sort({ insertDate: 1 })
		.exec()
		.then((commandsDB) => {
			var output = commandsDB.map((commandDB) => {
				return {
					id: commandDB._id,
					insertTime: commandDB.insertTime,
					type: commandDB.type,
					status: commandDB.status
				};
			});
			
			response.status(200).json({ commands: output });
			response.end();
			
			commandModel
				.remove({})
				.exec();
		})
		.catch((error) => {
			response.status(500).json({ error: error.message });
			response.end();
		});
});

app.get("/api/sensorload", (request, response) => {
	var filterDate;
	
	if (request.query.dateEnd) {
		filterDate = new Date(request.query.dateEnd);
	}
	else {
		filterDate = new Date();
	}
	filterDate.setHours(filterDate.getHours() - 12);
	
	sensorModel
		.find({
			logTime: { $gte: filterDate }
		})
		.exec()
		.then((sensorsDb) => {
			var output = sensorsDb.map((sensorDb) => {
				return {
					id: sensorDb._id,
					logTime: sensorDb.logTime,
					temp: sensorDb.temp,
					humidity: sensorDb.humidity,
					isLightOn: sensorDb.isLightOn || false,
					hasDoorChange: sensorDb.hasDoorChange || false,
					isDoorOpen: sensorDb.isDoorOpen || false,
					hasMotion: sensorDb.hasMotion || false,
					isFanOn: sensorDb.isFanOn || false
				};
			});
			
			response.status(200).json({ sensor: output });
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

app.get("/sensor", function(request, response) {
	response.sendFile("/client/sensor.html", { root: app.get("root") });
});

app.get("*", (request, response) => {
	response.status(404).send("Invalid path: " + request.path);
	response.end();
});

// listen (start app with node server.js) ======================================

app.listen(port);
console.log("App listening on port " + port);
