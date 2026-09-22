import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataGrid } from "@/components/common/DataGrid"
import type { ColDef } from "ag-grid-community"
import { useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const roles=["Super Admin","Admin","HR Manager","Payroll Manager","Accountant","Manager","Employee"]
const modules=["Employees","Payroll","Leave","Reports","Compliance","Settings"]

const usersData = [
  { id: 1, avatar: "https://i.pravatar.cc/150?img=12", name: "Admin User", email: "admin@paymatrix.com", role: "Super Admin", status: "Active", lastActive: "Now" },
  { id: 2, avatar: "https://i.pravatar.cc/150?img=5", name: "Priya Sharma", email: "priya@paymatrix.com", role: "HR Manager", status: "Active", lastActive: "2 hours ago" },
]

export default function UsersRoles(){
  const usersColDefs = useMemo<ColDef[]>(() => [
    { 
      field: "name", 
      headerName: "User", 
      flex: 1,
      cellRenderer: (p: any) => (
        <div className="flex items-center gap-2 h-full">
          <img src={p.data.avatar} className="h-7 w-7 rounded-full" />
          <span className="font-medium text-sm">{p.value}</span>
        </div>
      )
    },
    { field: "email", headerName: "Email", width: 220 },
    { 
      field: "role", 
      headerName: "Role", 
      width: 150,
      cellRenderer: (p: any) => <Badge variant={p.value === "Super Admin" ? "default" : "secondary"}>{p.value}</Badge>
    },
    { 
      field: "status", 
      headerName: "Status", 
      width: 120,
      cellRenderer: (p: any) => <Badge variant="success">{p.value}</Badge>
    },
    { field: "lastActive", headerName: "Last Active", width: 150 }
  ], []);

  return <div className="space-y-4">
    <Tabs defaultValue="users"><div className="flex justify-between"><h1 className="text-xl font-semibold">Users & Roles</h1><TabsList><TabsTrigger value="users">Users</TabsTrigger><TabsTrigger value="roles">Roles & Permissions</TabsTrigger></TabsList></div>
      <TabsContent value="users">
        <Card><div className="h-[300px]"><DataGrid rowData={usersData} columnDefs={usersColDefs} /></div></Card>
      </TabsContent>
      <TabsContent value="roles">
        <Card><CardHeader><CardTitle>Permission Matrix</CardTitle></CardHeader><CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="text-left p-2">Module</th><th className="p-2">View</th><th className="p-2">Create</th><th className="p-2">Edit</th><th className="p-2">Delete</th><th className="p-2">Approve</th></tr></thead>
            <tbody>{modules.map(m=><tr key={m} className="border-t"><td className="p-2 font-medium">{m}</td>{[0,1,2,3,4].map(i=><td key={i} className="p-2 text-center"><input type="checkbox" defaultChecked={i<3}/></td>)}</tr>)}</tbody>
          </table>
          <Button className="mt-4">Save Permissions</Button>
        </CardContent></Card>
        <div className="grid md:grid-cols-4 gap-3 mt-4">
          {roles.map(r=><Card key={r}><CardContent className="p-3 text-sm font-medium">{r}</CardContent></Card>)}
        </div>
      </TabsContent>
    </Tabs>
  </div>
}
