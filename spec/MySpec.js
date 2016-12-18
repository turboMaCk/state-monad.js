"use strict";

function Result(stack, value) {
    return {
        value: value,
        stack: stack
    };
}

function Stack(arr) {
    arr = arr || [];
    return {
        push: function(value) {
            return Result(Stack([value].concat(arr)));
        },
        pop: function() {
            return Result(Stack(arr.slice(1)), arr[0]);
        },
        toArray: function() {
            return arr;
        }
    };
}

describe('stack', function() {
    const stack = Stack().push(1).stack.push(2).stack.push(3).stack;

    it('has correct state', function() {
        expect(stack.toArray()).toEqual([3,2,1]);
    });

    it('can be poped', function() {
        const poped = stack.pop();
        expect(poped.value).toEqual(3);
        expect(poped.stack.toArray()).toEqual([2,1]);
    });

    it('value can be pushed', function() {
        const pushed = stack.push(4);
        expect(pushed.value).toEqual(undefined);
        expect(pushed.stack.toArray()).toEqual([4,3,2,1]);
    });
});

function lift(value) {
    return function(stack) {
        return Result(stack, value);
    }
}

function StateMonad(fce) {
    if (typeof fce !== 'function') {
        fce = lift(fce);
    }
    return {
        flatMap: function(g) {
            return StateMonad(function(stack) {
                const result = fce(stack);
                return g(result.value).run(result.stack);
            });
        },
        map: function(h) {
            return StateMonad(function(stack) {
                const result = fce(stack);
                return Result(result.stack, h(result.value))
            })
        },
        run: function(stack) {
            stack = stack || Stack();
            return fce(stack);
        },
        eval: function(stack) {
            stack = stack || Stack();
            return fce(stack).value;
        },
        exec: function(stack) {
            stack = stack || Stack();
            return fce(stack).stack;
        }
    }
}

describe('state monad', function() {
    it('flatMap' , function() {
        function increase(value) {
            return StateMonad(function(stack) {
                return Result(stack.push(`increase ${value}`).stack, value + 1);
            });
        }

        expect(StateMonad(1).run().value).toEqual(1);
        expect(StateMonad(1).run().stack.toArray()).toEqual([]);

        const chain = StateMonad(1).flatMap(increase).flatMap(increase);
        expect(chain.run().value).toEqual(3);
        expect(chain.run().stack.toArray()).toEqual(['increase 2', 'increase 1']);
        expect(chain.eval()).toEqual(3);
        expect(chain.exec().toArray()).toEqual(['increase 2', 'increase 1']);
    });

    it('map', function() {
        function increase(value) {
            return value + 1;
        }

        const chain = StateMonad(2).map(increase).map(increase);
        expect(chain.run().value).toEqual(4);
        expect(chain.run().stack.toArray()).toEqual([]);
        expect(chain.eval()).toEqual(4);
        expect(chain.exec().toArray()).toEqual([]);
    });

    it('shit', function() {
        const shit = StateMonad(1)
              .flatMap((value) => StateMonad(stack => stack.push(value)))
              .flatMap(() => StateMonad(stack => stack.pop()))
              .flatMap((value) => StateMonad(stack => stack.push(value + 1)))
              .flatMap(() => StateMonad(stack => stack.pop()))

        expect(shit.run().value).toEqual(2);
        expect(shit.run().stack.toArray()).toEqual([]);
    });
});
