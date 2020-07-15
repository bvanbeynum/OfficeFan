import serial
import glob
import time
import datetime
import pymongo
import json

port = glob.glob("/dev/ttyUSB*")[0]
arduino = serial.Serial(port, 9600)
dbClient = pymongo.MongoClient("mongodb://officedb:L00ger@172.17.0.2:27017/?authSource=officedb")
db = dbClient["officedb"]

while True:
    data = json.loads(arduino.readline())
    data["logTime"] = datetime.datetime.today().strftime("%Y-%m-%d %H:%M:%S")
    db["templog"].insert_one(data)
    time.sleep(60)
