import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }, namespace: 'payroll' })
export class PayrollGateway {
  @WebSocketServer() server: Server;

  emitProgress(payrollRunId: string, data: { processed: number; total: number; percentage: number; status: string }) {
    this.server?.emit(`payroll:${payrollRunId}:progress`, data);
    this.server?.emit('payroll:progress', { payrollRunId, ...data });
  }
  emitNotification(userId: string, payload: any) {
    this.server?.emit(`user:${userId}:notification`, payload);
  }
}
