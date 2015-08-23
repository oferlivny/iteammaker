'use strict';

var playerApp = angular.module('players');

// Players controller
playerApp.controller('PlayersController', ['$scope', '$stateParams', 'Authentication', 'Players', '$modal', '$log', '$filter', 'TeamService', '$timeout',
	function ($scope, $stateParams, Authentication, Players, $modal, $log, $filter, TeamService, $timeout) {
        $scope.authentication = Authentication;

        // Find a list of Players
        var resource_players = Players.query( function () {
            console.log("Got " + resource_players.length);
            $scope.players = new Array();
            var p;
            var x = 0;
            resource_players.forEach( function(p) {
                //expect(p instanceof Player).toEqual(true); 
                var player = {
                    'player': p,
                    'team': x
                };
                x= 1-x;
                $scope.players.push(player);
            });
            console.log("Created " + $scope.players.length + " entries");
        });
        
        this.teams = {
            count: 2
        };

        this.nTeamsChanged = function () {
            $log.log('Changed to: ' + this.teams.count);
        };

        this.deletePlayer = function (selectedPlayer) {
            if (selectedPlayer) {
                $log.log('Deleting ' + selectedPlayer.name);
                var index = $scope.players.indexOf(selectedPlayer);
                $scope.players.splice(index, 1);
                $log.log('Deleting ' + index);
                selectedPlayer.$remove();
            } else {
                $log.log('Deleting 2 ' + $scope.player.name);
                this.player.$remove(function () {
                    // doing nothing.
                });
            }
        };


        this.openRunModalView = function (size, selectedNTeams, allPlayers) {
            console.log("# teams: " + selectedNTeams + " # players: " + allPlayers.length);
            TeamService.setData({
                'players': allPlayers,
                'nTeams': selectedNTeams
            });
            var modalInstance = $modal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'modules/players/views/create-teams.client.view.html',
                controller: function ($scope, $modalInstance, nTeams) {
                    $scope.ok = function () {
                        $log.log('save & close');
                        $modalInstance.close();
                    };
                    $scope.cancel = function () {
                        $log.log('cancel');
                        $modalInstance.dismiss('cancel');
                    };

                },
                size: size,
                resolve: {
                    nTeams: function () {
                        return selectedNTeams;
                    },
                    players: function () {
                        return allPlayers;
                    },
                }

            });

            modalInstance.result.then(function (selectedItem) {
                $scope.selected = selectedItem;
            }, function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };

        this.openAddModalView = function (size) {
            //            $log.info("Creating new player");
            var modalInstance = $modal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'modules/players/views/create-player.client.view.html',
                controller: function ($scope, $modalInstance) {
                    $scope.ok = function () {
                        $log.log('save & close');
                        $modalInstance.close();
                    };
                    $scope.cancel = function () {
                        $log.log('cancel');
                        $modalInstance.dismiss('cancel');
                    };

                },
                size: size
            });
            modalInstance.opened.then(function () {
                $timeout(function () {
                    //angular.element('Name').trigger('focus');
                });
            });
            modalInstance.result.then(function (selectedItem) {
                $scope.selected = selectedItem;
            }, function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };

        // open a modal window to update a player
        this.openEditModalView = function (size, selectedPlayer) {
            var modalInstance = $modal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'modules/players/views/edit-player.client.view.html',
                controller: function ($scope, $modalInstance, player) {
                    $scope.player = player;
                    $scope.ok = function () {
                        $log.log('update & close');
                        $modalInstance.close($scope.player);
                    };
                    $scope.cancel = function () {
                        $log.log('cancel');
                        $modalInstance.dismiss('cancel');
                    };

                },
                size: size,
                resolve: {
                    player: function () {
                        return selectedPlayer;
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                $scope.selected = selectedItem;
            }, function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };
    }]);


