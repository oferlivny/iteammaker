'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Player Schema
 */
var PlayerSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Player name',
		trim: true,
        unique: true,
        
	},
    rank: {
        type: Number,
        default: 0,
        required: 'Please specify Player rank'
    },
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	},
    team: {
        type: Number,
        default: 0
    },
    inUse: {
        type: Boolean,
        default: true
    }
});

mongoose.model('Player', PlayerSchema);