import { expect } from 'chai'
import { withArgs } from './index'

describe('withArgs', function() {
  it(`takes a function with an named object argument and an object argument, and partially applies any prop in the object on the function`, function() {
    function fn (args) {
      expect(
        arguments.length
      ).to.equal(
        1
      )

      expect(
        args
      ).to.deep.equal(
        {
          a: 1,
          b: 2
        }
      )
    }

    withArgs(fn, { a: 1 })({ b: 2 })
  })

  it(`uses the original object as a default only`, function() {
    function fn (args) {
      expect(
        arguments.length
      ).to.equal(
        1
      )

      expect(
        args
      ).to.deep.equal(
        {
          a: 3,
          b: 2
        }
      )
    }

    withArgs(fn, { a: 1 })({ b: 2, a: 3 })
  })
})
