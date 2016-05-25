var myApp = angular.module('app', []);
/*\\\create application\\\\\\create application\\\\\\create application\\\*/

myApp.value('urlConfigPath', 'api/v1/config');
/*\\\const for path to config\\\const for path to config\\\*/

myApp.value('urlIdPath', 'api/v1/points');
/*\\\const for common path to points\\\const for common path to points\\\*/

myApp.value('serverObjConf', {});
/*\\\ copy of the server's config object\\\*/

myApp.factory('toConfigureCanvas', function () {
  return function (canvas) {

    var angElem = angular.element(canvas);
    angElem.css({
      'border-color': '#ff4500'
    });
    angElem.prop({
      'width': '350',
      'height': '250'
    });

    return angElem;
  }
});
/*\\\sets up Canvas' width, height and border-color \\\*/

myApp.factory('toGetData', function ($http, $q) {
  return function (url, nameOfUrl) {

    var deferred = $q.defer();
    var respObject = {};
    respObject.nameOfUrl = nameOfUrl;

    $http.get(url)
      .then(
      function (response) {
        //положительный ответ
        respObject.data = response.data;
        deferred.resolve(respObject);
      },
      function (response) {
        //отрицательный ответ
        if (response.data) {
          responseMsg = response.data.error;
        } else {
          responseMsg = "server is down"
        }

        respObject.notice = response.status + " " + responseMsg;
        deferred.reject(respObject);
      });

    return deferred.promise;
  }
});
/*\\\ to make get request and return results (data and name of request)\\\*/

myApp.factory('toFormUrlsById', function ($location, urlIdPath) {
  return function (numberUrlsId) {
    var urlsId = {};
    var absUrl = $location.absUrl();

    for (var i = 1; i <= numberUrlsId; i++) {
      urlsId[i] = absUrl + urlIdPath + "/" + i;
    }
    return urlsId;
  }
});
/*\\\return list of urls, used by Get requests in the future\\\*/

myApp.factory('toDrawGraph', function () {
  return function (canvas, points, minValue, maxValue, numberPoints, color, thickness) {

    //var thickness = parseInt(thickness);
    /*var color = isColor(color);*/

    var canvasHeight = canvas.height;
    var canvasWidth = canvas.width;
    var canvasCentralLine = canvasHeight / 2;
    var step = Math.floor(canvasWidth / (numberPoints));
    var ctx = canvas.getContext('2d');
    var intervalX = 0;

    ctx.beginPath();
    ctx.lineWidth = parseInt(thickness);
    ctx.strokeStyle = color;

    for (var indexNumber = 0; indexNumber < numberPoints; indexNumber++) {
      if (indexNumber === 0) {
        ctx.moveTo(0, canvasCentralLine - points[0]);
      }
      else {
        intervalX = intervalX + step;
        ctx.lineTo(intervalX, canvasCentralLine - points[indexNumber]);
      }
    }
    ctx.stroke();
    return true;

  }
});
/*\\\ this function draws the graph on canvas element\\\*/

myApp.factory('isColor', function () {
  return function (color) {
    var flag = true;
    if (color === undefined) {
      return false;
    }
    var colorLength = color.length;
    if (colorLength == 6) {
      var i = 0;
      for (i; i < colorLength; i++) {
        if ((isNaN(parseInt(color.charAt(i), 16)))) {
          flag = false;
          break;
        }
      }
    } else {
      flag = false;
    }
    return flag;
  }
});
/*\\\ check if string may be used as a HEX color\\\*/

myApp.factory('toGetAllPoints', function (toGetData, $q) {
  return function (urlsId) {
    var urlsId = urlsId;
    var massOfPromisesGet = [];
    for (var key in urlsId) {
      massOfPromisesGet.push(toGetData(urlsId[key], key));
    }
    return $q.all(massOfPromisesGet);
  }
});
/*\\\ make all get requests and return all promises in responses\\\*/

myApp.factory('trim', function () {
  return function (str, charlist) {
    charlist = !charlist ? ' \\s\xA0' : charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '\$1');
    var re = new RegExp('^[' + charlist + ']+|[' + charlist + ']+$', 'g');
    return str.replace(re, '');
  }
});
/*\\\ trim spaces and other symbols in the begining and ending of a string\\\*/

