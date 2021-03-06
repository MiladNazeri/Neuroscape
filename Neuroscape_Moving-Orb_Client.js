// Neuroscape_Moving-Orb_Client.js
//
// Created by Milad Nazeri and Liv Erikson on 2018-07-16
//
// Copyright 2018 High Fidelity, Inc.
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

(function () {
    // Polyfill
    Script.require("./Polyfills.js?" + Date.now())();

    // Helper Functions
    var Util = Script.require("./Helper.js?" + Date.now());
    var vec = Util.Maths.vec,
        searchForEntityNames = Util.Entity.searchForEntityNames;

    // Log Setup
    var LOG_CONFIG = {},
        LOG_ENTER = Util.Debug.LOG_ENTER,
        LOG_UPDATE = Util.Debug.LOG_UPDATE,
        LOG_ERROR = Util.Debug.LOG_ERROR,
        LOG_VALUE = Util.Debug.LOG_VALUE,
        LOG_ARCHIVE = Util.Debug.LOG_ARCHIVE;

    LOG_CONFIG[LOG_ENTER] = false;
    LOG_CONFIG[LOG_UPDATE] = false;
    LOG_CONFIG[LOG_ERROR] = false;
    LOG_CONFIG[LOG_VALUE] = false;
    LOG_CONFIG[LOG_ARCHIVE] = false;
    var log = Util.Debug.log(LOG_CONFIG);

    // Init 
    var BASE_NAME = "Neuroscape_",
        entityID,
        name,
        gameZoneID,
        position,
        SEARCH_FOR_NAMES_TIMEOUT = 5000,
        STICK_LEFT = "Neuroscape_Drumstick_Left",
        STICK_RIGHT = "Neuroscape_Drumstick_Right",
        BOUNDARY_LEFT = "Neuroscape_Boundary_Left",
        BOUNDARY_RIGHT = "Neuroscape_Boundary_Right",
        DIRECTION_ONE = "directionOne",
        DIRECTION_TWO = "directionTwo",
        ON = "on",
        OFF = "off",
        CONTINUOUS = "continuous",
        AUDIO = "audio",
        VISUAL = "visual",
        AUDIOVISUAL = "audiovisual",
        DEBUG = false;

    // Collections
    var currentProperties = {},
        userData = {},
        userdataProperties = {},
        collisionIDS = {
            Neuroscape_Boundary_Left: null,
            Neuroscape_Boundary_Right: null,
            Neuroscape_Drumstick_Left: null,
            Neuroscape_Drumstick_Right: null
        },
        directionOne = {},
        directionTwo = {},
        collisionNames = Object.keys(collisionIDS);

    // Constructor Functions
    // Procedural Functions
    // Entity Definition
    function Neuroscape_MovingOrb_Client() {
        self = this;
    }

    Neuroscape_MovingOrb_Client.prototype = {
        remotelyCallable: [
            "update",
            "moveDirection",
            "reset",
            "setOrbPositionTo"
        ],
        collisionWithEntity: function (myID, theirID, collision) {
            if (collision.type === 0 ) {
                switch (theirID) {
                    case collisionIDS[STICK_LEFT]:
                        log(LOG_ARCHIVE, name + " COLLISION WITH: " + STICK_LEFT);
                        break;
                    case collisionIDS[STICK_RIGHT]:
                        log(LOG_ARCHIVE, name + " COLLISION WITH: " + STICK_RIGHT);
                        break;
                    case collisionIDS[BOUNDARY_LEFT]:
                        log(LOG_ARCHIVE, name + " COLLISION WITH: " + BOUNDARY_LEFT);
                        this.moveDirection(DIRECTION_ONE);
                        break;
                    case collisionIDS[BOUNDARY_RIGHT]:
                        log(LOG_ARCHIVE, name + " COLLISION WITH: " + BOUNDARY_RIGHT);
                        this.moveDirection(DIRECTION_TWO);
                        break;
                    default:
                }
            }
        },
        moveDirection: function(direction) {
            var props = {};
            if (direction === DIRECTION_ONE) {
                props.velocity = directionOne;  
            } else {
                props.velocity = directionTwo;  
            }
            Entities.editEntity(entityID, props);
        },
        preload: function (id) {
            entityID = id;
            currentProperties = Entities.getEntityProperties(entityID);
            name = currentProperties.name;
            position = currentProperties.position;
            gameZoneID = currentProperties.parentID;

            userData = currentProperties.userData;
            try {
                userdataProperties = JSON.parse(userData);
                DEBUG = userdataProperties[BASE_NAME].DEBUG;
            } catch (e) {
                log(LOG_ERROR, "ERROR READING USERDATA", e);
            }
            searchForEntityNames(collisionNames, position, function(children) {
                Object.keys(children).forEach(function(name) {
                    collisionIDS[name] = children[name];
                });
                log(LOG_ENTER, "FOUND ALL COLLISION NAMES");
            }, SEARCH_FOR_NAMES_TIMEOUT);
        },
        reset: function () {
            var props = {};
            props.position = position;
            props.velocity = vec(0,0,0);
            Entities.editEntity(entityID, props);
        },
        setOrbPositionTo: function(id, param) {
            log(LOG_VALUE, "SETTING MOVE ORB POSITION TO");
            var positionToMoveTo = JSON.parse(param[0]);
            var props = {};
            props.position = positionToMoveTo;
            Entities.editEntity(entityID, props);
        },
        unload: function () {
        },
        update: function (id, param) {
            log(LOG_ARCHIVE, "RECEIVED UPDATE ON CLIENT:" + name, param);
            var options = JSON.parse(param[0]);
            directionOne = options.directionOne;
            directionTwo = options.directionTwo;
        }
    };

    return new Neuroscape_MovingOrb_Client();
});
