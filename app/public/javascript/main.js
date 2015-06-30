;(function (window, document, undefined) {

  'use strict';

  var main = (function () {

    var _headerBoxShadow = function () {
      var body = document.querySelector('body');
      var navbar = document.querySelector('.navbar');
      var clazz = 'navbar-box';

      window.addEventListener('scroll', function () {
        if (body.getBoundingClientRect().top < -75) {
          navbar.classList.remove(clazz);
        } else if (!navbar.classList.contains(clazz)) {
          navbar.classList.add(clazz);
        }
      });
    };

    var _setActionSearch = function () {
      var pathname = window.location.pathname;
      var role = '/search';
      var action = pathname === '/' ? role : pathname.replace(role, '') + role;
      document.querySelector('.navbar-form').setAttribute('action', action);
    }

    return {

      init : function () {
        _headerBoxShadow();
        _setActionSearch();
      }

    }

  })();

  main.init();

})(window, document);