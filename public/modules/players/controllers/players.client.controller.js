'use strict';

var playerApp = angular.module('players');

// Players controller
playerApp.controller('PlayersController', ['$scope', '$stateParams', 'Authentication', 'Players', '$modal', '$log', '$filter',
	function ($scope, $stateParams, Authentication, Players, $modal, $log, $filter) {
        $scope.authentication = Authentication;

        // Find a list of Players
        this.players = Players.query();

        this.deletePlayer = function (selectedPlayer) {
            if (selectedPlayer) {
                $log.log("Deleting " + selectedPlayer.name);
                var index = this.players.indexOf(selectedPlayer);
                this.players.splice(index, 1);
                $log.log("Deleting " + index);

                //                this.players = $filter('filter')($scope.players, {
                //                    id: '!selectedPlayer.id'
                //                });
                selectedPlayer.$remove();
                // $scope.$apply();
            } else {
                $log.log("Deleting 2 " + $scope.player.name);
                this.player.$remove(function () {
                    // doing nothing.
                });
            }
        }

        this.openAddModalView = function (size) {
            //            $log.info("Creating new player");
            var modalInstance = $modal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'modules/players/views/create-player.client.view.html',
                controller: function ($scope, $modalInstance) {
                    $scope.ok = function () {
                        $log.log("save & close");
                        $modalInstance.close();
                    };
                    $scope.cancel = function () {
                        $log.log("cancel");
                        $modalInstance.dismiss('cancel');
                    };

                },
                size: size,
            });

            modalInstance.result.then(function (selectedItem) {
                $scope.selected = selectedItem;
            }, function () {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };

        // open a modal window to update a player
        this.openModalView = function (size, selectedPlayer) {
            $log.info("Opening " + selectedPlayer.name);

            var modalInstance = $modal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'modules/players/views/edit-player.client.view.html',
                controller: function ($scope, $modalInstance, player) {
                    $scope.player = player;
                    $scope.ok = function () {
                        $log.log("update & close");
                        $modalInstance.close($scope.player);
                    };
                    $scope.cancel = function () {
                        $log.log("cancel");
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
            console.warn("Update!");

            player.$update(function () {
                //    $location.path('players/' + player._id);
            }, function (errorResponse) {
                console.warn("Update not ok!");
                Notify.sendMsg('ReloadPlayers', { 'id': errorResponse._id });
                $scope.error = errorResponse.data.message;
            });
        };
    }]);

playerApp.controller('PlayersCreateController', ['$scope', 'Players', 'Notify',
	function ($scope, Players, Notify) {
        this.player = new Players({
            name: "",
            rank: ""
        });



        this.create = function () {
            console.warn("creating " + this.player.name + " " + this.player.rank);

            this.player.$save(function (response) {
                console.log("Save ok ");
                Notify.sendMsg('ReloadPlayers', { 'id': response._id });
            }, function (errorResponse) {
                console.warn("Update not ok!");
                $scope.error = errorResponse.data.message;
            });
        };
     }
]);

playerApp.directive('playersList', ['Players', 'Notify', function(Players, Notify) {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: 'modules/players/views/players-list-template.html',
        link: function(scope, element, attrs) {
            Notify.getMsg('ReloadPlayers', function(event,data) {
                scope.playersCtrl.players = Players.query();
            });
        }
    }}] );
//
//playerApp.controller('PlayersController3', ['$scope', '$stateParams', '$location', 'Authentication', 'Players',
//	function ($scope, $stateParams, $location, Authentication, Players) {
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