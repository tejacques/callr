#!/bin/bash

cp src/CallR/Scripts/callr.js lib/nuget/CallR.JS/
cp src/CallR/Scripts/callr.min.js lib/nuget/CallR.JS/
cp src/CallR/Scripts/callr.min.js.map lib/nuget/CallR.JS/

cp src/CallR/Scripts/callr.angular.js lib/nuget/CallR.Angular/
cp src/CallR/Scripts/callr.angular.min.js lib/nuget/CallR.Angular/
cp src/CallR/Scripts/callr.angular.min.js.map lib/nuget/CallR.Angular/

cp src/CallR/bin/Release/CallR.dll lib/nuget/CallR/
cp src/CallR/bin/Release/CallR.pdb lib/nuget/CallR/
#cp src/CallR/bin/Release/CallR.xml lib/nuget/CallR/


cp src/CallR/Scripts/jquery.signalR-2.0.1.js lib/bower/
cp src/CallR/Scripts/jquery.signalR-2.0.1.min.js lib/bower/
cp src/CallR/Scripts/jquery.signalR-2.0.1.min.js.map lib/bower/

cp src/CallR/Scripts/callr.js lib/bower/
cp src/CallR/Scripts/callr.min.js lib/bower/
cp src/CallR/Scripts/callr.min.js.map lib/bower/

cp src/CallR/Scripts/callr.angular.js lib/bower/
cp src/CallR/Scripts/callr.angular.min.js lib/bower/
cp src/CallR/Scripts/callr.angular.min.js.map lib/bower/
