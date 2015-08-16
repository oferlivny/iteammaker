'use strict';


angular.module('core').controller('HomeController', ['$scope', 'Authentication',
	function ($scope, Authentication) {
        // This provides Authentication context.
        $scope.authentication = Authentication;
        
        $scope.addPlayerVisible = false;
        $scope.newPlayer = {
            name: "temp",
            rank: "tempi"
        }
        $scope.addNewPlayer = function () {
            console.log("Want to add new player: " + $scope.newPlayer.name + " " + $scope.newPlayer.rank);
            $scope.players.push({name: $scope.newPlayer.name , rank: $scope.newPlayer.rank});
        }
		$scope.showAddPlayer = function() {
            $scope.addPlayerVisible = ! $scope.addPlayerVisible;
            console.error("showAddPlayer");
            console.log("New player: " + $scope.newPlayer.name + " " + $scope.newPlayer.rank);
        };

        $scope.players = [
            {
                name: "1",
                rank: 1
            },
            {
                name: "2",
                rank: 2
            },
            {
                name: "3",
                rank: 3
            },
            {
                name: "4",
                rank: 4
            },
            {
                name: "5",
                rank: 5
            }
            ];

	}
                                                     
]);