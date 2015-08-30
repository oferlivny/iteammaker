'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    errorHandler = require('./errors.server.controller'),
    Player = mongoose.model('Player'),
    _ = require('lodash');

/**
 * Create a Player
 */
exports.create = function (req, res) {
    var player = new Player(req.body);
    player.user = req.user;

    player.save(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(player);
        }
    });
};

/**
 * Show the current Player
 */
exports.read = function (req, res) {
    res.jsonp(req.player);
};

/**
 * Update a Player
 */
exports.update = function (req, res) {
    var player = req.player;

    player = _.extend(player, req.body);

    player.save(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(player);
        }
    });
};

/**
 * Delete an Player
 */
exports.delete = function (req, res) {
    var player = req.player;

    player.remove(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(player);
        }
    });
};

var userGenereatesTeams = function (user) {
    var now = Date.now();
    console.log('now: ' + now);

    if (user.allowedTeamsPerHour !== -1) {
        user.lastTeams.push(now);
    }
    user.save(function (err) {
        if (err) {
            console.log('error saving');
        } else {
            console.log('Saved.');
        }
    });
};

var userCanGenTeams = function (user) {
    //    console.log('User: ' + user.displayName + ' teams per hour: ' + user.allowedTeamsPerHour + ' last teams: ' + user.lastTeams);

    var now = Date.now;
    user.lastTeams.filter(function (item, index) {

        var dt_minutes = Math.abs(now - new Date(item)) / 6e3;
        return (dt_minutes < 60);
    });

    user.save(function (err) {
        if (err) {
            console.log('error saving');
        } else {
            console.log('Saved.');
        }
    });
    // user can create teams
    if (user.lastTeams.length < user.allowedTeamsPerHour) {
        return true;
    }

    return true;
};

function union_arrays(x, y) {
    var obj = {};
    for (var i = x.length - 1; i >= 0; --i)
        obj[x[i]] = x[i];
    for (var i = y.length - 1; i >= 0; --i)
        obj[y[i]] = y[i];
    var res = []
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) // <-- optional
            res.push(obj[k]);
    }
    return res;
}


var genTeams = function (players, nTeams) {
    //    console.log('Generating ' + nTeams + ' teams');    
    var team = 0;
    players.forEach(function (p) {
        p.team = team;
        team++;
        if (Number(team) === Number(nTeams)) {
            team = 0;
        }
        p.inUse = true;
    });
};

var average = function (data) {
    var sum = data.reduce(function (sum, value) {
        return sum + value;
    }, 0);

    var avg = sum / data.length;
    return avg;
};

var standardDeviation = function (values) {
    var avg = average(values);

    var squareDiffs = values.map(function (value) {
        var diff = value - avg;
        var sqrDiff = diff * diff;
        return sqrDiff;
    });

    var avgSquareDiff = average(squareDiffs);

    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
};


var rankTeams = function (teams) {
    var s = 0;
    var teamRanks = teams.map(function (team) {
        return team.reduce(function (prev, player) {
                return prev + player.rank;
            },
            0);
    });
    var std = standardDeviation(teamRanks);
    return 100.0 - standardDeviation(teamRanks);
};

var restOfTeamsAreReasonable = function (players, exclude, playersPerTeam) {
    var playersFiltered = players.filter(function (el) {
        return exclude.indexOf(el) < 0;
    });

    if (playersFiltered.length >= playersPerTeam)
        return true;
    else
        return false;

};

var combine = function (a, min) {
    var fn = function (n, src, got, all) {
        if (Number(n) === 0) {
            if (got.length > 0) {
                all[all.length] = got;
            }
            return;
        }
        for (var j = 0; j < src.length; j++) {
            fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
        }
        return;
    };
    var all = [];
    for (var i = min; i < a.length; i++) {
        fn(i, a, [], all);
    }
    all.push(a);
    return all;
};

