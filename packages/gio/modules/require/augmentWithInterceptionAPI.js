import getInterceptionAPI from 'gio-module-facing-api'

export default function(code, getAPI = getInterceptionAPI){
  return getAPI()
    .then(api => `${api}${code}`)
}