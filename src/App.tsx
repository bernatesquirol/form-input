import {  useState } from 'react';
import './App.css';
import BasicForm from './BasicForm';
import Flow from './flow/Flow';
import { StoreContextProvider } from './FormStore';

// import Node from './Node'


function App() {
  // const [dependencies, setDeps] = useState({'D': ['A'], 'C':["A"]})
  // const [createD, setCreateD]  = useState(false)
  
  return (
    <StoreContextProvider>
      <Flow/>
      {/* <BasicForm/> */}
    </StoreContextProvider>
  );
}
// const getRandomFromList = (list, excluded: any[]=[])=>{
//   let domain = list.filter(l=>!excluded.includes(l))
//   return domain[Math.floor(Math.random()*domain.length)]
// }
export default App
