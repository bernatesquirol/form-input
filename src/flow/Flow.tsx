import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import NodeFlow, { FlowProxyTypes, NodeFlowProps, computeOutput as NodeFlowComputeOutput  } from "./NodeFlow"
import {computeOutput as HandleComputeInput} from './InputHandle'
import {computeOutput as HandleComputeOutput} from './OutputHandle'
import ReactFlow, {
    Controls,
    Background,
    ReactFlowProvider,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    Edge
  } from "reactflow";
import {
    nodes as nodesInitial
} from "./initial-elements";
import 'reactflow/dist/style.css'; 
// import { ProxyState, setKeys } from "../FormStore";
import { derive } from "valtio/utils";
import { StoreContext } from "../FormStore";
import { snapshot, useSnapshot } from "valtio";
import { splitNodesList } from "./IO";
export const getNodeFromHandle = (handleId)=>{
  return handleId.split('-')[0]
}
const filterSplit = (list, condition) => {
  return list.reduce(
    ([trueList, falseList], item) =>
      condition(item)
        ? [[...trueList, item], falseList]
        : [trueList, [...falseList, item]],
    [[], []]
  );
};
export const useNodes = ()=>{
  let {stateRef} = useContext(StoreContext) 
  let state = useSnapshot(stateRef)
  return state
}
function getDependantNodes(nodeIds: any, edges: any[]) {
  return edges.reduce((acc: any, edge: { source: any; target: any }) => {
    if (nodeIds.includes(edge.source)) {
      return [...acc, edge];
    }
    return acc;
  }, []);
}
const Flow = ()=>{
    const nodeTypes = useMemo(
        () => ({
          Node: NodeFlow
        }),
        []
      );
    const computeFuncs = useMemo(
      () => ({
        Node: NodeFlowComputeOutput,
        OutputHandle: HandleComputeOutput,
        InputHandle:  HandleComputeInput
      }),
      []
    );
    const {stateRef: fullState, setKeys} = useContext(StoreContext)
    const {flowNodes, flowEdges} = useMemo(()=>{
      let {flowNodes, flowEdges, storeObjectList} = splitNodesList(nodesInitial)
      setKeys(storeObjectList.map(n=>({...n, computeOutput:computeFuncs[n.type]})))
      return {flowNodes, flowEdges}
    },[setKeys])  
    const [nodes, setNodes]= useState(flowNodes)
    const [edges, setEdges]= useState(flowEdges)
    const onNodesChange = useCallback(
      (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
      [setNodes]
    );
    const onRemoveNodes = useCallback((ns)=>{
      ns.forEach(node=>{
        // find dependant
        let outputNodes = snapshot(fullState[node.id].rootState).dependencies
        // 
        let dependantEdges = getDependantNodes(outputNodes, edges)
        // delete fullState[node.id]
        dependantEdges.forEach(({targetHandle})=>{
          fullState[targetHandle].rootState.dependencies = []
        })
      })
    },[fullState, edges])
    const onEdgesChange = useCallback(
      (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
      [setEdges]
    );
    
    const onRemoveEdges = useCallback((es) => {
      es.forEach((e) => {
        let { targetHandle } = e;
        fullState[targetHandle].rootState.dependencies = []
      });      
    },[fullState]);
    const onConnect = useCallback( (newEdges: any) =>{
      setEdges(eds=>{
        if (!Array.isArray(newEdges)) newEdges = [newEdges];
        return newEdges.reduce((newEds, newEdge) => {
          let { sourceHandle, targetHandle } = newEdge;
          if (targetHandle){
            // eliminem els edges amb la mateixa target & targetHandler
            let [toRemove, toSave] = filterSplit(
              newEds,
              (edge) => edge.sourceHandle===sourceHandle || edge.targetHandle === targetHandle
            );
            // executem onRemove per cada un dels eliminats
            onRemoveEdges(toRemove)//; NO CAL pk ya modifiquem next: toRemove
            // subscribim al nodeTarget als canvis de la source i guardem l'unsubscribe dins l'estat del nodeTarget (sourceSubscriptions)
            // connect(nodeSource, sourceHandle, nodeTarget, targetHandle)
            fullState[targetHandle].rootState.dependencies = [sourceHandle]

            // afegim l'edge als edges restants
              return addEdge(newEdge, toSave);
          }
          return eds
        }, eds);
      })
    },[setEdges, fullState, onRemoveEdges])
    return <ReactFlowProvider>
          <div
            className="reactflow-wrapper"
            style={{ width: 1200, height: 900 }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onConnect={onConnect}
              onNodesChange={onNodesChange}
              onNodesDelete={onRemoveNodes}
              onEdgesChange={onEdgesChange}
              onEdgesDelete={onRemoveEdges}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="top-right"
            >
              <Controls />
              <Background color="#aaa" gap={16} />

              {/* <div className="lang_selector">
              <button onClick={()=>changeLang(lang3=>lang3=='es'?'en':'es')}>change lang2</button><br/>
              <label>Language2:{lang2}</label><br/>
                <label>Language:</label>
                <input
                  value={lang}
                  onChange={(evt) => setLang(evt.target.value)}
                />
              </div> */}
            </ReactFlow>
          </div>
        </ReactFlowProvider>
}
export default Flow