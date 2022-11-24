import { useMemo } from "react"
import { Handle } from "reactflow"
import { OutputProps } from "./OutputHandle"

export type InputProps = OutputProps&{ dependencies?:string[] } 

export const computeOutput = (value, sourceData)=>{
    console.log('computing handle output', sourceData)
    let values = Object.values(sourceData||{}) as any
    // return dictPromisesToPromiseDict(sourceData||{})
    if (values.length>0){
        return {[value.label]: values[0]}
        // return values[0].then(v=>({[value.label]: }))
    }
    return undefined
}
const InputHandle = (props: Readonly<InputProps&{style?:object}>)=>{
    let {id, label:initialLabel, schema:initialSchema, style, dependencies:initialDependencies} = props
    const {initialState,initialDeps} = useMemo(()=>({initialState:{label:initialLabel||'new_input', schema: initialSchema||{}}, initialDeps:initialDependencies||[]}),[])
    
    // let {rootState} = useInputState<{label:string, schema:object},ReturnType<typeof computeOutput>>(`${id}`, initialDeps, computeOutput, initialState, true)
    return <Handle
        title={id}
        type="target"
        position={"top" as any}
        style={{...(style||{})}}
        // onConnect={connect} dependencies state -> +1
        id={id}
    />
}
export default InputHandle