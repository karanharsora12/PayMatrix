import type { GridApi } from "ag-grid-community";
import { toast } from "sonner";

/**
 * Export grid data as a CSV file (opens in Excel).
 * Uses AG Grid's native exportDataAsCsv() API.
 */
export function gridExportExcel(api: GridApi, filename?: string) {
  api.exportDataAsCsv({
    fileName: filename ?? `export_${new Date().toISOString().slice(0, 10)}.csv`,
    skipPinnedBottom: true,
  });
  toast.success("Exported to Excel/CSV");
}

/**
 * Open a clean print window using the grid's current data via getDataAsCsv.
 * Parses the CSV and renders a styled A4 HTML print page.
 */
export function gridPrint(api: GridApi, title: string) {
  const csv = api.getDataAsCsv({ skipPinnedBottom: true });
  if (!csv) {
    toast.error("No data to print");
    return;
  }

  // Parse CSV into headers + rows
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) =>
    line.split(",").map((cell) => cell.replace(/^"|"$/g, ""))
  );

  const theadHtml = headers
    .map(
      (h) =>
        `<th style="padding:8px 10px;border-bottom:2px solid #0f766e;background:#f0fdfa;color:#115e59;font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:.05em;text-align:left">${h}</th>`
    )
    .join("");

  const tbodyHtml = rows
    .map((cells, i) => {
      const bg = i % 2 === 0 ? "#fff" : "#f8fafc";
      const tds = cells
        .map(
          (c) =>
            `<td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#1e293b">${c || "—"}</td>`
        )
        .join("");
      return `<tr style="background:${bg}">${tds}</tr>`;
    })
    .join("");

  const printDate = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title} – Report</title>
  <style>
    @page{size:A4 landscape;margin:12mm}
    *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
    body{margin:0;padding:20px;color:#0f172a}
    .hdr{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12px;border-bottom:2px solid #0d9488;margin-bottom:16px}
    .brand{font-size:20px;font-weight:800;color:#0f766e;letter-spacing:-.02em}
    .ttl{font-size:16px;font-weight:600;color:#334155;margin-top:2px}
    .meta{text-align:right;font-size:11px;color:#64748b;line-height:1.5}
    table{width:100%;border-collapse:collapse}
    .ftr{margin-top:20px;padding-top:8px;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8}
  </style>
</head>
<body>
  <div class="hdr">
    <div><div class="brand">PayMatrix</div><div class="ttl">${title}</div></div>
    <div class="meta"><div>Printed: <strong>${printDate}</strong></div><div>Records: <strong>${rows.length}</strong></div></div>
  </div>
  <table><thead><tr>${theadHtml}</tr></thead><tbody>${tbodyHtml}</tbody></table>
  <div class="ftr"><span>PayMatrix HRMS &amp; Payroll</span><span>Confidential</span></div>
  <script>window.onload=()=>{window.focus();window.print()}</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=1000,height=750");
  if (!w) { toast.error("Popup blocked — allow popups to print"); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/**
 * PDF export — same as print (browser Save-as-PDF).
 */
export function gridExportPdf(api: GridApi, title: string) {
  toast.info("Opening PDF print view…");
  gridPrint(api, title);
}
