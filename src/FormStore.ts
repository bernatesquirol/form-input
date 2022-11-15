import React, { useRef } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { proxy, snapshot } from "valtio";
import { derive } from "valtio/utils";
export const ProxyState = proxy<
  Record<
    string,
    {
      outputState: any;
      sourceDataState: any;
      rootState: { dependencies: string[]; value: any };
    }
  >
>({});
export const ProxyStateInput = proxy<Record<string, { value: any }>>({});
export const ProxyStateOutput = proxy<Record<string, { output: any }>>({});
export const ProxyStateDeps = proxy<Record<string, { dependencies: string[] }>>(
  {}
);
// function later(delay, value) {
//     return new Promise(resolve => setTimeout(resolve, delay, value));
// }
// const computeFunc = async (value,sourceData)=>{
//     console.log("PAID!")
//     return later(300,`${value} deps: ${JSON.stringify(sourceData)}`)
// }
export const getKey = <T, K>(
  k: string,
  computeFunc?: (val: T, sourceData: Record<string, K>) => void,
  initialValue?,
  isReference = true
) => {
  if (!ProxyState[k] && isReference) {
    console.log("createdKey", k);
    let rootState = proxy({ value: initialValue as any, dependencies: [] });
    let sourceDataState = derive({
      sourceData: (get) =>
        Object.fromEntries(
          (get(rootState).dependencies || [])
            .map((d) => {
              if (d !== k) {
                let existingKey = getKey(d, undefined, undefined, false);
                if (existingKey) {
                  let value = get(existingKey.outputState).output;
                  if (value instanceof Promise) {
                    value = new Promise((resolve, reject) => {
                      return value
                        .then((result: any) => {
                          if (result["error"]) {
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
        ),
    });
    let outputState = derive({
      output: (get) => {
        let rootStateValue = get(rootState).value;
        let sourceDataValue = get(sourceDataState).sourceData;
        return new Promise((resolve, reject) => {
          try {
            computeFunc &&
              resolve(computeFunc!(rootStateValue, sourceDataValue));
          } catch (ex) {
            reject({ error: ex });
          }
        });
      },
    });
    ProxyState[k] = { outputState, sourceDataState, rootState };
  } else if (ProxyState[k] && (computeFunc || initialValue)) {
    console.log("somebody arrived here first!", k);
  }
  console.log("getKey", k);
  return ProxyState[k];
};
export const useKey = <T, K>(k, computeFunc, initialValue) => {
  return useMemo(() => {
    return getKey<T, K>(k, computeFunc, initialValue);
  }, [k, computeFunc]);
};

export const useEffectWithoutFirstRun = (effect: () => void, deps: any[]) => {
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
export const useReadInputState = () => {};
export const useInputState = <T, K>(
  id: string,
  dependencies: string[],
  computeOutput: (oldValue: any, sourceData: Record<string, any>) => K,
  initialValue: T | null = null
) => {
  const { outputState, rootState } = useKey<T, K>(
    id,
    computeOutput,
    initialValue
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    rootState.dependencies = dependencies;
  }, [dependencies]);
  // const valueState = derive({value:(get)=>get(wholeState).value})
  // const outputState = derive({output:(get)=>get(wholeState).output})
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [rootState.value]
  );
  // useEffect(() => {
  //   if (initialValue != null) {
  //     setValue(initialValue!)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [setValue]);
  return { rootState, outputState, setValue };
};
// export const setInputState = <T>(id: string, value: T) => {
//   const { valueState } = getKey(id);
//   valueState.value = value;
// };
