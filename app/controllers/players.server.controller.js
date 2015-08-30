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
    for (var team in teams) {
        var ranks = team.map(function (p) {return p.rank;});
        var std=standardDeviation(ranks);
        console.log('stdev: ' + std);
        s += std;
    }
    return s;
};

var restOfTeamsAreReasonable = function ( players, team) {
    return true;
};

var combine = function(a, min) {
    var fn = function(n, src, got, all) {
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

var allTeams = function (players, playersPerTeam) {
    return combine(players, playersPerTeam);
};

var genTeams2 = function (players, exclude, playersPerTeam) {
    console.log('Expecting ' + playersPerTeam + ' per team');
    var bestTeams = [];
    var bestRank = 0;
    for (var team in allTeams(players, exclude, playersPerTeam)) {
        if (restOfTeamsAreReasonable(players, team)) {
            var teams = genTeams2(players, exclude.append(team), playersPerTeam);
            if (exclude.length === 0) {
                var rank = rankTeams(teams);
                if (rank > bestRank) {
                    bestTeams = teams;
                    bestRank = rank;
                }
            }
        }
    }
    return bestTeams;
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
                genTeams(players, req.query.nTeams);
                //genTeams2(players, players.length / req.query.nTeams);
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