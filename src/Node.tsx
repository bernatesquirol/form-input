
import { Suspense } from "react";
import { proxy, useSnapshot } from "valtio";
import { useInputState } from "./FormStore"
function later(delay, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value));
}
const computeOutput = (value,sourceData)=>{
    return later(300,`${value} deps: ${JSON.stringify(sourceData)}`)
}
// const computeOutput = (value,sourceData)=>{
//     return `${value} deps: ${JSON.stringify(sourceData)}`
// }


function Editor({valueState, setValue}) {
    const {value} = useSnapshot(valueState)
    return <input type="text" value={value||''} onChange={({target})=>valueState.value=target.value }/>
}
function Output({outputState}) {
    const {output} = useSnapshot(outputState)
    return <div>result: {output}</div>
}
const WrappedEditor = (props)=><Suspense fallback={<span>waiting...</span>}><Editor {...props}></Editor></Suspense>
const WrappedOutput = (props)=><Suspense fallback={<span>waiting...</span>}><Output {...props}></Output></Suspense>
// const Text = ({text})=><div>{text}</div>
// const WrappedText = ({text})=><Suspense fallback={<Text text='loading...'></Text>}>
// <Text text={`result: ${text}`}></Text>
// </Suspense>
function Node({id, initialValue, dependencies}: {id}&any){
    const {valueState, outputState} = useInputState(id, dependencies, computeOutput, initialValue)
    
    return <div>
        <WrappedEditor valueState={valueState}/>
        {/* <Suspense fallback={<span>waiting...</span>}></Suspense> */}
        <WrappedOutput outputState={outputState}/>
    </div>
}
const Wrapped = (props)=>{
    return (
        <Suspense fallback={<span>waiting...</span>}>
          <Node {...props}/>
        </Suspense>
      )
}
export default Wrapped


