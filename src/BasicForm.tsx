import {  useState } from 'react';
import './App.css';

import Node from './Node'


function BasicForm() {
  const [dependencies, setDeps] = useState({'D': ['A'], 'C':["A"], 'B': ["C"]})
  const [createD, setCreateD]  = useState(false)
  return (
    <>
      <Node id='A' initialValue='Av' dependencies={dependencies['A']}></Node>
      <Node id='B' initialValue='Bv' dependencies={dependencies['B']} sync={true}></Node>
      <Node id='C' initialValue='Cv' dependencies={dependencies['C']}></Node>
      {createD?<Node id='D' initialValue='Dv' dependencies={dependencies['D']}></Node>:null}
      <button onClick={()=>setCreateD(true)}>createD</button>
      <button onClick={()=>{setDeps(deps=>{
        let randomV: any = getRandomFromList(['A','B','C','D'])
        let v = deps[randomV]||[]
        let to = getRandomFromList(['A','B','C','D'], [randomV, ...v])
        // deps[randomV] = 
        return {...deps, [randomV]: [...v, to]}
      })}}>create</button>
      <button onClick={()=>{setDeps(deps=>{
        let newDeps = {...deps}
        let alldeps: any = Object.entries(deps).map(([k,v]:any)=>v.map(i=>([k,i]))).flat()
        let [k, list] = getRandomFromList(alldeps)
        newDeps[k] = newDeps[k].filter(v=>v!==list)
        return newDeps
      })}}>delete</button>
      {JSON.stringify(dependencies)}
    </>
  );
}
const getRandomFromList = (list, excluded: any[]=[])=>{
  let domain = list.filter(l=>!excluded.includes(l))
  return domain[Math.floor(Math.random()*domain.length)]
}
export default BasicForm
