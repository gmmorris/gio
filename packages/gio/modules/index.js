import requireModule from './require/index'

export default function(module){
  console.log('module ${module} is relative to: ${process.cwd()}')
  requireModule(module)
    .then(requireFreshModule => {
      const transofmedModule = requireFreshModule()
    
      console.log(transofmedModule.doSomething())
    }).catch(e => {
      console.log(e)
    })
}