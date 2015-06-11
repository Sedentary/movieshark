'use strict';

angular.module('movieshark.version', [
  'movieshark.version.interpolate-filter',
  'movieshark.version.version-directive'
])

.value('version', '0.1');
