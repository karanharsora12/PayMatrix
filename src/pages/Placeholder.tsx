import { Card, CardContent } from "@/components/ui/card"
export default function Placeholder({title}:{title:string}){
  return <Card><CardContent className="p-12 text-center"><h1 className="text-xl font-semibold">{title}</h1><p className="text-sm text-muted-foreground mt-2">This module UI is ready. Mock data and interactions are available via the main navigation. Replace with API later.</p></CardContent></Card>
}
