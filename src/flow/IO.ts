import { getNodeFromHandle } from "./Flow"
import { FlowProxyTypes } from "./NodeFlow"

export const splitNodesList = (listNodes)=>{
    let iHandlers = listNodes.filter((n:any)=>(n?.type===FlowProxyTypes.InputHandle))
    let oHandlersDict = Object.fromEntries(listNodes.filter((n)=>(n?.type===FlowProxyTypes.OutputHandle)).map(({id,...n})=>([id, n])))
    let edges =  iHandlers.map(({id:targetId, ...target}:any)=>{
    let {dependencies: iDeps} = target.data
    if (iDeps?.length>0){
        let sourceId = iDeps[0]
        if (!oHandlersDict[sourceId]){
            console.log("STH WRONG", sourceId, oHandlersDict, iHandlers)
        }
        return {
            "source": getNodeFromHandle(sourceId),
            "sourceHandle": sourceId,
            "target": getNodeFromHandle(targetId),
            "targetHandle": targetId,
            "id": `${sourceId}~${targetId}`
        }
    }
    return null
    }).filter(d=>d!)
    return {
        storeObjectList: listNodes.map(({id,type,data})=>{
            return {id, type, initialValue: data.value, dependencies: data.dependencies}
        }),
        flowNodes: listNodes.filter(({type})=>![FlowProxyTypes.InputHandle,FlowProxyTypes.OutputHandle].includes(type)).map(({/*data,*/...item})=>{
            return item
        }),
        flowEdges: edges
    }
}
export const mergeFlowObject = (storeObject, flowNodes)=>{
    let flowNodesDict = Object.fromEntries(flowNodes.map(({id, ...other})=>[id, other]))
    return Object.entries(storeObject).map(([id, {type,...item}]:any)=>{
        let returnVal = {id, type, data: item}
        if (flowNodesDict[id]){
            returnVal = {...returnVal, ...flowNodesDict[id]}
        }
        return returnVal
    })
}