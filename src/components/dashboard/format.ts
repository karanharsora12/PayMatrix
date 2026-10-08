export const formatTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "—";
