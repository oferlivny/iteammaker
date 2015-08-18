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
        }
        return notify;
        }
    ])

.service('TeamService', function () {
    var players = [];

    var setPlayers = function (newObj) {
        players = newObj;
    };

    var getPlayers = function () {
        return players;
    };

    return {
        setPlayers: setPlayers,
        getPlayers: getPlayers
    };

});;