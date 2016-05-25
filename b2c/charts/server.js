var express = require('express');
var app = express();
var NUMBER_MASS_POINT = 5;

var CONFIG = {
  POINTS: {
    QTY: 100,					// number of points
    MIN: -100,					// minimum value of a point
    MAX: 100,					// maximum value of a point
    UPDATE_INTERVAL: 1000			// interval between points update (ms)
  },
  NUMBER_MASS_POINT: 11
};

var points = {};

function getRandom(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function initPoints() {
  var i = 1;

  for (i; i <= CONFIG.NUMBER_MASS_POINT; i++) {
    points[i] = [];
    for (var pointIndex = 0; pointIndex < CONFIG.POINTS.QTY; pointIndex++) {
      points[i][pointIndex] = getRandom(CONFIG.POINTS.MIN, CONFIG.POINTS.MAX);
    }
  }

}

function updatePoints() {

  for (var key in points) {
    pointsTemp = points[key];
    pointsTemp.shift();
    pointsTemp.push(getRandom(CONFIG.POINTS.MIN, CONFIG.POINTS.MAX));
  }

}

initPoints();
setInterval(updatePoints, CONFIG.POINTS.UPDATE_INTERVAL);

app.use(express.static('public'));

app.get('/api/v1/config', function (req, res) {
  res.json(CONFIG);
});

app.get('/api/v1/points/:id', function (req, res) {
  var reqId = req.params.id;
  if (points[reqId]) {
    res.json(points[reqId]);
  } else {
    res.send(404);
  }

});

app.listen(3000, function () {
  console.log('listening on port 3000');
});
