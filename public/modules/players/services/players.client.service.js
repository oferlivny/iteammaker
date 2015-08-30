'use strict';

angular.module('players')

//Players service used to communicate Players REST endpoints
.factory('Players', ['$resource',
        function ($resource) {
        return $resource('players/:playerId', {
            playerId: '@_id'
        }, {
            update: {
                method: 'PUT'
            }
        });
        }
    ])

//Players service used to communicate Players REST endpoints
.factory('Notify', ['$rootScope',
        function ($rootScope) {
        var notify = {};

        notify.sendMsg = function (msg, data) {
            data = data || {};
            $rootScope.$emit(msg, data);

            console.log('message sent!');
        };

        notify.getMsg = function (msg, func, scope) {
            var unbind = $rootScope.$on(msg, func);

            if (scope) {
                scope.$on('destroy', unbind);
            }
        };
        return notify;
        }
    ])

.factory('Focus', function($timeout, $window) {
    return function(id) {
      // timeout makes sure that it is invoked after any other event has been triggered.
      // e.g. click events that need to run before the focus or
      // inputs elements that are in a disabled state but are enabled when those events
      // are triggered.
      $timeout(function() {
//          console.log("Focusing");
        var element = $window.document.getElementById(id);
        if(element)
          element.focus();
      });
    };
  })


.service('TeamService', function () {
    var data = [];

    var setData = function (newObj) {
        data = newObj;
    };

    var getData = function () {
        return data;
    };



    return {
        setData: setData,
        getData: getData,
    };

});