import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function Settings(){
  return <div className="space-y-4">
    <h1 className="text-xl font-semibold">Settings</h1>
    <Tabs defaultValue="company"><TabsList className="flex-wrap h-auto"><TabsTrigger value="company">Company</TabsTrigger><TabsTrigger value="payroll">Payroll</TabsTrigger><TabsTrigger value="attendance">Attendance</TabsTrigger><TabsTrigger value="leave">Leave</TabsTrigger><TabsTrigger value="tax">Tax</TabsTrigger><TabsTrigger value="notifications">Notifications</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger></TabsList>
      <TabsContent value="company"><Card><CardHeader><CardTitle>Company Information</CardTitle></CardHeader><CardContent className="grid md:grid-cols-2 gap-4"><Input defaultValue="PayMatrix Technologies Pvt Ltd"/><Input defaultValue="info@paymatrix.com"/><Input defaultValue="Bandra Kurla Complex, Mumbai"/><Input defaultValue="22AAAAA0000A1Z5" placeholder="GSTIN"/><Button className="md:col-span-2 w-fit">Save Changes</Button></CardContent></Card></TabsContent>
      <TabsContent value="payroll"><Card><CardContent className="p-8 text-sm text-muted-foreground">Payroll settings: Pay cycle, cutoff dates, bank integration.</CardContent></Card></TabsContent>
      <TabsContent value="attendance"><Card><CardContent className="p-8 text-sm text-muted-foreground">Attendance: Grace period, overtime rules, shift defaults.</CardContent></Card></TabsContent>
      <TabsContent value="leave"><Card><CardContent className="p-8 text-sm text-muted-foreground">Leave policy configuration.</CardContent></Card></TabsContent>
      <TabsContent value="tax"><Card><CardContent className="p-8 text-sm text-muted-foreground">Tax slabs and statutory rules.</CardContent></Card></TabsContent>
      <TabsContent value="notifications"><Card><CardContent className="p-8 text-sm text-muted-foreground">Email & in-app notification preferences.</CardContent></Card></TabsContent>
      <TabsContent value="security"><Card><CardContent className="p-8 text-sm text-muted-foreground">Password policy, 2FA, session management.</CardContent></Card></TabsContent>
    </Tabs>
  </div>
}
