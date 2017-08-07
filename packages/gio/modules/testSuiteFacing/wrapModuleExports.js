export default function(moduleExports, wrap, ...skip) {
  const keys = Object.keys(moduleExports).filter(key => !skip.includes(key))
  return keys.length
    ? keys.reduce(
      (wrappedExports, key) => {
        if(typeof moduleExports[key] === 'function') {
          wrappedExports[key] = wrap(key, moduleExports[key])
        } else {
          wrappedExports[key] = moduleExports[key]
        }
        return wrappedExports
      }, {}
    )
    : {}
}