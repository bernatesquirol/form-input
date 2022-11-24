
import { Node } from 'reactflow';
import { proxy } from 'valtio';
import { FlowProxyTypes } from './NodeFlow';
export type SemiNode<T> = {id: Node<T>['id'], data: Node<T>['data'], type: Node<T>['type']}
export type NodeFlowType<T> = Node<{value: T, dependencies: string[]}>&{type: FlowProxyTypes.Node}
export type InputFlowType = {type: FlowProxyTypes.InputHandle}&SemiNode<{value:{label:string}, dependencies: string[]}>
export type OutputFlowType = {type: FlowProxyTypes.OutputHandle}&SemiNode<{value:{label:string}, dependencies: string[]}>

export const nodes: (NodeFlowType<any>|InputFlowType|OutputFlowType)[] = [
  {
    id: '0',
    type: FlowProxyTypes.Node,
    data: {
      value: {nodeValue:'nom'},
      dependencies: [],
    },
    position: { x: 0, y:0},
  },
  {
    id: "0-output",
    type:FlowProxyTypes.OutputHandle,
    data:{
      value:{label: "output"}, 
      dependencies: ['0']}
    },
  {
    id: '2',
    type: FlowProxyTypes.Node,
    data: {
      value:{nodeValue: 'web'},
      dependencies: []
      // inputs: [],
      // outputs: [{id: "2-output", label: "output"}],
    },
    position: { x: 500, y:0}
  },
  {
    id: "2-output", 
    type:FlowProxyTypes.OutputHandle,
    data:{
      value:{label: "output"}, 
      dependencies: ['2']}
  },
  {
    id: "1-input-1", 
    type: FlowProxyTypes.InputHandle,
    data:{
      value:{label: "saludu"}, 
      dependencies: ['0-output']}
  },
  {
    id: "1-input-2", 
    type: FlowProxyTypes.InputHandle,
    data:{
      value:{label: "web"}, 
      dependencies: ['2-output']}
  },
  {
    id: '1',
    type: FlowProxyTypes.Node,
    data: {
      value:{nodeValue: 'Hola ${saludu}, benvingut a ${web}'},
      dependencies: ["1-input-1", '1-input-2']
    },
    position: { x: 0, y:500}
  }
]
