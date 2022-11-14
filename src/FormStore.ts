import React, { useRef } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { proxy, subscribe, snapshot } from 'valtio';

export const ProxyStateInput = proxy<Record<string,{value:any}>>({})
export const ProxyStateOutput = proxy<Record<string,{output:any}>>({})
export const FormContext = React.createContext({})
export const getKey = <T,K>(k:string)=>{
  if (!ProxyStateInput[k]){
    ProxyStateInput[k] = proxy({value:null})
  }
  if (!ProxyStateOutput[k]){
    ProxyStateOutput[k] = proxy({output:null})
  }
  return {valueState: ProxyStateInput[k] as {value:T}, outputState:ProxyStateOutput[k]  as {output:K}}
}
export const useKey = <T,K>(k)=>{
  return useMemo(()=>{
    return getKey<T,K>(k)
  },[k])
}
const useSubscriptionState = (newDeps, id, callback=(newS)=>{})=>{
    const [sourceSubs, setSourceSubscriptions] = useState<Record<string,()=>void>>({})
    const [sourceData, setSourceData] = useState<Record<string,any>>({})
    // const [derivedSourceData, setDerivedSourceData] = useState(proxy({}))
    // const [sourceDataState, setSourceDataState] = useState
    const subscriptionCallback = useCallback((k, v)=>{
        // console.log(k, v, id)
        setSourceData((sd)=>({...sd, [k]:v}))
    },[])
    const prevDeps = useMemo(()=>Object.keys(sourceSubs),[sourceSubs])
    useEffect(()=>{
        if (prevDeps.length!==newDeps.length){
            console.log("subscribed!")
            setSourceSubscriptions(sourceS=>{
                let newSourceS = {...sourceS}
                // try{
                newDeps?.forEach(d=>{
                    if (!sourceS[d]){
                        let {outputState} = getKey(d)
                        newSourceS[d] = subscribe(outputState, (v)=>{
                            if (isPromise(outputState.output)){
                                let promiseOutput = outputState.output as Promise<any>
                                promiseOutput.then(result=>{
                                    subscriptionCallback(d, result)
                                })
                            }else subscriptionCallback(d, outputState.output)
                        })
                        // init
                        // subscriptionCallback(d, outputState.output)
                        if (isPromise(outputState.output)){
                            let promiseOutput = outputState.output as Promise<any>
                            promiseOutput.then(result=>{
                                subscriptionCallback(d, result)
                            })
                        }else subscriptionCallback(d, outputState.output)
                    }
                })
                Object.entries(sourceS).filter(([k])=>!newDeps?.includes(k)).forEach(([k, unsubscribe])=>{
                    unsubscribe()
                    delete newSourceS[k]
                    subscriptionCallback(k, undefined)
                })
                // }catch(ex){
                //     debugger
                // }
                return newSourceS
            })
        }
        
    },[subscriptionCallback, newDeps, prevDeps])
    useEffect(()=>{
        if (callback) callback(sourceData)
    },[callback, sourceData])
    return sourceData
}
const isPromise = (value)=>{
    return value && typeof value['then'] == 'function'
}
export const useEffectWithoutFirstRun = (effect: () => void, deps: any[]) => {
    const isFirstRun = useRef(true);
    useEffect (() => {
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }
      return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
  }
// const useSubscribe = ()=>{
//     const [, setSubscriptions] = useState<{state: any, unsubscribe:()=>void}[]>([])
//     const subscribeAltered = useCallback((state, callback)=>{
//         let newSubscription =  subscribe(state, callback)
//         setSubscriptions(prevSubs=>{
//             let found = prevSubs.find((stateS)=>stateS===state)
//             if (found){
//                 found.unsubscribe()
//                 prevSubs = prevSubs.filter((stateS)=>stateS!==state)
//             }
//             return [...prevSubs, {state,unsubscribe: newSubscription}]
//         })
//         return newSubscription
//     },[])
//     return subscribeAltered
// }
export const useInputState = <T,K>(id:string, dependencies:string[], computeOutput: (oldValue:any, sourceData:Record<string,any>)=>K, initialValue:T|null=null)=>{
    const {valueState, outputState} = useKey<T,K>(id)
    const [localValue, setLocalValue] = useState<T|undefined>(initialValue||undefined)
    const sourceData = useSubscriptionState(dependencies||[], id)
    const refreshOutput = useCallback((value, sources)=>{
        let valueOutput = computeOutput(value,sources)
        // if (valueOutput['then']!=null){
        //     valueOutput['then'](result=>{
        //         outputState.output = result
        //     })
        // }else
        outputState.output = valueOutput
    }, [computeOutput, outputState])
    useEffect(()=>{
        // on valueState change
        subscribe(valueState, (opObj)=>{
            let [op, k, newV, oldValue]: any = opObj[0]
            console.log('changing to', newV, id)
            setLocalValue(newV)
        })
        if (initialValue!=null){
            valueState.value = initialValue!
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    // on sourceData OR value change
    useEffect(()=>{
        refreshOutput(localValue, sourceData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[sourceData, localValue])
    const setValue = useCallback((newValue:T|((oldT:any)=>T)|Promise<T>)=>{
        if (typeof newValue==='function'){
            let newValueFunc = newValue as (oldT:any)=>T
            // is this right?
            let valueSnap = snapshot(valueState)
            valueState.value = newValueFunc(valueSnap)
        }else if (newValue['then']!=null){
            console.log('notyet')
        }else{
            valueState.value = newValue as T
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[valueState])
    return {valueState, outputState, sourceData, setValue }
}
export const setInputState = <T,>(id:string, value:T)=>{
    const {valueState} = getKey(id)
    valueState.value = value
}