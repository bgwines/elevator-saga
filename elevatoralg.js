{
    init: function(elevators, floors) {
        var that = this;

        /**
         * PASS constants
         */
        that.CURR_PASS = 0;
        that.NEXT_PASS = 1;
        that.NEXT_NEXT_PASS = 2;

        /**
         * An object that represents how serviceable
         * an elevator request (up / down pressed) is.
         *
         * @param pass :: PASS constant - the index of the earliest
         *                       pass the elevator in question could
         *                       handle the request. 0-indexed, so 0
         *                       means the elevator can get the request
         *                       on its current path.
         */
        that.ElevatorRequestServiceabilityFactory = function(pass) {
            var that = {};

            that.pass = pass;

            /**
             * @return :: Bool
             */
            that.eq = function(other) {
                return that.pass === other.pass;
            }

            /**
             * @return :: Bool
             */
            that.less = function(other) {
                return that.pass < other.pass;
            }

            /**
             * @return :: Bool
             */
            that.greater = function(other) {
                return that.pass > other.pass;
            }

            /**
             * @return :: Bool
             */
            that.geq = function(other) {
                return that.pass >= other.pass;
            }

            /**
             * @return :: Bool
             */
            that.leq = function(other) {
                return that.pass <= other.pass;
            }

            return that;
        }

        /**
         * floors are 0-indexed, and maybe some might be skipped.
         */
        that.maxFloorNum = _.max(floors, function(floor) {
            return floor.floorNum()
        });

        /**
         * elevator member functions
         */
        _.each(elevators, function(elevator) {
            elevator.printQueues = function() {
                console.log(elevator.currQueue);
                console.log(elevator.nextQueue);
                console.log(elevator.nextNextQueue);
            }

            /**
             * @return :: ElevatorRequestServiceability
             */
            elevator.getUpRequestServiceability = function(floorNum) {
                if (elevator.floorIsOnCurrPassUp(floorNum)) {
                    return that.ElevatorRequestServiceabilityFactory(
                        that.CURR_PASS
                    );
                }

                if (elevator.floorIsOnNextPassUp(floorNum)) {
                    return that.ElevatorRequestServiceabilityFactory(
                        that.NEXT_PASS
                    );
                }

                if (elevator.floorIsOnNextNextPassUp(floorNum)) {
                    return that.ElevatorRequestServiceabilityFactory(
                        that.NEXT_NEXT_PASS
                    );
                }

                throw 'Programming error: unable to determine request '
                    + 'serviceability for F' + floor.floorNum() + ' for E'
                    + elevator.uid;
                ;
            }

            /**
             * @return :: ElevatorRequestServiceability
             */
            elevator.getDownRequestServiceability = function(floorNum) {
                if (elevator.floorIsOnCurrPassDown(floorNum)) {
                    return that.ElevatorRequestServiceabilityFactory(
                        that.CURR_PASS
                    );
                }

                if (elevator.floorIsOnNextPassDown(floorNum)) {
                    return that.ElevatorRequestServiceabilityFactory(
                        that.NEXT_PASS
                    );                    
                }

                if (elevator.floorIsOnNextNextPassDown(floorNum)) {
                    return that.ElevatorRequestServiceabilityFactory(
                        that.NEXT_NEXT_PASS
                    );
                }

                throw 'Programming error: unable to determine request '
                    + 'serviceability for F' + floor.floorNum() + ' for E'
                    + elevator.uid;
                ;
            }

            /**
             * @return :: Bool
             */
            elevator.floorIsOnCurrPassUp = function(floorNum) {
                if (elevator.goingDownIndicator()) {
                    return false;
                }

                if (elevator.currentFloor() === floorNum) {
                    // currentFloor() is discretized, so this'll
                    // prevent the edge case of elevators turning
                    // back later
                    return elevator.getPressedFloors().length === 0;
                } else { // doing up
                    return elevator.currentFloor() < floorNum;
                }
            }

            /**
             * @return :: Bool
             */
            elevator.floorIsOnCurrPassDown = function(floorNum) {
                if (elevator.goingUpIndicator()) {
                    return false;
                }

                if (elevator.currentFloor() === floorNum) {
                    // currentFloor() is discretized, so this'll
                    // prevent the edge case of elevators turning
                    // back later
                    return elevator.getPressedFloors().length === 0;
                } else {
                    return elevator.currentFloor() > floorNum;
                }
            }

            /**
             * @return :: Bool
             */
            elevator.floorIsOnNextPassUp = function(floorNum) {
                return elevator.goingDownIndicator();
            }

            /**
             * @return :: Bool
             */
            elevator.floorIsOnNextPassDown = function(floorNum) {
                return elevator.goingUpIndicator();
            }

            /**
             * @return :: Bool
             */
            elevator.floorIsOnNextNextPassUp = function(floorNum) {
                return elevator.goingUpIndicator();
            }

            /**
             * @return :: Bool
             */
            elevator.floorIsOnNextNextPassDown = function(floorNum) {
                return elevator.goingDownIndicator();
            }

            /**
             * @param floorNum :: Integer
             * @return :: Bool
             */
            elevator.isIdleAtFloor = function(floorNum) {
                return (elevator.getPressedFloors().length === 0)
                    && (elevator.currentFloor() === floorNum);
            }

            /**
             * @param floorNum :: Integer
             *
             * inserts the floor as as a destination for the elevator
             * on the current pass
             */
            elevator.insertDestinationOnCurrPass = function(floorNum) {
                if (elevator.isIdleAtFloor(floorNum))
                {
                    // Already there
                    return;
                }

                elevator.currQueue.push(floorNum);
                elevator.sortQueues();
                elevator.destinationQueue = elevator.currQueue;
                elevator.checkDestinationQueue();
            };

            /**
             * @param floorNum :: Integer
             *
             * inserts the floor as as a destination for the elevator
             * on the next pass
             */
            elevator.insertDestinationOnNextPass = function(floorNum) {
                elevator.nextQueue.push(floorNum);
                elevator.sortQueues();
            };

            /**
             * @param floorNum :: Integer
             *
             * inserts the floor as as a destination for the elevator
             * on the next next pass
             */
            elevator.insertDestinationOnNextNextPass = function(floorNum) {
                if (elevator.nextQueue.length === 0) {
                    // make us go in the "next" direction so that
                    // we can pick up requests on the way, otherwise
                    // we'll (WLOG) indicate up while going down.
                    //
                    // can mark this push as one that should be
                    // invalidated if we push anything else to this
                    // queue later since it's only pushed for this
                    // purpose. This isn't currently implemented but would
                    // reduce a redundant stop in these cases and hence
                    // is an optimization to consider.
                    elevator.nextQueue.push(floorNum);
                }
                elevator.nextNextQueue.push(floorNum);
                elevator.sortQueues();
            };

            /**
             * private.
             */
            elevator.insertDestination = function(
                floorNum,
                serviceabilityStatus)
            {
                switch (serviceabilityStatus.pass) {
                    case that.CURR_PASS:
                        elevator.insertDestinationOnCurrPass(floorNum);
                        break;

                    case that.NEXT_PASS:
                        elevator.insertDestinationOnNextPass(floorNum);
                        break;

                    case that.NEXT_NEXT_PASS:
                        elevator.insertDestinationOnNextNextPass(floorNum);
                        break;
                }
                elevator.cycleQueuesIfPossible();
            }

            /**
             * @param floorNum :: Integer
             *
             * inserts the floor as as a destination for the elevator
             * on as early a pass as possible
             */
            elevator.insertDestinationUp = function(floorNum) {
                elevator.insertDestination(
                    floorNum,
                    elevator.getUpRequestServiceability(floorNum)
                );
            }

            /**
             * @param floorNum :: Integer
             *
             * inserts the floor as as a destination for the elevator
             * on as early a pass as possible
             */
            elevator.insertDestinationDown = function(floorNum) {
                elevator.insertDestination(
                    floorNum,
                    elevator.getDownRequestServiceability(floorNum)
                );
            }

            /**
             * sorts all queues: curr, next, and next-next.
             */
            elevator.sortQueues = function() {
                this.increasingCmp = function(n1, n2) { return n1 - n2; }
                this.decreasingCmp = function(n1, n2) { return n2 - n1; }

                if (elevator.goingUpIndicator()) {
                    elevator.currQueue.sort(this.increasingCmp);
                    elevator.currQueue.sort(this.decreasingCmp);
                    elevator.currQueue.sort(this.increasingCmp);
                } else {
                    elevator.nextQueue.sort(this.decreasingCmp);
                    elevator.nextQueue.sort(this.increasingCmp);
                    elevator.nextQueue.sort(this.decreasingCmp);
                }
            }

            /**
             * @return :: Bool
             */
            // elevator.canFlipDirection = function() {
            //     if (elevator.goingUpIndicator() &&
            //         elevator.currentFloor() > 0)
            //     {
            //         return true;
            //     } else if (elevator.goingDownIndicator() &&
            //         elevator.currentFloor() < that.maxFloorNum)
            //     {
            //         return true;
            //     }
            //     return false;
            // }

            /**
             * Flips the elevator's direction indicator,
             * ignoring the current floor.
             */
            elevator.flipDirection = function() {
                if (elevator.goingUpIndicator()) {
                    console.log('E' + elevator.uid + ' was (↑), now (↓)');
                } else {
                    console.log('E' + elevator.uid + ' was (↓), now (↑)');
                }

                elevator.goingUpIndicator(
                    !elevator.goingUpIndicator()
                );
                elevator.goingDownIndicator(
                    !elevator.goingDownIndicator()
                );
            }

            /**
             * Whether it is safe and prudent to trash the current queue
             * and cycle the others in. If all are empty, this returns
             * false.
             */
            elevator.canAndShouldCycleQueues = function() {
                return (elevator.currQueue.length === 0)
                    && ((elevator.nextQueue.length !== 0)
                        || (elevator.nextNextQueue.length !== 0));
            }

            /**
             * If the current pass's queue is empty,
             * cycle the queues so that we can start moving.
             */
            elevator.cycleQueuesIfPossible = function() {
                if (elevator.canAndShouldCycleQueues()) {
                    elevator.flipDirection();

                    // cycle queues
                    elevator.currQueue = elevator.nextQueue;
                    elevator.nextQueue = elevator.nextNextQueue;
                    elevator.nextNextQueue = [];

                    // directions have flipped, so we should resort
                    // in the correct directions.
                    elevator.sortQueues();

                    elevator.destinationQueue = elevator.currQueue;
                    elevator.checkDestinationQueue();
                }
            }
        });

        /* ---- elevator initialization ---- */

        /**
         * All elevators start at floor 0, so
         * they start by indicating "up".
         */
        _.each(elevators, function(elevator) {
            elevator.goingUpIndicator(true);
            elevator.goingDownIndicator(false);
        });

        /**
         * for debugging logging purposes
         */
        for (var i=0; i<elevators.length; i++) {
            elevators[i].uid = i;
        }

        /**
         * need to be able to queue requests for
         * after an elevator changes directions
         */
        _.each(elevators, function(elevator) {
            elevator.currQueue = [];
            elevator.nextQueue = [];
            elevator.nextNextQueue = [];
        });

        /* ---- start of helper functions ---- */

        /**
         * @param floorNum :: Integer
         * @return :: Elevator
         */
        that.getBestElevatorForUpRequest = function(floorNum) {
            _.each(elevators, function(elevator) {
                elevator.cycleQueuesIfPossible();
            });

            return _.min(elevators, function(elevator) {
                return elevator.getUpRequestServiceability(floorNum).pass;
            })
        }

        /**
         * @param floorNum :: Integer
         * @return :: Elevator
         */
        that.getBestElevatorForDownRequest = function(floorNum) {
            _.each(elevators, function(elevator) {
                elevator.cycleQueuesIfPossible();
            });

            return _.min(elevators, function(elevator) {
                return elevator.getDownRequestServiceability(floorNum).pass;
            })
        }

        /* ---- end of helper functions ---- */

        /**
         * elevator behavior
         */
        _.each(elevators, function(elevator) {
            elevator.on("floor_button_pressed", function(floorNum) {
                // The person will only have gotten on if the indicator
                // was pointing in the direction in which they are
                // traveling. Hence, we can guarantee that their
                // destination will be on the current pass.
                console.log('Pressed: F' + floorNum + ' inside E' + elevator.uid);
                elevator.printQueues();
                elevator.insertDestinationOnCurrPass(floorNum);
                console.log('---------');
                elevator.printQueues();
            });

            elevator.on("stopped_at_floor", function(floorNum) {
                console.log('stopped at floor.');
                elevator.printQueues();

                elevator.currQueue = _.without(
                    elevator.currQueue,
                    floorNum
                );
                elevator.cycleQueuesIfPossible(); // move this up?
                elevator.currQueue = _.without(
                    elevator.currQueue,
                    floorNum
                );
                console.log('--------');
                elevator.printQueues();
            });
        });

        /**
         * floor behavior
         */
        _.each(floors, function(floor) {
            floor.on("up_button_pressed", function() {
                console.log('Request: F' + floor.floorNum() + '(↑)');
                var bestElevator = that.getBestElevatorForUpRequest(
                    floor.floorNum()
                );
                console.log(
                    '↑ (F' + floor.floorNum() + '): assigned to E'
                    + bestElevator.uid + ' (@ F'
                    + bestElevator.currentFloor() + ')'
                );
                bestElevator.printQueues();
                bestElevator.insertDestinationUp(floor.floorNum());
                console.log('---------');
                bestElevator.printQueues();
            });

            floor.on("down_button_pressed", function() {
                console.log('Request: F' + floor.floorNum() + '(↓)');
                var bestElevator = that.getBestElevatorForDownRequest(
                    floor.floorNum()
                );
                console.log(
                    '↓ (F' + floor.floorNum() + '): assigned to E'
                    + bestElevator.uid + ' (@ F'
                    + bestElevator.currentFloor() + ')'
                );
                bestElevator.printQueues();
                bestElevator.insertDestinationDown(floor.floorNum());
                console.log('---------');
                bestElevator.printQueues();
            });
        });
    },

    /**
     * Don't normally need to do anything in this function.
     */
    update: function(dt, elevators, floors) {}
}