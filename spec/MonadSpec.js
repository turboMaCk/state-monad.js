it('dirty functions case', function () {
    const increase = (value) => {
        console.log('increasing ' + value);
        return value + 1;
    };

    expect(increase(1)).toEqual(2);
});

it('first solution', function() {
    const increase = (value) => {
        return (log) => {
            log.push(`increasing ${value}`);
            return value + 1;
        }
    }

    const log = [];
    expect(increase(1)(log)).toBe(2)
    expect(log).toEqual(['increasing 1']);
});

it('combine', function() {
    const increase = (value) => {
        return (log) => {
            log.push(`increasing ${value}`);
            return value + 1;
        }
    }

    const square = (fce) => {
        return (log) => {
            const value = fce(log)
            log.push(`squaring ${value}`);
            return value * value;
        }
    }

    const log = [];
    const result = square(increase(1))(log);
    expect(result).toBe(4);
    expect(log).toEqual(['increasing 1', 'squaring 2']);
});

describe('lift', function() {
    const increase = (fce) => {
        return (log) => {
            const value = fce(log);
            log.push(`increasing ${value}`);
            return value + 1;
        }
    }

    const square = (fce) => {
        return (log) => {
            const value = fce(log)
            log.push(`squaring ${value}`);
            return value * value;
        }
    }

    const lift = (value) => {
        return () => {
            return value;
        }
    }

    it('increase |> square', function() {
        const log = [];
        const result = square(increase(lift(1)))(log);
        expect(result).toBe(4);
        expect(log).toEqual(['increasing 1', 'squaring 2']);
    });

    it('square |> increase', function() {
        const log = [];
        const result = increase(square(lift(1)))(log);
        expect(result).toBe(2);
        expect(log).toEqual(['squaring 1', 'increasing 1']);
    });
});

const push = (element) => {
    return (stack) => {
        return [element].concat(stack);
    };
};

var immutablePush = function (array, log) {
    var newArray = [];
    newArray.push.apply(newArray, array);
    newArray.push(log);
    return newArray;
};

describe('immutable stack', function() {
    const increase = (fce) => {
        return (log) => {
            const value = fce(log);
            return [ value[0] + 1,
                     push(`increasing ${value[0]}`)(value[1])];
        }
    }

    const square = (fce) => {
        return (log) => {
            const value = fce(log)
            return [ value[0] * value[0],
                     push(`squaring ${value[0]}`)(value[1]) ];
        }
    }

    const lift = (value) => {
        return (log) => {
            return [ value, log ];
        }
    }

    it('increase |> square', function() {
        const result = square(increase(lift(1)))([]);
        expect(result).toEqual([4, ['squaring 2', 'increasing 1']]);
    });

    it('square |> increase', function() {
        const result = increase(square(lift(1)))([]);
        expect(result).toEqual([2, ['increasing 1', 'squaring 1']]);
    });
});

describe('compose functions', function() {
    const increase = (value) => {
        return (log) => {
            return [ value + 1,
                     push(`increasing ${value}`)(log) ];
        }
    }

    const square = (value) => {
        return (log) => {
            return [ value * value,
                     push(`squaring ${value}`)(log) ];
        }
    }

    const lift = (value) => {
        return (log) => {
            return [ value, log ];
        }
    }

    const StateMonad = function(f) {
        this.f = f;
        this.bind = function(g) {
            return new StateMonad(function(log) {
                return g(f(log)[0])(f(log)[1]);
            });
        }
    }

    it ('invoke chain', function() {
        const m = new StateMonad(lift(2));

        expect(m.bind(square).bind(increase).bind(square).f([])).toEqual([25, ['squaring 5', 'increasing 4', 'squaring 2']]);
    });
});

describe('refactoring monad', function() {
    const lift = (value) => {
        return (log) => {
            return [ value, log ];
        }
    }

    const StateMonad = function(f) {
        this.f = f;
        this.bind = function(g) {
            return new StateMonad(function(log) {
                return g(f(log)[0])
                    .f(f(log)[1]);
            });
        }
    }

    const square = (value) => {
        return new StateMonad(function (log) {
            return [ value * value, push(`squaring ${value}`)(log) ];
        });
    }

    const increase = (value) => {
        return new StateMonad(function (log) {
            return [ value + 1, push(`increasing ${value}`)(log) ];
        });
    }

    it ('invoke chain', function() {
        const m = new StateMonad(lift(2));

        expect(m.bind(square).bind(increase).bind(square).f([])).toEqual([25, ['squaring 5', 'increasing 4', 'squaring 2']]);
    });
});

describe('adding map (functorize)', function() {
    const lift = (value) => {
        return (log) => {
            return [ value, log ];
        }
    }

    const StateMonad = function(f) {
        this.f = f;
        this.bind = (g) => {
            return new StateMonad((log) => {
                return g(this.f(log)[0]).f(this.f(log)[1]);
            });
        };
        this.map = (h) => {
            return new StateMonad((log) => {
                return [ h(this.f(log)[0]), this.f(log)[1] ];
            });
        };
    }

    const square = (value) => {
        return value * value;
    }

    const increase = (value) => {
        return new StateMonad(function (log) {
            return [ value + 1, push(`increasing ${value}`)(log) ];
        });
    }

    it ('has map', function() {
        const m = new StateMonad(lift(2));

        expect(m.map(square).bind(increase).map(square).f([])).toEqual([25, [ 'increasing 4' ]]);
    });
});

describe('refactoring', function() {
    const lift = (value) => {
        return (log) => {
            return [ value, log ];
        }
    }

    const StateMonad = function(f) {
        function flatMap(g) {
            return StateMonad((log) => {
                return g(f(log)[0]).f(f(log)[1]);
            });
        }
        function map(h) {
            return StateMonad((log) => {
                return [ h(f(log)[0]), f(log)[1] ];
            });
        }
        return {
            flatMap: flatMap,
            map: map,
            f: f
        };
    }

    it ('has map', function() {
        const square = (value) => {
            return value * value;
        }

        const increase = (value) => {
            return StateMonad(function (log) {
                return [ value + 1, push(`increasing ${value}`)(log) ];
            });
        }
        const m = StateMonad(lift(2));

        expect(m.map(square).flatMap(increase).map(square).f([])).toEqual([25, [ 'increasing 4' ]]);
    });

    it ('invoke chain', function() {
        const square = (value) => {
            return StateMonad(function (log) {
                return [ value * value, push(`squaring ${value}`)(log) ];
            });
        }

        const increase = (value) => {
            return StateMonad(function (log) {
                return [ value + 1, push(`increasing ${value}`)(log) ];
            });
        }

        const m = StateMonad(lift(2));

        expect(m.flatMap(square).flatMap(increase).flatMap(square).f([])).toEqual([25, ['squaring 5', 'increasing 4', 'squaring 2']]);
    });
});
