import React, { memo, useMemo, useCallback,  Suspense, useContext } from 'react';

import { Handle, useEdges } from 'reactflow';
import { snapshot, useSnapshot } from 'valtio';
// import { validJavascriptName } from '../compiler';
import { dictPromisesToPromiseDict, StoreContext } from '../FormStore';
import { getNodeFromHandle, useNodes } from './Flow';
import { SemiNode } from './initial-elements';
import InputHandle from './InputHandle';
import { OutputHandle } from './OutputHandle';
// const SchemaEditor = (params:{id:string})=>{
//     const {id} = params
//     const computeOutput = useCallback(()=>{},[])
//     let {setValue} = useInputState<{dirty: boolean, schema: object},{id:string,label:string}[]>(`${id}-handles`, ['id'], computeOutput, undefined, true, true)
//     // let {setValue} = useInputState<{dirty: boolean, schema: object},{id:string,label:string}[]>(`${id}-outputHandles`, ['id'], computeOutput, undefined, true, true)
//     return <textarea onChange={(e)=>setValue(e.target.value)}></textarea>
// }
export enum FlowProxyTypes {
    InputHandle='InputHandle',
    OutputHandle='OutputHandle',
    Node='Node',
}
export type NodeFlowProps<T,K> = {
    id:string, 
    data: {
        dependencies: string[]
        value: T,
    }
    EditorElement:React.FC<{valueState: {value:T}, setValue:((T)=>void)}>, 
    OutputElement: React.FC<{outputState: {output?:K}}>, 
    computeOutput: (value?: T, sourceData?: Record<string,any>)=>K,
    computeInputsHandlers?: (value: T)=>string[]
    computeOutputsHandlers?: (value: T)=>string[]
}
const NodeFlow = memo(<T,K>(params: NodeFlowProps<{nodeValue:T},K>) => {
    // const dependencies = useContext
    const nodes = useNodes()
    const {useInputState} = useContext(StoreContext)
    let {id, data: {dependencies: initialDeps, value: initialValue}, EditorElement, OutputElement, computeOutput} = params
    const {inputHandles, outputHandles} = useMemo(()=>{
        return Object.entries(nodes).reduce((acc: any,[idNode,node]: any)=>{
            let {type} = node
            if( getNodeFromHandle(idNode)===id){
                if (type===FlowProxyTypes.InputHandle){
                    acc.inputHandles.push(idNode)
                }else if (type===FlowProxyTypes.OutputHandle){
                    acc.outputHandles.push(idNode)
                }
            }
            return acc
        },  {inputHandles:[] as any[], outputHandles:[] as any[]} ) as {inputHandles:any[], outputHandles:any[]}
    },[nodes, id])
    let getIdHandler = useCallback(()=>`${Math.random}-${id}`,[id])
    // let initialInputsDict = useMemo(()=>{return Object.fromEntries(initialInputs.map((i)=>[i.id, i]))},[])
    // let initialOutputsDict = useMemo(()=>{return Object.fromEntries(initialOutputs.map((i)=>[i.id, i]))},[])
    // modify computeOutput to take into account dependencies dict! ids -> label -> etc
    // const initialState = useMemo(()=>({value:initialValue, dependencies:initialDeps}),[])
    const {rootState, outputState, setValue} = useInputState(id, {dependencies:initialDeps, computeOutput: computeOutput , initialValue: initialValue})
    const createNewHandleId = useCallback(()=>{
        let baseNewId = `${id}-input`
        // let available = false
        let i = 0
        let idNewNode: string|null = null
        while (!idNewNode){
            let newId = `${baseNewId}-${i}`
            if (!inputHandles.find(h=>h===newId)){
                idNewNode = newId
            }
        }
        return idNewNode!
    },[inputHandles,id])
    return (
        <>
        {inputHandles.map((idHandle,i,list)=>{
            let proportion = 100/(list.length+1)
            return <InputHandle id={idHandle} key={idHandle} style={{ background: '#555', left: `${(i+1)*proportion}%`}}
            />
        })}
        {/* <button createNewHandle={()=>createNewInput(createNewHandleId())}</>+</button> */}
        {/* aqui new handler onConnect -> modify schema value */}
        {/* {<SchemaEditor id={id}/>} */}
        {<EditorElement valueState={rootState as {value:{nodeValue:T}}} setValue={setValue}/>}
        {<OutputElement outputState={outputState}/>}
        {outputHandles.map((idHandle,i,list)=>{
            let proportion = 100/(list.length+1)
            return <OutputHandle id={idHandle} key={idHandle} style={{ background: '#555', left: `${(i + 1) * proportion}%` }}  />
        })}
        {/* <button>+</button> */}
        </>
    )         
});
function Editor({valueState, setValue}) {
    const {value} = useSnapshot(valueState, {sync:true})
    return <input type="text" value={value.nodeValue||''} onChange={({target})=>setValue({nodeValue:target.value}) }/>
}
function Output({outputState}) {
    const {output} = useSnapshot(outputState)
    console.log(output, 'output')
    return <div>result: {JSON.stringify(output)}</div>
}
function later(delay, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value));
}
export const computeOutput = async (value, sourceData_)=>{
    let sourceData = Object.fromEntries(Object.values(sourceData_).reduce((acc:any[], v:any)=>v?[...acc,Object.entries(v)]:acc,[]).filter(d=>d!=null).flat())
    console.log("PAID!")
    return later(300,`${value.nodeValue} deps: ${JSON.stringify(sourceData)}`)
    // let snapSourceData = snapshot(sourceData)
    
}
const WrappedEditor = (props)=><Suspense fallback={<span>waiting...</span>}><Editor {...props}></Editor></Suspense>
const WrappedOutput = (props)=><Suspense fallback={<span>waiting...</span>}><Output {...props}></Output></Suspense>
type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>
// export type Node<T,K> = ReactFlowNode<AtLeast<, 'data'>>
const NodeFlowWithEditorAndOutput = ({id, data})=><NodeFlow EditorElement={WrappedEditor} OutputElement={WrappedOutput} id={id} data={data} computeOutput={computeOutput}/>
export default NodeFlowWithEditorAndOutput