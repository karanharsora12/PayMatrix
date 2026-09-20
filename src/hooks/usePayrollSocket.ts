import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001';

export function usePayrollSocket(payrollRunId?: string) {
  const [progress, setProgress] = useState<{ processed: number; total: number; percentage: number; status: string } | null>(null);

  useEffect(() => {
    if (!payrollRunId) return;
    const socket: Socket = io(`${WS_URL}/payroll`, { transports: ['websocket'] });
    socket.on(`payroll:${payrollRunId}:progress`, (data: any) => setProgress(data));
    socket.on('payroll:progress', (data: any) => {
      if (data.payrollRunId === payrollRunId) setProgress(data);
    });
    return () => { socket.disconnect(); };
  }, [payrollRunId]);

  return progress;
}
