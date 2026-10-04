import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { DRIZZLE } from "../database/database.module";
import * as schema from "../db/schema";

import * as dotenv from "dotenv";
import * as path from "path";

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  companyId: string;
  templateId?: string | null;
  referenceType?: string;
  referenceId?: string | null;
  toEmail: string;
  cc?: string;
  bcc?: string;
  subject: string;
  bodyHtml: string;
  attachments?: EmailAttachment[];
  userId?: string | null;
}

export interface SendEmailResult {
  success: boolean;
  status: "SENT" | "FAILED" | "PENDING";
  logId?: string;
  simulated?: boolean;
  message: string;
  error?: string;
}

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly config: ConfigService,
  ) {}

  /**
   * Helper to parse and normalize SMTP credentials from ConfigService or .env
   */
  private getSmtpConfig() {
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });
    dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

    const clean = (val?: string | null) =>
      val ? val.replace(/^['"]|['"]$/g, "").trim() : "";

    const host = clean(
      this.config.get<string>("SMTP_HOST") || process.env.SMTP_HOST,
    );
    const port = Number(
      clean(this.config.get<string>("SMTP_PORT") || process.env.SMTP_PORT) ||
        587,
    );
    const user = clean(
      this.config.get<string>("SMTP_USER") ||
        process.env.SMTP_USER ||
        this.config.get<string>("SMTP_USERNAME") ||
        process.env.SMTP_USERNAME,
    );
    const pass = clean(
      this.config.get<string>("SMTP_PASS") ||
        process.env.SMTP_PASS ||
        this.config.get<string>("SMTP_PASSWORD") ||
        process.env.SMTP_PASSWORD,
    );
    const secure =
      clean(
        this.config.get<string>("SMTP_SECURE") || process.env.SMTP_SECURE,
      ) === "true" || port === 465;

    const configuredFrom = clean(
      this.config.get<string>("SMTP_FROM") || process.env.SMTP_FROM,
    );
    const defaultFrom =
      configuredFrom ||
      (user
        ? `PayMatrix HR <${user}>`
        : "PayMatrix HR <notifications@paymatrix.com>");

    return { host, port, user, pass, secure, defaultFrom };
  }

  /**
   * Universal email sending method with database logging.
   * Never throws uncaught exceptions to calling business transactions.
   */
  async sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
    const {
      companyId,
      templateId = null,
      referenceType,
      referenceId = null,
      toEmail,
      cc,
      bcc,
      subject,
      bodyHtml,
      attachments = [],
      userId = null,
    } = opts;

    let status: "SENT" | "FAILED" = "SENT";
    let errorMessage: string | null = null;
    let isSimulated = false;

    const smtp = this.getSmtpConfig();

    if (smtp.host && smtp.user && smtp.pass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,
          auth: { user: smtp.user, pass: smtp.pass },
          tls: { rejectUnauthorized: false },
        });

        await transporter.sendMail({
          from: smtp.defaultFrom,
          to: toEmail,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject,
          html: bodyHtml,
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
          })),
        });
        this.logger.log(`Email dispatched to ${toEmail}: "${subject}"`);
      } catch (err: any) {
        status = "FAILED";
        errorMessage = err.message || "SMTP transmission failure";
        this.logger.error(
          `Failed to send email to ${toEmail}: ${errorMessage}`,
        );
      }
    } else {
      // Simulated send (no SMTP credentials configured)
      isSimulated = true;
      this.logger.log(
        `[SIMULATED EMAIL] To: ${toEmail} | Subject: "${subject}" | Attachments: ${attachments.length}`,
      );
    }

    // Persist to email_logs table
    let logId: string | undefined;
    try {
      const [logRecord] = await this.db
        .insert(schema.emailLogs)
        .values({
          companyId,
          templateId,
          referenceType: referenceType || "General",
          referenceId,
          toEmail,
          cc: cc || null,
          bcc: bcc || null,
          subject,
          bodyHtml,
          status,
          sentAt: status === "SENT" ? new Date() : null,
          errorMessage: isSimulated
            ? "[Simulated - SMTP credentials not configured in environment]"
            : errorMessage,
          createdBy: userId,
        })
        .returning();
      logId = logRecord?.id;
    } catch (logErr: any) {
      this.logger.error(`Failed to record email log in DB: ${logErr.message}`);
    }

    if (status === "SENT") {
      return {
        success: true,
        status: "SENT",
        logId,
        simulated: isSimulated,
        message: isSimulated
          ? "Email simulated and logged successfully (SMTP credentials not configured)"
          : "Email sent successfully",
      };
    } else {
      return {
        success: false,
        status: "FAILED",
        logId,
        simulated: false,
        message: "Failed to dispatch email",
        error: errorMessage || "Unknown error",
      };
    }
  }
}
