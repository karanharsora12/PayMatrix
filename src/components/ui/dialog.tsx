import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
export function Dialog({open,onOpenChange,children}:{open:boolean,onOpenChange:(o:boolean)=>void,children:React.ReactNode}){
  if(!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>onOpenChange(false)}/>
    <div className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-auto">{children}</div>
  </div>
}
export function DialogContent({children,className,onClose}:{children:React.ReactNode,className?:string,onClose?:()=>void}){
  return <div className={cn("bg-card border rounded-xl shadow-xl p-6 m-4",className)}>
    {onClose&&<button onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"><X className="h-4 w-4"/></button>}
    {children}
  </div>
}
export function DialogHeader({children}:{children:React.ReactNode}){return <div className="flex flex-col space-y-1.5 mb-4">{children}</div>}
export function DialogTitle({children,className}:{children:React.ReactNode,className?:string}){return <h3 className={cn("text-lg font-semibold",className)}>{children}</h3>}
export function DialogDescription({children}:{children:React.ReactNode}){return <p className="text-sm text-muted-foreground">{children}</p>}
