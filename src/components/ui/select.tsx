import * as React from "react"
import { cn } from "@/lib/utils"
export function Select({value,onValueChange,children}:{value?:string,onValueChange?:(v:string)=>void,children:React.ReactNode}){
  return <div className="relative">{React.Children.map(children,(child:any)=> React.cloneElement(child,{value,onValueChange}))}</div>
}
export function SelectTrigger({children,className}:{children:React.ReactNode,className?:string}){return <div className={cn("flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",className)}>{children}</div>}
export function SelectContent({children}:{children:React.ReactNode}){return <div>{children}</div>}
export function SelectItem({children}:{children:React.ReactNode}){return <div className="px-2 py-1 text-sm">{children}</div>}
export function NativeSelect({value,onChange,children,className,placeholder}:{value?:string,onChange?:(v:string)=>void,children:React.ReactNode,className?:string,placeholder?:string}){
  return <select value={value} onChange={e=>onChange?.(e.target.value)} className={cn("flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm",className)}>
    {placeholder&&<option value="">{placeholder}</option>}
    {children}
  </select>
}
