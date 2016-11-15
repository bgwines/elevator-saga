# elevator-saga
[Elevator Saga] (http://play.elevatorsaga.com) solutions

Algorithm
---------
Elevator assignment is a special case of the *unrelated machines* case
of online load balancing, where the current state of the elevators is
used to determine the load vectors for incoming jobs, whose values are
determined by a simple heuristic that seems to do pretty OK, and the
implementation uses a _O(log(n))_-competitive greedy algorithm that
minimizes the difference between load factors in a nonlinear fashion.

Implementation
--------------
Each elevator has three queues -- the queue for the current pass, the
queue for the next pass, and the queue for the pass after that. If, say,
an elevator is at F4 and traveling up, then an "up" request can only
be serviced by it on the "next next" pass, whereas any down request can be
serviced on the "next" pass. The elevators go in a current direction until
their current queue is empty, after which they change direction and start
the next pass.

Possible improvements
---------------------
The load vector heuristic could be certainly improved (this is
`elevator.currLoad()` and `elevator.getLoadIncrease()`, both of which
were implemented very sketchily). Currently it's very naïve
in its treatment of how close an elevator is to its capacity; there's
opportunity to be a bit more clever there. At this point, improving this part is probably just playing with constants, so I'll just leave it as it is.

Every deterministic online algorithm has an input sequence which makes it performe its worst. One way to combat this is via randomization, though Yao's minimax principle tells us that the expected performance is no better than the worst-case performance of any deterministic algorithm on a random input distribution.

There exist algorithms for the unrelated machines case with known durations, but the application and analysis are not as straightforward in this case and the improvement is only by a constant factor.

Online load balancing is an open problem, so it's theoretically possible to do better than being _O(log(n))_-competitive.
