'use strict';


angular.module('core').controller('HomeController', ['$scope', 'Authentication',
	function ($scope, Authentication) {
        // This provides Authentication context.
        $scope.authentication = Authentication;

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