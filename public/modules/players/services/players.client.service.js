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


    // naive splitting
    var createTeamsNaive = function (nTeams, players) {
        // team container
        var teams = new Array(nTeams);
        // running team index
        var teamidx = 0;
        var i = 0;
        
        for (i = 0; i < nTeams; i++) {
            teams[i] = {
                'players': [],
                'name': i
            };
        }
//        console.log('Got ' + players.length + ' players for ' + nTeams + ' teams');
        for (i = 0; i < players.length; i++) {
            teams[teamidx].players.push(players[i]);
//            console.log('Player ' + players[i].name + ' to team ' + teamidx);
            teamidx++;
            if (teamidx === nTeams) {
                teamidx = 0;
            }
        }

        return teams;
    };

    // naive splitting
    var createTeamsSimple = function (nTeams, players) {
        // team container
        var teams = new Array(nTeams);
        // running team index
        var teamidx = 0;
        // choose direction ( 1 up, -1 down )
        var direction = 1;
        
        var i = 0;
        
        for (i = 0; i < nTeams; i++) {
            teams[i] = {
                'players': [],
                'name': i
            };
        }
//        console.log('Got ' + players.length + ' players for ' + nTeams + ' teams');
        players.sort(function (a, b) {
            return a.rank - b.rank;
        });
        for (i = 0; i < players.length; i++) {
            console.log('Player ' + players[i].name + ' out of ' + players[i].length + ' to team ' + teamidx + ' out of ' + teams.length + ' ' + nTeams);
            teams[teamidx].players.push(players[i]);
            teamidx = teamidx + direction;
            if (teamidx == nTeams) {
                teamidx--;
                direction = -1;
            }
            if (teamidx === -1) {
                teamidx++;
                direction = 1;
            }
            console.log('next team' + teamidx + ' direction ' + direction);

        }

        return teams;
    };

    var getTeamsWithRankRange = function (config) {
        var team = {
            players: [],
            rankTotal: 0
        };
        var genTeam = function (firstPlayer, current, allTeams, config) {
            //            console.log('gen team: start from ' + firstPlayer + 
            //                        ' playersPerTeam = ' + playersPerTeam +
            //                        ' current size = ' + current.length +
            //                        ' # teams = ' + allTeams.length );
            if (current.players.length === config.playersPerTeam) {
                if (current.rankTotal > config.low && current.rankTotal < config.high) {
                    allTeams.push(current.players);
                }
                //                else {
                //                    console.log('Not adding team: ' + current.rankTotal + ' not inside ' + config.low + ' - ' + config.high);
                //                    return;
                //                }
            }

            for (var i = firstPlayer; i < config.players.length; i++) {
                var player = config.players[i];
                genTeam(
                    // new firstPlayer
                    i + 1,
                    // add to current team
                    {
                        players: current.players.concat(player),
                        rankTotal: current.rankTotal + player.player.rank
                    },
                    // final team container
                    allTeams,
                    // static data
                    config
                );
            }
            return;
        };

        var allTeams = [];
        genTeam(0, team, allTeams, config);
        console.log('Got ' + allTeams.length + ' teams');
        return allTeams;
    };
    var genTeams = function (config, currentTeams, bestTeams) {
        if (config.players.length === 0) {
            if (bestTeams.totalRank < currentTeams.totalRank) {
                console.log('Found better with rank ' + currentTeams.totalRank);
                bestTeams = currentTeams;
            }
            return;
        }
        var allRelevantTeams = getTeamsWithRankRange(config);
        //        for (var i = 0; i < allRelevantTeams.length; i++) {
        //                genTeams(
        //                    // static data
        //                    config, 
        //                    // new data
        //                    {currentTeams.teams.concat(allRelevantTeams[i]),
        //            remaining = myArray.filter( function( el ) {
        return; // toRemove.indexOf(el) < 0;
    };



    var createTeamsBinCompletion = function (nTeams, players) {
        //https://www.jair.org/media/2106/live-2106-3172-jair.pdf

        // team container
        var teams = new Array(nTeams);
        // running team index
        var teamidx = 0;
        // choose direction ( 1 up, -1 down )
        var direction = 1;

        var i = 0;
        for (i = 0; i < nTeams; i++) {
            teams[i] = {
                'players': [],
                'name': i
            };
        }
        players.sort(function (a, b) {
            return a.rank - b.rank;
        });

        // calculate sum of ranks
        var rankSum = players.map(function (o) {
                return o.rank;
            }).reduce(function (a, b) {
                return a + b;
            });
            // optimal team rank
        var rankTeamOptim = rankSum / nTeams;
        var lowHighRatio = 0.3;
        var rankTeamRange = rankTeamOptim * lowHighRatio;
        var playersPerTeam = players.length / nTeams;
        console.log('Got ' + players.length + ' players for ' + nTeams + ' teams' + ' rank sum: ' + rankSum + ' rank team optimal: ' + rankTeamOptim);
        var low = rankTeamOptim - rankTeamRange;
        var high = rankTeamOptim + rankTeamRange;
        console.log('low: ' + low);
        console.log('high: ' + high);
        var config = {
            'playersPerTeam': playersPerTeam,
            'low': low,
            'high': high,
            'players': players
        };

        var finalTeams = genTeams(config);
        for (i = 0; i < players.length; i++) {
            teams[teamidx].players.push(players[i]);
            console.log('Player ' + players[i].name + ' to team ' + teamidx);
            teamidx = teamidx + direction;
            if (teamidx === nTeams) {
                teamidx--;
                direction = -1;
            }
            if (teamidx === -1) {
                teamidx++;
                direction = 1;
            }
        }

        return teams;
    };
    
    return {
        setData: setData,
        getData: getData,
        //createTeams: createTeamsBinCompletion
        createTeams: createTeamsSimple //createTeamsNaive
    };

});