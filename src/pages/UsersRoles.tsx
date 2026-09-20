import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const roles=["Super Admin","Admin","HR Manager","Payroll Manager","Accountant","Manager","Employee"]
const modules=["Employees","Payroll","Leave","Reports","Compliance","Settings"]

export default function UsersRoles(){
  return <div className="space-y-4">
    <Tabs defaultValue="users"><div className="flex justify-between"><h1 className="text-xl font-semibold">Users & Roles</h1><TabsList><TabsTrigger value="users">Users</TabsTrigger><TabsTrigger value="roles">Roles & Permissions</TabsTrigger></TabsList></div>
      <TabsContent value="users">
        <Card><Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last Active</TableHead></TableRow></TableHeader>
        <TableBody>
          <tr><td className="p-3 flex items-center gap-2"><img src="https://i.pravatar.cc/150?img=12" className="h-7 w-7 rounded-full"/>Admin User</td><td className="p-3">admin@paymatrix.com</td><td className="p-3"><Badge>Super Admin</Badge></td><td className="p-3"><Badge variant="success">Active</Badge></td><td className="p-3">Now</td></tr>
          <tr><td className="p-3 flex items-center gap-2"><img src="https://i.pravatar.cc/150?img=5" className="h-7 w-7 rounded-full"/>Priya Sharma</td><td className="p-3">priya@paymatrix.com</td><td className="p-3"><Badge variant="secondary">HR Manager</Badge></td><td className="p-3"><Badge variant="success">Active</Badge></td><td className="p-3">2 hours ago</td></tr>
        </TableBody></Table></Card>
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
