import sinon from 'sinon'

export default function spy () {
  return function () {
    return sinon.spy()
  }
}