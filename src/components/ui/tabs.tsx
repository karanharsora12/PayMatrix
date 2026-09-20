import * as React from "react"
import { cn } from "@/lib/utils"
const TabsContext = React.createContext<{value:string,setValue:(v:string)=>void}|null>(null)
export function Tabs({defaultValue,children,className}:{defaultValue:string,children:React.ReactNode,className?:string}){
  const [value,setValue]=React.useState(defaultValue)
  return <TabsContext.Provider value={{value,setValue}}><div className={cn(className)}>{children}</div></TabsContext.Provider>
}
export function TabsList({children,className}:{children:React.ReactNode,className?:string}){
  return <div className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",className)}>{children}</div>
}
export function TabsTrigger({value,children}:{value:string,children:React.ReactNode}){
  const ctx=React.useContext(TabsContext)!
  const active=ctx.value===value
  return <button onClick={()=>ctx.setValue(value)} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",active&&"bg-background text-foreground shadow")}>{children}</button>
}
export function TabsContent({value,children,className}:{value:string,children:React.ReactNode,className?:string}){
  const ctx=React.useContext(TabsContext)!
  if(ctx.value!==value) return null
  return <div className={cn("mt-4",className)}>{children}</div>
}
