{
    init: function(elevators, floors) {
        var that = this;

        // for debugging logging purposes
        for (var i = 0; i < elevators.length; i++) {
            elevators[i].uid = i;
        }

        /* ---- start of helper functions ---- */

        // floors are 0-indexed and don't
        // skip any, but best to be sure.
        this.maxFloor = _.max(floors, function(floor) {
            return floor.floorNum()
        });

        this.printDQs = function() {
            _.each(elevators, function(elevator) {
                console.log(
                    'E' + elevator.uid + '.DQ == '
                    + JSON.stringify(elevator.destinationQueue)
                );
            });
        };

        // comparator function
        this.increasingCmp = function(n1, n2) {
            return n1 - n2;
        }

        // comparator function
        this.decreasingCmp = function(n1, n2) {
            return n2 - n1;
        }

        // comparator function
        this.increasingFloorCmp = function(e1, e2) {
            return e1.currentFloor() - e2.currentFloor();
        };

        // comparator function
        this.decreasingFloorCmp = function(e1, e2) {
            return e2.currentFloor() - e1.currentFloor();
        };

        // inserts the floor as as a destination for the elevator
        this.insert_dest = function(elevator, floorNum) {
            console.log(
                'inserting F' + floorNum + ' for E'+ elevator.uid
            );
            destinations = elevator.destinationQueue;
            if (!destinations) {
                destinations = [];
            }
            destinations.push(floorNum); // automatically deduped
            if (elevator.goingUpIndicator()) {
                destinations.sort(that.increasingCmp);
            } else {
                destinations.sort(that.decreasingCmp)
            }

            elevator.destinationQueue = destinations;
            elevator.checkDestinationQueue();
        };

        // init all to go up
        _.each(elevators, function(elevator) {
            elevator.goingUpIndicator(true);
            elevator.goingDownIndicator(false);
        });

        // @return :: Bool
        this.upElevatorCanStopOnTheWay = function(floor) {
            return that.getOnTheWayUpElevator(floor) !== undefined;
        }

        // @return :: Either Elevator Undefined
        this.getOnTheWayUpElevator = function(floor) {
            // sort in decreasing order by current floor, so that
            // the highest elevator that can take request does.
            elevators.sort(that.decreasingFloorCmp);
            return _.find(elevators, function(elevator) {
                return that.floorIsOnWayUp(elevator, floor);
            });
        }

        // @return :: Bool
        this.downElevatorCanStopOnTheWay = function(floor) {
            return that.getOnTheWayDownElevator(floor) !== undefined;
        }

        // @return :: Either Elevator Undefined
        this.getOnTheWayDownElevator = function(floor) {
            // sort in increasing order by current floor, so that
            // the lowest elevator that can take request does.
            elevators.sort(that.increasingFloorCmp);
            return _.find(elevators, function(elevator) {
                return that.floorIsOnWayDown(elevator, floor);
            });
        }

        // @return :: Bool - whether the direction was flipped
        this.flipElevatorDirectionSafely = function(elevator) {
            if (elevator.goingUpIndicator() &&
                elevator.currentFloor() > 0)
            {
                elevator.goingUpIndicator(false);
                elevator.goingDownIndicator(true);
                return true;
            } else if (elevator.goingDownIndicator() &&
                elevator.currentFloor() < that.maxFloor)
            {
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(false);
                return true;
            }
            return false;
        }

        // @return :: Bool
        this.floorIsOnWayUp = function(elevator, floor) {
            if (elevator.goingDownIndicator()) {
                return floor.floorNum() === 0;
            } else { // going up
                if (elevator.currentFloor() === floor.floorNum()) {
                    // currentFloor() is discretized, so this'll prevent
                    // the edge case of elevators turning back later
                    return elevator.getPressedFloors().length === 0;
                } else {
                    return elevator.currentFloor() < floor.floorNum();
                }
            }
        }

        // @return :: Bool
        this.floorIsOnWayDown = function(elevator, floor) {
            if (elevator.goingDownIndicator()) {
                if (elevator.currentFloor() === floor.floorNum()) {
                    // currentFloor() is discretized, so this'll prevent
                    // the edge case of elevators turning back later
                    return elevator.getPressedFloors().length === 0;
                } else {
                    return elevator.currentFloor() > floor.floorNum();
                }

            } else { // going up
                return floor.floorNum() === that.maxFloor;
            }
        }

        /* ---- end of helper functions ---- */

        // elevator behavior
        _.each(elevators, function(elevator) {
            // when a floor button is pressed, we must add
            // it as a destination.
            elevator.on("floor_button_pressed", function(floorNum) {
                console.log('F' + floorNum + ' pressed inside E'
                    + elevator.uid);
                that.insert_dest(elevator, floorNum);
            });

            elevator.on("idle", function() {
                if (that.flipElevatorDirectionSafely(elevator)) {
                    console.log(
                        'E' + elevator.uid
                        + ' is idle, so we flip its direction.'
                    );
                }
            });
        });


        // floor behavior
        _.each(floors, function(floor) {
            floor.on("up_button_pressed", function() {
                if (that.upElevatorCanStopOnTheWay(floor)) {
                    elevator = that.getOnTheWayUpElevator(floor);
                    that.insert_dest(elevator, floor.floorNum());
                    console.log(
                        '↑ (F' + floor.floorNum() + '): assigned to E'
                        + elevator.uid + ' (@ F'
                        + elevator.currentFloor() + ')'
                    );
                } else {
                    console.log(
                        '↑ (F' + floor.floorNum()
                        + '): could not find elevator. Dropping request.'
                    );
                }
            });

            floor.on("down_button_pressed", function() {
                if (that.downElevatorCanStopOnTheWay(floor)) {
                    e = that.getOnTheWayDownElevator(floor);
                    that.insert_dest(elevator, floor.floorNum());
                    console.log(
                        '↓ (F' + floor.floorNum() + '): assigned to E'
                        + elevator.uid + ' (@ F'
                        + elevator.currentFloor() + ')'
                    );
                } else {
                    console.log(
                        '↓ (F' + floor.floorNum()
                        + '): could not find elevator. Dropping request.'
                    );
                }
            });
        });
    },

    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}