playerApp.controller('PlayersUpdateController', ['$scope', 'Players', 'Notify',
	function ($scope, Players, Notify) {
        // Update existing Player
        this.update = function (updatedPlayer) {
            var player = updatedPlayer;
            player.$update(function () {
                //    $location.path('players/' + player._id);
            }, function (errorResponse) {
                console.warn('Update not ok!');
                Notify.sendMsg('ReloadPlayers', {
                    'id': errorResponse._id
                });
                $scope.error = errorResponse.data.message;
            });
        };
    }]);

playerApp.controller('PlayersCreateController', ['$scope', 'Players', 'Notify', 'Focus',
	function ($scope, Players, Notify, Focus) {

        var player = {
            player: new Players({
                name: '',
                rank: ''
            }),
            team: 0
        };
        $scope.player = player;

        var defaultErrCallback = function (errorResponse) {
            console.warn('Update not ok!');
            $scope.error = errorResponse.data.message;
        };
        this.savePlayer = function (doneCallback, errorCallback) {
            $scope.player.player.$save(doneCallback, errorCallback);
        }


        this.createAndReload = function () {
            this.savePlayer(function (response) {
                Notify.sendMsg('ReloadPlayers', {
                    'id': response._id
                });
            }, defaultErrCallback);
        };
        this.createAndClear = function () {
            this.savePlayer(function (response) {
                var player = {
                    player: new Players({
                        name: '',
                        rank: ''
                    }),
                    team: 0
                };
                $scope.player = player;
                Notify.sendMsg('ReloadPlayers', {
                    'id': response._id
                });

                Focus('name');
            }, defaultErrCallback);
        };

    }]);

playerApp.directive('playersList', ['Players', 'Notify', function (Players, Notify) {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: 'modules/players/views/players-list-template.html',
        link: function (scope, element, attrs) {
            Notify.getMsg('ReloadPlayers', function (event, data) {
                scope.playersCtrl.players = Players.query();
            });
        }
    };
}]);

playerApp.directive('focusMe', function ($timeout, $parse) {
    return {
        //scope: true,   // optionally create a child scope
        link: function (scope, element, attrs) {
            var model = $parse(attrs.focusMe);
            scope.$watch(model, function (value) {
                console.log('value=', value);
                if (value === true) {
                    $timeout(function () {
                        element[0].focus();
                    });
                }
            });
            //      // to address @blesh's comment, set attribute value to 'false'
            //      // on blur event:
            //      element.bind('blur', function() {
            //         console.log('blur');
            //         scope.$apply(model.assign(scope, false));
            //      });
        }
    };
});

playerApp.controller('CreateTeamsController', ['$scope', 'Players', 'Notify', 'TeamService',
	function ($scope, Players, Notify, TeamService) {
        var data = TeamService.getData();
        this.players = data.players;
        this.nTeams = data.nTeams;
        this.teams = TeamService.createTeams(this.nTeams, this.players);

    }
                                            ]);
//
//        // Create new Player
//        $scope.create = function () {
//            // Create new Player object
//            var player = new Players({
//                name: this.name,
//                rank: this.rank
//            });
//
//            // Redirect after save
//            player.$save(function (response) {
//                $location.path('players/' + response._id);
//
//                // Clear form fields
//                $scope.name = '';
//                $scope.rank = '';
//
//            }, function (errorResponse) {
//                $scope.error = errorResponse.data.message;
//            });
//        };
//
//        // Remove existing Player
//        $scope.remove = function (player) {
//            if (player) {
//                player.$remove();
//
//                for (var i in $scope.players) {
//                    if ($scope.players[i] === player) {
//                        $scope.players.splice(i, 1);
//                    }
//                }
//            } else {
//                $scope.player.$remove(function () {
//                    $location.path('players');
//                });
//            }
//        };
//
//
//        // Find existing Player
//        $scope.findOne = function () {
//            $scope.player = Players.get({
//                playerId: $stateParams.playerId
//            });
//        };
//	}
//]);