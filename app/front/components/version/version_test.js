'use strict';

describe('movieshark.version module', function() {
  beforeEach(module('movieshark.version'));

  describe('version service', function() {
    it('should return current version', inject(function(version) {
      expect(version).toEqual('0.1');
    }));
  });
});
