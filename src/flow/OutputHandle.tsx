
import { Handle } from "reactflow"
import { dictPromisesToPromiseDict } from "../FormStore"

export type OutputProps = {id:string,label?:string, schema?:object} 

export const computeOutput = (value, sourceData)=>{
    // erase promise
    return dictPromisesToPromiseDict(sourceData).then((dictValues: void|Record<string,any>)=>{
        if (dictValues && Object.keys(dictValues).length===1){
            return Object.values(dictValues)[0]
        }else{
            // case more than one output
            return null
        }
    })
    // let values = Object.values(sourceData||{}) as any
    // if (values.length>0){
    //     return values[0].then(v=>({value:v, label: value.label}))
    // }
    // return undefined
}

export const OutputHandle = (props: Readonly<OutputProps & {style?:object, nodeId?: string}>)=>{
    let {id, label:initialLabel, schema:initialSchema, style} = props
    // const {initialState} = useMemo(()=>({initialState:{label:initialLabel||'new_output', schema: initialSchema||{}}}),[])
    // useKey(id)
    // let {rootState} = useInputState<{label:string, schema:object},ReturnType<typeof computeOutput>>(`${id}`, [nodeId], computeOutput, initialState, true, true)
    return <Handle
        title={id}
        type="source"
        position={"bottom" as any}
        style={{...(style||{})}}
        // onConnect={connect} dependencies state -> +1
        id={id}
    />
}