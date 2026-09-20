import { useState, useEffect } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { Outlet } from "react-router-dom"
import { Toaster } from "sonner"

export function AppShell({onOpenCommand}:{onOpenCommand:()=>void}){
  const [collapsed,setCollapsed]=useState(false)
  const [mobileOpen,setMobileOpen]=useState(false)
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){ e.preventDefault(); onOpenCommand()}}
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h)
  },[onOpenCommand])
  return <div className="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-zinc-950">
    <Sidebar collapsed={collapsed} onCollapse={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
    <div className="flex-1 flex flex-col min-w-0">
      <Header onToggleSidebar={()=>setCollapsed(!collapsed)} onToggleMobile={()=>setMobileOpen(!mobileOpen)} onOpenCommand={onOpenCommand}/>
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <Outlet/>
      </main>
    </div>
    <Toaster richColors position="top-right"/>
  </div>
}
