
import { Suspense, useContext } from "react";
import {  useSnapshot } from "valtio";
import { StoreContext } from "./FormStore";
// import { useInputState } from "./FormStore"

function later(delay, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value));
}
const computeOutput = async (value,sourceData)=>{
    console.log("PAID!")
    // return `${value} deps: ${JSON.stringify(sourceData)}`
    return later(300,`${value} deps: ${JSON.stringify(sourceData)}`)
}
// const computeOutput = (value,sourceData)=>{
//     return `${value} deps: ${JSON.stringify(sourceData)}`
// }


function Editor({valueState, setValue}) {
    const {value} = useSnapshot(valueState, {sync:true})
    return <input type="text" value={value||''} onChange={({target})=>setValue(target.value) }/>
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
function Node({id, initialValue, dependencies, sync}: {id}&any){
    const {useInputState} = useContext(StoreContext)
    const {rootState, outputState, setValue} = useInputState(id, {dependencies, computeOutput, initialValue, isReference:true, sync})
    
    return <div>
        <WrappedEditor valueState={rootState} setValue={setValue}/>
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


