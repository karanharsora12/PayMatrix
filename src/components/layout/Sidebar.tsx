import { NavLink, useLocation } from "react-router-dom"
import { LayoutDashboard, Building2, Users, CalendarDays, Clock, Wallet, ShieldCheck, BarChart3, Settings, ChevronDown, Building, Layers, MapPin, UserCog, File, Landmark, Timer, CalendarRange, Palmtree, FileText, Coins, Layers2, UserCheck, Receipt, Gift, MinusCircle, Banknote, Scale, ClipboardList, UsersRound, History, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const nav = [
  { label:"Dashboard", icon:LayoutDashboard, path:"/" },
  { group:"Organization", items:[
    {label:"Company", icon:Building, path:"/organization/company"},
    {label:"Branches", icon:Building2, path:"/branches"},
    {label:"Departments", icon:Layers, path:"/departments"},
    {label:"Designations", icon:Layers2, path:"/designations"},
    {label:"Locations", icon:MapPin, path:"/locations"},
  ]},
  { group:"Employees", items:[
    {label:"Employees", icon:Users, path:"/employees"},
    {label:"Employee Groups", icon:UsersRound, path:"/employee-groups"},
    {label:"Documents", icon:File, path:"/documents"},
    {label:"Bank Accounts", icon:Landmark, path:"/bank-accounts"},
  ]},
  { group:"Attendance", items:[
    {label:"Attendance", icon:Clock, path:"/attendance"},
    {label:"Attendance Register", icon:ClipboardList, path:"/attendance-register"},
    {label:"Shifts", icon:Timer, path:"/shifts"},
    {label:"Holidays", icon:CalendarRange, path:"/holidays"},
    {label:"Overtime", icon:Timer, path:"/overtime"},
  ]},
  { group:"Leave", items:[
    {label:"Leave Types", icon:Palmtree, path:"/leave-types"},
    {label:"Leave Requests", icon:FileText, path:"/leave-requests"},
    {label:"Leave Balances", icon:Scale, path:"/leave-balances"},
    {label:"Leave Calendar", icon:CalendarDays, path:"/leave-calendar"},
  ]},
  { group:"Payroll", items:[
    {label:"Salary Components", icon:Coins, path:"/salary-components"},
    {label:"Salary Structures", icon:SlidersHorizontal, path:"/salary-structures"},
    {label:"Employee Salary", icon:UserCheck, path:"/employee-salary"},
    {label:"Payroll Runs", icon:Wallet, path:"/payroll"},
    {label:"Payslips", icon:Receipt, path:"/payslips"},
    {label:"Bonuses", icon:Gift, path:"/bonuses"},
    {label:"Deductions", icon:MinusCircle, path:"/deductions"},
    {label:"Loans", icon:Banknote, path:"/loans"},
    {label:"Advances", icon:Banknote, path:"/advances"},
  ]},
  { group:"Compliance", items:[
    {label:"Tax", icon:Scale, path:"/compliance/tax"},
    {label:"PF / Provident Fund", icon:ShieldCheck, path:"/compliance/pf"},
    {label:"ESI", icon:ShieldCheck, path:"/compliance/esi"},
  ]},
  { group:"Reports", items:[
    {label:"Reports", icon:BarChart3, path:"/reports"},
  ]},
  { group:"Administration", items:[
    {label:"Users", icon:UserCog, path:"/users"},
    {label:"Roles & Permissions", icon:ShieldCheck, path:"/roles"},
    {label:"Audit Logs", icon:History, path:"/audit-logs"},
    {label:"Settings", icon:Settings, path:"/settings"},
  ]},
]

export function Sidebar({collapsed, onCollapse, mobileOpen, setMobileOpen}:{collapsed:boolean,onCollapse:(v:boolean)=>void,mobileOpen:boolean,setMobileOpen:(v:boolean)=>void}){
  const loc=useLocation()
  const [openGroups,setOpenGroups]=useState<Record<string,boolean>>({Organization:true,Employees:true,Payroll:true})
  const toggle=(g:string)=>setOpenGroups(s=>({...s,[g]:!s[g]}))
  const content=(
    <div className={cn("flex flex-col h-full bg-[#fcfcfd] dark:bg-zinc-900 border-r", collapsed?"w-[64px]":"w-[260px]")}>
      <div className="h-[56px] flex items-center gap-3 px-4 border-b shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">PM</div>
        {!collapsed&&<div><div className="text-sm font-semibold leading-none">PayMatrix</div><div className="text-[11px] text-muted-foreground">Payroll & HRMS</div></div>}
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {nav.map((item:any)=>{
          if(item.path) return <NavLink key={item.path} to={item.path} className={({isActive})=>cn("flex items-center gap-3 px-2.5 py-2 rounded-md text-sm", isActive?"bg-primary text-primary-foreground":"hover:bg-accent text-muted-foreground hover:text-foreground", collapsed&&"justify-center")}>
            <item.icon className="h-4 w-4 shrink-0"/>{!collapsed&&item.label}
          </NavLink>
          const isOpen=openGroups[item.group]??false
          return <div key={item.group}>
            {!collapsed? <button onClick={()=>toggle(item.group)} className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              {item.group} <ChevronDown className={cn("h-3 w-3 transition", isOpen&&"rotate-180")}/>
            </button>: <div className="h-px bg-border my-2"/>}
            {(isOpen||collapsed)&&<div className="space-y-0.5">
              {item.items.map((it:any)=><NavLink key={it.path} to={it.path} className={({isActive})=>cn("flex items-center gap-3 px-2.5 py-1.5 rounded-md text-[13px]", isActive?"bg-primary text-primary-foreground":"hover:bg-accent text-zinc-600 dark:text-zinc-400 hover:text-foreground", collapsed&&"justify-center")}>
                <it.icon className="h-4 w-4 shrink-0"/>{!collapsed&&it.label}
              </NavLink>)}
            </div>}
          </div>
        })}
      </div>
      <div className="p-3 border-t">
        {!collapsed&&<div className="rounded-lg bg-primary/10 p-3">
          <div className="text-xs font-medium">Payroll Due</div><div className="text-[11px] text-muted-foreground">September 2026 processing</div>
          <div className="mt-2 h-1.5 bg-primary/20 rounded-full"><div className="h-full w-[89%] bg-primary rounded-full"/></div>
        </div>}
      </div>
    </div>
  )
  return <>
    <div className={cn("hidden lg:flex shrink-0 transition-all", collapsed?"w-[64px]":"w-[260px]")}>{content}</div>
    {mobileOpen&&<div className="fixed inset-0 z-50 lg:hidden flex">
      <div className="flex-1 bg-black/40" onClick={()=>setMobileOpen(false)}/>
      <div className="w-[280px] bg-background h-full overflow-auto">{content}</div>
    </div>}
  </>
}
