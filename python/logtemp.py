import serial
import glob
import time
import datetime
import requests
import json

# Arduino command mapping
#	Fan
#		1 = fan on
#		2 = fan off

port = glob.glob("/dev/ttyUSB*")[0]
arduino = serial.Serial(port, 9600)

while True:
	if arduino.in_waiting > 0:
		data = json.loads(arduino.readline())
		data["logTime"] = datetime.datetime.today().strftime("%Y-%m-%d %H:%M:%S")
		requests.post("http://huntingtonbeach.beynum.com:8081/api/savesensor", json = { "sensor": data })

	response = requests.get("http://huntingtonbeach.beynum.com:8081/api")

	if response:
		commands = response.json()["commands"]
		commandTypes = []

		# Get the last status if there are multiple statuses for each type
		for command in commands:
			if any(commandType["type"] == command["type"] for commandType in commandTypes):
				commandType = next(commandType for commandType in commandTypes if commandType["type"] == command["type"])
				commandType["status"] = command["status"]
			else:
				commandTypes.append({ "type": command["type"], "status": command["status"] })

		for commandType in commandTypes:

			if commandType["type"] == "fan":
				if commandType["status"]:
					arduino.write(str.encode("1"))
				else:
					arduino.write(str.encode("2"))

	time.sleep(1)