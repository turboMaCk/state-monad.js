// Implementation of immutable stack datastructure

interface Result<T> {
    value: undefined | T;
    stack: Stack<T>;
}

interface Stack<T> extends Function {
    (state?: T[]): Stack<T>;
    push(T): Result<T>;
    pop(): Result<T>;
    toArray(): T[];
    result(): Result<T>;
    bind();
}

export function Stack<T>(state?: T[]) {
    state = state || [];
    return {
        push: function (element: T) {
            return {
                value: undefined,
                stack: Stack([element].concat(state))
            };
        },
        pop: function () {
            return {
                value: state[0],
                stack: Stack(state.slice(1))
            };
        },
        toArray: function (): T[] {
            return state;
        },
        result: function (value) {
            return { value: value, stack: this };
        },
        bind: function (stackOperation, continuation) {
            const result = stackOperation(this);
            return continuation(result.value)(result.stack);
        }
    };
}

export function push(element) {
    return function (stack) {
        return stack.push(element);
    };
}

export function pop() {
    return function (stack) {
        return stack.pop(stack);
    };
}

function result(value) {
    return function (stack) {
        return stack.result(value);
    };
}

export function bind(stackOperation, continuation) {
    return function (stack) {
        return stack.bind(stackOperation, continuation);
    };
}

// Returns both the result and the final state.
function runStack(stackOperation, initialStack) {
    return stackOperation(initialStack);
};

// Returns only the computed result.
function evalStack(stackOperation, initialStack) {
    return stackOperation(initialStack).value;
};

// Returns only the final state.
function execStack(stackOperation, initialStack) {
    return stackOperation(initialStack).stack;
};


const computation = bind(push(4), function () {
    return bind(push(5), function () {
        return bind(pop(), function (result2) {
            return bind(pop(), function (result3) {
                return result(result2 + " : " + result3);
            });
        });
    });
});

console.log(runStack(computation, Stack()));
// { value="5 : 4", stack=[]}

console.log(evalStack(computation, Stack()));
// 5 : 4

console.log(execStack(computation, Stack()));
// => []

const comp2 = Stack();
// .bind(push(4))
// .bind(push(5))
// .bind(pop())
// .bind(pop())
// .result(function(a, b) {
//     return a + " " +b;
// });

console.log(comp2.toArray());