myApp.filter('choosePoints', function (trim) {
  return function (arrPoints, strFilter) {
    var resultPoints = [];
    if ((typeof(strFilter) !== "string") || strFilter == '') {
      return arrPoints;
    } else {
      strFilter = trim(strFilter).split(',');
      for (var key in  arrPoints) {
        for (var keyInner in strFilter) {
          if (arrPoints[key].nameOfUrl == strFilter[keyInner]) {
            resultPoints.push(arrPoints[key]);
            continue;
          }
        }
      }

    }
    return resultPoints;
  }
});
/*\\\ make possible to choose certain points for drawing graph\\\*/


myApp.controller('globalController', function ($scope,
                                               toGetData,
                                               $location,
                                               urlConfigPath,
                                               urlIdPath,
                                               toFormUrlsById,
                                               toConfigureCanvas,
                                               serverObjConf,
                                               $q,
                                               toGetAllPoints,
                                               toDrawGraph,
                                               isColor) {

  $scope.client = {};
  /*---------------------------------------------------------------*/

  /*\\\to make the completed graph\\\to make the completed graph\\\*/
  $scope.client.toDoGraph = function (nameOfUrl, points) {

    var canvas = document.getElementById('canvas' + nameOfUrl);
    toConfigureCanvas(canvas);
    var points = points;
    var minValue = serverObjConf.POINTS.MIN;
    var maxValue = serverObjConf.POINTS.MAX;
    var numberPoints = serverObjConf.POINTS.QTY;
    var color;
    var thickness;

    color = $scope.client.color;

    if ((color != '') && isColor(color)) {
      color = "#" + color;
    } else {
      color = "#000000";
    }

    thickness = $scope.client.thickness;

    toDrawGraph(canvas, points, minValue, maxValue, numberPoints,
      color, thickness);
  };
  /*\\\END making completed graph\\END making completed graph\\*/

  /*---------------------------------------------------------------*/

  /*\\\ controls (start and stop) to send get requests\\\\\\\\\\\\\\\\\\\\\\*/
  var timer;

  $scope.client.stopTimer = function () {
    clearTimeout(timer);
  };

  $scope.client.startTimer = function () {
    $scope.client.toGetPoints();
  };

  /*\\\END controls (start and stop) to send get requests\\\\\\\\\\\\\\\\\\\*/

  /*---------------------------------------------------------------*/

  var absUrl = $location.absUrl();
  toGetData(absUrl + urlConfigPath, 'serverConfig')
    /*\\\ get request for config file from server\\\*/
    .then(
    function (response) {
      //положительный ответ (пришел конфигурационный файл с настройками)
      var numberUrlsId = response.data.NUMBER_MASS_POINT;
      var urlsId = toFormUrlsById(numberUrlsId);
      serverObjConf = angular.copy(response.data); //to copy server config
      return urlsId; // urlsId is the array of points' urls
    },
    function (response) {
      //отрицательный ответ
      $scope.client.notice = response.notice;
      return;
    })


    .then(
    function (response) {
      // response is the array of points' urls
      //положительный ответ (пришел объект с UrlsId для Get запросов)

      var timeRenew = serverObjConf.POINTS.UPDATE_INTERVAL;
      var urlsId = response;

      /*\\\ return the points from the All serverArrays\\\*/
      $scope.client.toGetPoints = function () {
        toGetAllPoints(urlsId)
          .then(
          function (points) {
            $scope.client.points = points;
          },
          function (response) {
            //отрицательный ответ
            if (response.data) {
              responseMsg = response.data.error;
            } else {
              responseMsg = "server is down"
            }
            $scope.client.notice = response.status + " " + responseMsg;
            clearTimeout(timer);
            return;
          });

        timer = setTimeout($scope.client.toGetPoints, timeRenew);
      };
      /*\\\ END return the points from the All serverArrays\\\*/

      $scope.client.toGetPoints();

    },
    function (response) {
      //отрицательный ответ
      $scope.client.notice = response.notice;
      return;
    })

});

















