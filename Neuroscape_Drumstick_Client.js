// Neuroscape_Moving-Orb_Server.js
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
    var clamp = Util.Maths.clamp,
        debounce = Util.Functional.debounce(),
        lerp = Util.Maths.lerp,
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
        hand = null,
        padY = 0,
        Y_MARGIN = 0.070,
        DEBOUNCE_TIME = 500,
        SEARCH_FOR_NAMES_TIMEOUT = 5000,
        HAPTIC_STRENGTH = 1.0,
        HAPTIC_DURATION = 100,
        LEFT_HAND = 0,
        RIGHT_HAND = 1,
        STEPS = 20,
        COLOR_CHANGE_INTERVAL = 40,
        BOUNDARY_LEFT = "Neuroscape_Boundary_Left",
        BOUNDARY_RIGHT = "Neuroscape_Boundary_Right",
        PAD_LEFT = "Neuroscape_Drumstick_Pads_Left",
        PAD_RIGHT = "Neuroscape_Drumstick_Pads_Right",
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
        eventProperties = {},
        collisionIDS = {
            Neuroscape_Boundary_Left: null,
            Neuroscape_Boundary_Right: null,
            Neuroscape_Drumstick_Left: null,
            Neuroscape_Drumstick_Right: null,
            Neuroscape_Drumstick_Pads_Left: null,
            Neuroscape_Drumstick_Pads_Right: null
        },
        collisionNames = Object.keys(collisionIDS);

    // Entity Definition
    function Neuroscape_Drumstick_Client() {
        self = this;
    }

    Neuroscape_Drumstick_Client.prototype = {
        remotelyCallable: [
            "editColor",
            "update",
            "moveDirection",
            "reset",
            "setOrbPositionTo"
        ],
        collisionWithEntity: function (myID, theirID, collision) {
            log(LOG_ARCHIVE, name + " IN COLLISION WITH ENTITY");
            if (collision.type === 0 ) {
                switch (theirID) {
                    case collisionIDS[BOUNDARY_LEFT]:
                        log(LOG_ARCHIVE, name + " COLLISION WITH: " + BOUNDARY_LEFT);
                        if (debounce(DEBOUNCE_TIME)) {
                            Controller.triggerHapticPulse(HAPTIC_STRENGTH, HAPTIC_DURATION, hand);
                        }
                        break;
                    case collisionIDS[BOUNDARY_RIGHT]:
                        log(LOG_ARCHIVE, name + " COLLISION WITH: " + BOUNDARY_RIGHT);
                        if (debounce(DEBOUNCE_TIME)) {
                            Controller.triggerHapticPulse(HAPTIC_STRENGTH, HAPTIC_DURATION, hand);
                        }
                        break;
                    case collisionIDS[PAD_LEFT]:
                        if (collision.contactPoint.y < padY + Y_MARGIN) {
                            log(LOG_ARCHIVE, "RETURNING FROM BOTTOM COLLISION");
                            return;
                        }
                        log(LOG_ARCHIVE, name + " COLLISION WITH: " + PAD_LEFT);
                        if (debounce(DEBOUNCE_TIME)) {
                            Controller.triggerHapticPulse(HAPTIC_STRENGTH, HAPTIC_DURATION, hand);
                        }
                        break;
                    case collisionIDS[PAD_RIGHT]:
                        if (collision.contactPoint.y < padY + Y_MARGIN) {
                            log(LOG_ARCHIVE, "RETURNING FROM BOTTOM COLLISION");
                            return;
                        }
                        log(LOG_ARCHIVE, name + " COLLISION WITH: " + PAD_RIGHT);
                        if (debounce(DEBOUNCE_TIME)) {
                            Controller.triggerHapticPulse(HAPTIC_STRENGTH, HAPTIC_DURATION, hand);
                        }
                        break;
                    default:
                }
            }
        },
        editColor: function(id, param) {
            log(LOG_ENTER, name + " IN EDIT COLOR", param);

            var inMin = 0,
                inMax = Number(param[0]),
                currentPoint = Number(param[1]),
                outColorMin = 0,
                outColorMax = 255,
                colorChangeRed,
                colorChangeBlue;
            
            colorChangeRed = lerp(
                inMin, inMax, outColorMin, outColorMax, currentPoint
            );
            colorChangeBlue = lerp(
                inMin, inMax, outColorMax, outColorMin, currentPoint
            );
    
            eventProperties = {
                color: {
                    red: clamp(0, 255, parseInt(colorChangeRed)),
                    blue: clamp(0, 255, parseInt(colorChangeBlue)),
                    green: 0
                }
            };
            log(LOG_ARCHIVE, "Event PROPERTIEs", eventProperties);
            Entities.editEntity(entityID, eventProperties);
            this.getToWhite();
        },
        getToWhite: function() {
            var perStep = {
                red: (255 - eventProperties.color.red) / STEPS,
                green: (255 - eventProperties.color.green) / STEPS,
                blue: (255 - eventProperties.color.blue) / STEPS
            }
            log(LOG_ARCHIVE, "per Setp", perStep);
            var stepsLeft = STEPS;
            var colorInterval;
            colorInterval = Script.setInterval(function() {
                var currentRed = eventProperties.color.red;
                var currentBlue = eventProperties.color.blue;
                var currentGreen = eventProperties.color.green;
                eventProperties.color.red = clamp(0, 255, parseInt(perStep.red + currentRed));
                eventProperties.color.green = clamp(0, 255, parseInt(perStep.green + currentGreen));
                eventProperties.color.blue = clamp(0, 255, parseInt(perStep.blue + currentBlue));
                log(LOG_ARCHIVE, "eventProperties", eventProperties);

                Entities.editEntity(entityID, eventProperties);
                --stepsLeft;
                if (stepsLeft === 0) {
                    Script.clearInterval(colorInterval);
                }
            }, COLOR_CHANGE_INTERVAL);
        },
        preload: function (id) {
            entityID = id;
            currentProperties = Entities.getEntityProperties(entityID);
            name = currentProperties.name;
            hand = name.indexOf("Left") > -1 ? LEFT_HAND : RIGHT_HAND;
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
                var padProps = Entities.getEntityProperties(collisionIDS[PAD_RIGHT]);
                var positionY = padProps.position.y;
                var dimensionY = padProps.dimensions.y;
                padY = positionY - (dimensionY / 2);
                log(LOG_ENTER, "FOUND ALL COLLISION NAMES");
            }, SEARCH_FOR_NAMES_TIMEOUT);

        },
        unload: function () {
        }
    };

    return new Neuroscape_Drumstick_Client();
});
