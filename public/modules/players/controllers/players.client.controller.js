'use strict';

var playerApp = angular.module('players');

// Players controller
playerApp.controller('PlayersController', ['$scope', '$stateParams', 'Authentication', 'Players', '$modal', '$log',
	function ($scope, $stateParams, Authentication, Players, $modal, $log) {
        $scope.authentication = Authentication;

        // Find a list of Players
        this.players = Players.query();

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


playerApp.controller('PlayersUpdateController', ['$scope', '$stateParams', '$location', 'Authentication', 'Players',
	function ($scope, $stateParams, $location, Authentication, Players) {
        // Update existing Player
        this.update = function (updatedPlayer) {
            var player = updatedPlayer;
            console.warn("Update!");

            player.$update(function () {
            //    $location.path('players/' + player._id);
            }, function (errorResponse) {
                console.warn("Update not ok!");

                $scope.error = errorResponse.data.message;
            });
        };
    }]);

//playerApp.controller('PlayersController2', ['$scope', '$stateParams', '$location', 'Authentication', 'Players',
//	function ($scope, $stateParams, $location, Authentication, Players) {}]);
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