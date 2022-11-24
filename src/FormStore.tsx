/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useRef } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { proxy, snapshot, subscribe } from "valtio";
import { derive } from "valtio/utils";
export const dictPromisesToPromiseDict = (dictPromises)=>{
  let keys = Object.keys(dictPromises)
  return Promise.all(Object.values(dictPromises)).then(vs=>{
      return Object.fromEntries(vs.map((v,i)=>[keys[i], v]))
  }).catch((err)=>{debugger;console.log(err)})
}
export const StoreContext = React.createContext<any>({})
export const StoreContextProvider = ({ children }) => {
  const stateRef = useRef(proxy<Record<
    string,
    {
      type?: any;
      outputState: any;
      sourceDataState: any;
      rootState: { dependencies: string[]; value: any };
    }
  >>({})).current
  const getKey = <T, K>(
    k: string,
    {type,
    computeOutput,
    initialValue,
    dependencies,
    isReference= true,
    sync = false}: FormStoreKeyParams<T,K>
  ) => {
    if (!stateRef[k] && isReference) {
      console.log("createdKey", k, dependencies);
      // if (initialDeps?.length===2) debugger
      let rootState: { value: T | undefined; dependencies: string[] } = proxy({
        value: initialValue,
        dependencies: dependencies || [],
      });
      let sourceDataState = derive({
        sourceData: (get) =>{
          let dependencies = get(rootState)?.dependencies
          return Object.fromEntries(
            (dependencies || [])
              .map((d) => {
                if (d !== k) {
                  let existingKey = getKey(
                    d,
                    {isReference:false}
                  );
                  if (existingKey) {
                    let value = get(existingKey.outputState)
                      .output as Promise<any>;
                    if (value instanceof Promise) {
                      value = new Promise((resolve, reject) => {
                        return value
                          .then((result: any) => {
                            if (result && result["error"]) {
                              reject({ error: `Catch dependency ${d}` });
                            }
                            resolve(result);
                          })
                          .catch((err) =>
                            reject({ error: "resolution dependencies" })
                          );
                      });
                    }
                    return [d, value];
                  }
                }
                return undefined;
              })
              .filter((d) => d) as []
          )
        },
      });
      let outputState = derive({
        output: (get) => {
          let rootStateValueP = get(rootState).value;
          let sourceDataValueP = get(sourceDataState).sourceData;
          return Promise.all([rootStateValueP, dictPromisesToPromiseDict(sourceDataValueP)]).then(([rootStateV,sourceData])=>{
            if (computeOutput){
              return computeOutput(rootStateV, sourceData ?? undefined)
            } 
            return {rootState: rootStateV, sourceData};
          }).catch((error)=>{
            console.log({error})
          })
        },
      });
      let states = { outputState, sourceDataState, rootState, type };
      stateRef[k] = states;
      // refresh pending !
      Object.entries(stateRef).forEach(([otherK, { rootState }]) => {
        let snap = snapshot(rootState);
        if (snap.dependencies.includes(k)) {
          rootState.dependencies = [...snap.dependencies];
        }
      });
    } else if (!stateRef[k]) {
      console.log("somebody arrived here first!", k);
    }
    if (sync) {
      // let asyncOutput = stateRef[k]
      let { outputState } = stateRef[k];
      let outputSyncState = proxy<{ output: K | undefined }>({
        output: undefined,
      });
      subscribe(outputState, (changes) => {
        let outputChange = changes.find((a) => a[1].includes("output"));
        // let value = snapshot(outputState)as {output:K}
        // value.output.then(v=>{
        if (outputChange) {
          let outputValue = outputChange[2];
          if (isPromise(outputValue)) {
            (outputValue as Promise<K>).then((v) => {
              outputSyncState.output = v;
            });
          } else {
            outputSyncState.output = outputChange[2] as K;
          }
        }
        // })
      });
      return { ...stateRef[k], outputState: outputSyncState };
    }
    return stateRef[k] as {
      outputState: { output: K };
      rootState: { dependencies: string[]; value: T };
      sourceDataState: Record<string, any>;
    };
  };
  const setKeys = (collection: ({id:string}&FormStoreKeyParams<any,any>)|(({id:string}&FormStoreKeyParams<any,any>)[]))=>{
    if (!Array.isArray(collection)){
      collection = [collection]
    }
    return collection.map(({id, type, computeOutput, initialValue, dependencies,sync})=>getKey(id, {type, computeOutput, initialValue, dependencies,sync, isReference:true}))
  }
  const useKey = <T, K>(
    k,
    {type,
    computeOutput,
    initialValue,
    dependencies,
    isReference = true,
    sync = false}:FormStoreKeyParams<T,K>
  ) => {
    return useMemo(() => {
      return getKey<T, K>(
        k,
        {type,
        computeOutput,
        initialValue,
        dependencies,
        isReference,
        sync}
      );
    }, [k, computeOutput]);
  };
  const useInputState = <T, K>(
    id: string,
    {type,
    dependencies,
    computeOutput,
    initialValue,
    isReference = true,
    sync = false}: FormStoreKeyParams<T,K>
  ) => {
    console.log(id, dependencies, 'deps')
    const { outputState, rootState } = useKey<T, K>(
      id,
      {type,
      computeOutput,
      initialValue,
      dependencies,
      isReference,
      sync}
    );
    
    useEffect(() => {
      rootState.dependencies = dependencies||[];
    }, [dependencies]);
  
    const setValue = useCallback(
      (newValue: T | ((oldT: any) => T) | Promise<T>) => {
        if (typeof newValue === "function") {
          let newValueFunc = newValue as (oldT: any) => T;
          // is this right?
          let valueSnap = snapshot(rootState).value;
          rootState.value = newValueFunc(valueSnap);
        } else if (newValue["then"] != null) {
          console.log("notyet");
        } else {
          rootState.value = newValue as T;
        }
      },
      [rootState.value]
    );
    return { rootState, outputState, setValue };
  };
  return (
    <StoreContext.Provider value={{stateRef, getKey, setKeys, useKey, useInputState} as const}>{children}</StoreContext.Provider>
  )
}
// export const stateRef = proxy<
  
// >({});

type FormStoreKeyParams<T,K> = {
  type?: string,
  dependencies?: string[],
  computeOutput?: (value?: T, sourceData?: Record<string, any>) => K,
  initialValue?: T,
  isReference?: boolean,
  sync?: boolean }

const isPromise = (p) => typeof p?.then === "function";


