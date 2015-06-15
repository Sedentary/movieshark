;(function ($) {

    'use strict';

    var deleteBeer = (function () {

        var _eventClick = function () {
            $('.delete').on('click', function (e) {
                e.preventDefault();
                _delete(this, this.dataset.id);
            });
        };

        var _delete = function (element, id) {
            var urlAjax = '/beer/' + id;
            $.ajax({
                url: urlAjax,
                type: 'DELETE',
                success: function (data) {
                  alert('Successfully removed');
                  $(element).parents('tr').hide();
                },
                error: function () {
                  alert('Oops... Please try again.');
                }
            });
        };

        return {
            init : function () {
                _eventClick();
            }
        }

    })();

    deleteBeer.init();

})(jQuery)
