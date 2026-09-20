import * as React from "react"
import { cn } from "@/lib/utils"
export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({className,...p},ref)=><div className="relative w-full overflow-auto rounded-lg border"><table ref={ref} className={cn("w-full caption-bottom text-sm",className)} {...p}/></div>)
Table.displayName="Table"
export const TableHeader = ({className,...p}:React.HTMLAttributes<HTMLTableSectionElement>)=><thead className={cn("[&_tr]:border-b bg-muted/50",className)} {...p}/>
export const TableBody = ({className,...p}:React.HTMLAttributes<HTMLTableSectionElement>)=><tbody className={cn("[&_tr:last-child]:border-0",className)} {...p}/>
export const TableRow = ({className,...p}:React.HTMLAttributes<HTMLTableRowElement>)=><tr className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",className)} {...p}/>
export const TableHead = ({className,...p}:React.ThHTMLAttributes<HTMLTableCellElement>)=><th className={cn("h-9 px-3 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider",className)} {...p}/>
export const TableCell = ({className,...p}:React.TdHTMLAttributes<HTMLTableCellElement>)=><td className={cn("p-3 align-middle",className)} {...p}/>