var allTeams = function (players, teams, playersPerTeam) {
    var playersFiltered = players.filter(function (el) {
        var found = 0;
        teams.forEach(function (team) {
            found = found + (team.indexOf(el) >= 0)
            
            if (found > 0) {
                console.log(el.name + ' exists');
            };
        });
        return found == 0;
    });
    var assert = require('assert');
    assert.ok(playersFiltered.length > 0);
    
    console.log('playersFiltered length: ' + playersFiltered.length);
    return combine(playersFiltered, playersPerTeam);
};

function canGenerateMoreTeams(players, teams) {
    var total = 0;
    teams.forEach(function (team) {
        total = total + team.length;
    });
    if (players.length > total) return true;
}

// if got players for new teams, generate all possibilities and recurse.
// otherwise, update bestTeams and return;
var genTeams2 = function (players, teams, playersPerTeam, bestTeams) {
    var deadlockBreaker = 100000;
    //    console.log('Starting. Already got # teams: ' + teams.length);

    // stop condition
    if (!canGenerateMoreTeams(players, teams)) {
        //        console.log('Stop condition!');
        var rank = rankTeams(teams);
        if (rank > bestTeams.rank) {
            console.log('New best - ' + rank);
            bestTeams.teams = teams;
            bestTeams.rank = rank;
            teams.forEach(function (team) {
                console.log('Team:');
                team.forEach(function (player) {
                    console.log(' ' + player.name);
                });
            });

        }
        return;
    }

    var availableTeams = allTeams(players, teams, playersPerTeam);
    //    console.log('Got ' + availableTeams.length + ' teams');

    for (var team in availableTeams) {
        deadlockBreaker = deadlockBreaker - 1;
        if (deadlockBreaker == 0) {
            console.log('DeadLock Breaker!');
            break;
        }
        //        console.log('Team size: ' + availableTeams[team].length);
        // optimization
        if (!restOfTeamsAreReasonable(players, teams.concat([availableTeams[team]]), playersPerTeam)) {
            console.log('optimizing!');
            return;
        };
        // recurse
        //        console.log('recursing!');
        genTeams2(players, teams.concat([availableTeams[team]]), playersPerTeam, bestTeams);


    };
    return;
};


var resetTeams = function (players) {

    var team = 0;
    players.forEach(function (p) {
        p.team = team;
        p.inUse = true;
    });
};

/**
 * List of Players
 */
exports.list = function (req, res) {

    // get only entries created by this user
    var criteria = {
        user: req.user
    };

    console.log('Number of teams requested: ' + req.query.nTeams);

    if (req.query.nTeams < 2 || req.query.nTeams > 5) {
        console.error('Wrong number of teams : ' + req.query.nTeams);
        return;
    }

    Player.find(criteria).sort('-created').populate('user', 'displayName').exec(function (err, players) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            if (userCanGenTeams(req.user)) {
                userGenereatesTeams(req.user);
                //genTeams(players, req.query.nTeams);
                var playersPerTeam = Math.ceil(players.length / req.query.nTeams);
                var bestTeams = {
                    'rank': 0,
                    'teams': []
                };
                genTeams2(players, [], playersPerTeam, bestTeams);
                var teamidx = 0;
                bestTeams.teams.forEach(function (team) {
                    team.forEach(function (player) {
                        player.team = teamidx;
                    });
                    teamidx = teamidx + 1;
                });
                console.log('# teams: ' + bestTeams.teams.length);
                console.log('Rank: ' + bestTeams.rank);
            } else {
                resetTeams(players);
            }
            res.jsonp(players);
        }
    });
};

/**
 * Player middleware
 */
exports.playerByID = function (req, res, next, id) {
    Player.findById(id).populate('user', 'displayName').exec(function (err, player) {
        if (err) return next(err);
        if (!player) return next(new Error('Failed to load Player ' + id));
        req.player = player;
        next();
    });
};

/**
 * Player authorization middleware
 */
exports.hasAuthorization = function (req, res, next) {
    if (req.player.user.id !== req.user.id) {
        return res.status(403).send('User is not authorized');
    }
    next();
};