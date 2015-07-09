;(function (window, document, undefined) {

  'use strict';

  var video = (function () {
    var _video;

    var SubtitleFontSizes = {
      SMALL: {name: 'Small', size: '1em'},
      MEDIUM: {name: 'Medium', size: '2em'},
      LARGE: {name: 'Large', size: '3em'},
      next: function (current) {
        if (current === SubtitleFontSizes.SMALL) {
          return SubtitleFontSizes.MEDIUM;
        } else if (current === SubtitleFontSizes.MEDIUM) {
          return SubtitleFontSizes.LARGE;
        } else {
          return SubtitleFontSizes.LARGE;
        }
      },
      previous: function (current) {
        if (current === SubtitleFontSizes.LARGE) {
          return SubtitleFontSizes.MEDIUM;
        } else if (current === SubtitleFontSizes.MEDIUM) {
          return SubtitleFontSizes.SMALL;
        } else {
          return SubtitleFontSizes.SMALL;
        }
      }
    };

    var _changeFontSize = function (current, up) {
      if (up) {
        videojs.SubtitleSize.fontSize = SubtitleFontSizes.next(current);
      } else {
        videojs.SubtitleSize.fontSize = SubtitleFontSizes.previous(current);
      }

      var vjsFullscreen = document.querySelector('.video-js.vjs-fullscreen');
      var vjsTextTrack = document.querySelector('.vjs-text-track');
      if (vjsFullscreen) {
        vjsFullscreen.style.fontSize = videojs.SubtitleSize.fontSize.size;
      }
      if (vjsTextTrack) {
        vjsTextTrack.style.fontSize = videojs.SubtitleSize.fontSize.size;
      }
    };

    var _addTrackSizeControl = function () {
      videojs.SubtitleSize = {
        Up: videojs.Button.extend({
          init: function (player, options) {
            videojs.Button.call(this, player, options);
            this.on('click', this.onClick);
          }
        }),
        Down: videojs.Button.extend({
          init: function (player, options) {
            videojs.Button.call(this, player, options);
            this.on('click', this.onClick);
          }
        }),
        fontSize: SubtitleFontSizes.MEDIUM
      };

      videojs.SubtitleSize.Up.prototype.onClick = function () {
        _changeFontSize(videojs.SubtitleSize.fontSize, true);
      };

      videojs.SubtitleSize.Down.prototype.onClick = function () {
        _changeFontSize(videojs.SubtitleSize.fontSize, false);
      };

      var createSubtitleSizeButton = function (className) {
        var props = {
          className: 'vjs-' + className + '-button vjs-menu-button vjs-control',
          innerHTML: '<div class="vjs-control-content"></div>',
          role: 'button',
          'aria-live': 'polite',
          tabIndex: 0
        };

        return videojs.Component.prototype.createEl(null, props);
      };

      var SubtitleUpSize;
      videojs.plugin('SubtitleUpSize', function() {
        var options = {
          'el': createSubtitleSizeButton('subupsize')
        };

        SubtitleUpSize = new videojs.SubtitleSize.Up(this, options);
        this.controlBar.el().appendChild(SubtitleUpSize.el());
      });

      var SubtitleDownSize;
      videojs.plugin('SubtitleDownSize', function() {
        var options = {
          'el': createSubtitleSizeButton('subdownsize')
        };

        SubtitleDownSize = new videojs.SubtitleSize.Down(this, options);
        this.controlBar.el().appendChild(SubtitleDownSize.el());
      });
    };

    var _setupControls = function () {
      _addTrackSizeControl();
    };

    var _setupVideo = function () {
      videojs.options.flash.swf = 'video-js.swf';
      _video = videojs('video', {
        plugins : {
          SubtitleUpSize: {},
          SubtitleDownSize : {}
        }
      });
    };

    return {

      init : function () {
        _setupVideo();
        _setupControls();
      }

    }

  })();

  video.init();

})(window, document);