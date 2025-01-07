import React, {createContext, PropsWithChildren} from 'react';
import {useSet} from "react-use";

interface LegislaturasViewContextType {
  ids: Set<number>
  add: (id: number) => void
  remove: (id: number) => void
}

export const LegislaturasViewContext = createContext<LegislaturasViewContextType>({
  ids: new Set(),
  add: () => {},
  remove: () => {},
});

export const LegislaturasViewProvider: React.FC<PropsWithChildren> = ({children}) => {

  const [ids, {add, remove}] = useSet<number>();

  return (
    <LegislaturasViewContext.Provider value={{ids, add, remove}}>
      {children}
    </LegislaturasViewContext.Provider>
  );
}
