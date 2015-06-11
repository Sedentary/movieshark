'use strict';

angular.module('movieshark.dashboard', ['ngRoute', 'infinite-scroll'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/dashboard', {
    templateUrl: 'dashboard/dashboard.html',
    controller: 'DashboardCtrl'
  });
}])

.controller('DashboardCtrl', ['$scope', '$http', function ($scope, $http) {
  $scope.movies = [];
  $scope.currentOffset = 1;

  var updateMovies = function (newMovies) {
    $scope.movies = newMovies;
    $scope.currentOffset++;
  };

  //$.getJSON('http://anyorigin.com/dev/get?url=eztvapi.re/shows/' + $scope.currentOffset + '&callback=?', function (data) {
  //  updateMovies(data.contents);
  //});

  $http.get('http://localhost:3000/shows/' + $scope.currentOffset)
        .success(updateMovies);

  setInterval(function () { console.log($scope.movies) }, 2000);
}]);