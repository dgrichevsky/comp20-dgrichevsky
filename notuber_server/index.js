var express = require('express');

var bodyParser = require('body-parser');
var validator = require('validator');
var app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', (process.env.PORT || 5000));

app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
});

var mongoUri = process.env.MONGODB_URI || process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/node-js-getting-started';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
        db = databaseConnection;
});

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

//curl --data "username=JANET&lng=55.5&lat=60" http://localhost:5000/submit
app.post('/submit', function(request, response) {
        var username = request.body.username;
        var lat = parseFloat(request.body.lat);
        var lng = parseFloat(request.body.lng);
        var created_at = new Date();

        if(!checkArguments(username, lat, lng)) {
                if(isVehicle(username)) {
                        var vehicle = {"username": username, "lat" : lat, "lng" : lng, "created_at": created_at};

                        addToDB(db.collection('vehicles'), vehicle);
                        getData(db.collection('passengers'), function(err, data){
                                if (err) {
                                        console.log(err);
                                } else {
                                        //console.log(data);
                                        response.send({"passengers":data});
                                }
                        });
                } else {
                        var passenger = {"username": username, "lat" : lat, "lng" : lng, "created_at": created_at};
                        addToDB(db.collection('passengers'), passenger);
                        getData(db.collection('vehicles'), function(err, data){
                                if (err) {
                                        console.log(err);
                                } else {
                                        //console.log(data);
                                        response.send({"vehicles":data});
                                }
                        });
                }

        } else {
                response.send({"error":"Whoops, something is wrong with your data!"});
        }
});

app.get('/vehicle.json', function(request, response) {
        db.collection('vehicles', function(er, collection) {
                collection.find().toArray(function(err, cursor) {
                        if (!err) {
                                var username = request.query.username;
                                var flag = false;
                                for (var count = 0; count < cursor.length; count++) {
                                        var vehicleMatch = cursor[count];
                                        if(username === vehicleMatch.username) {
                                                flag = true;
                                                response.send(vehicleMatch);
                                        }
                                }
                                if(!flag) {
                                        response.send({});
                                }
                        } else {
                                response.send({});
                        }
                });
        });
});

app.get('/', function (request, response) {
        response.set('Content-Type', 'text/html');
        var indexPage = '';
        db.collection('passengers', function(er, collection) {
                collection.find().toArray(function(err, cursor) {
                        if (!err) {
                                for (var count = cursor.length -1; count >= 0; count--) {
                                        indexPage += "<p>" + cursor[count].username + " requested a vehicle at " + cursor[count].lat +", " +  cursor[count].lng + " on " + cursor[count].created_at +"</p>";
                                }
                                indexPage += "</body></html>"
                                response.send(indexPage);
                        } else {
                                response.send('<!DOCTYPE HTML><html><head><title>Oops, something went wrong!</title></head></html>');
                        }
                });
        });
});


function checkArguments(username, lat, lng) {
        return (!username || 0 === username.length || !lat || !lng);
}

function isVehicle(response) {
        var vehicles = ['JANET','ilFrXqLz', 't4wcLoCT', 'WnVPdTjF', '1fH5MXna', '4aTtB30R', '8CXROgIF', 'w8XMS577', 'ZywrOTLJ', 'cQRzspF5', 'GSXHB9L1', 'TztAkR2g', 'aSOqNo4S', 'ImjNJW4n', 'svEQIneI', 'N10SCqi5', 'QQjjwwH2', 'H0pfmYGr', 'FyUHoAvS', 'bgULOMsX', 'OlOBzZF8', 'Ln7b7ODx', 'ZoxN11Sa', 'itShXf78', 'o6kJKzyI', 'pD0kGOax', 'njr1i7xM', 'wtDRzig8', 'l2r8bViT', 'oZn3b2OZ', 'ym2J1vil'];

        for(var key in vehicles) {
                if(response === vehicles[key]) {
                        return true;
                }
        }
        return false;
}

var getData = function(collection, cb) {
        var currentDate = new Date();
        var newDateObj = new Date(currentDate.getTime() - 5*60000);

        collection.find({created_at : { $gte: newDateObj, $lt: currentDate } }).toArray(cb);
}

function addToDB(collection, data) {
        collection.update(
                { username: data.username },
                {
                        $set: {
                                lat : data.lat,
                                lng: data.lng,
                                created_at: data.created_at
                        }
                }, { upsert: true }
        );
}

app.listen(app.get('port'), function() {
        console.log('Node app is running on port', app.get('port'));
});
