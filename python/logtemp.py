import serial
import glob
import time
import datetime
import requests
import json

port = glob.glob("/dev/ttyUSB*")[0]
arduino = serial.Serial(port, 9600)

while True:
	data = json.loads(arduino.readline())
	data["logTime"] = datetime.datetime.today().strftime("%Y-%m-%d %H:%M:%S")
	requests.post("http://huntingtonbeach.beynum.com:8081/api/savesensor", json = { "sensor": data })
