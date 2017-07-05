const identity = i => i

const EMPTY = Symbol('EMPTY')
const isEmpty = val => val === EMPTY
const optional = (val = EMPTY) => {
  return {
    map: fn => optional(!isEmpty(val) ? fn(val) : val),
    filter: fn => optional(fn(val) ? val : EMPTY),
    get: (fn = identity) => (!isEmpty(val) ? fn(val) : undefined),
    isEmpty: () => isEmpty(val),
    orElse: fn => optional(!isEmpty(val) ? val : fn()),
    getOrElse: altVal => (!isEmpty(val) ? val : altVal)
  }
}

Object.assign(exports, {
  identity,
  optional
})
