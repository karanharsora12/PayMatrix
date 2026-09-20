import * as React from "react"
import { cn } from "@/lib/utils"
export function Dropdown({trigger,children}:{trigger:React.ReactNode,children:React.ReactNode}){
  const [open,setOpen]=React.useState(false)
  return <div className="relative">
    <div onClick={()=>setOpen(!open)}>{trigger}</div>
    {open&&<>
      <div className="fixed inset-0 z-10" onClick={()=>setOpen(false)}/>
      <div className={cn("absolute right-0 z-20 mt-2 min-w-[12rem] rounded-md border bg-popover p-1 shadow-md")}>{children}</div>
    </>}
  </div>
}
export function DropdownItem({children,onClick,className}:{children:React.ReactNode,onClick?:()=>void,className?:string}){
  return <button onClick={onClick} className={cn("flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent",className)}>{children}</button>
}
