import stack from 'callsite'

export default function(){
  const [,,callerCallSite] = stack()
  if(callerCallSite) {
    return callerCallSite.getFileName()
  }
  throw new Error('The call site for this function has no call site of its own, no one called it.')
}