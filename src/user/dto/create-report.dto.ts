import { ReportType } from '@database';

export type CreateReportArgs = {
  type: ReportType;
  category: string;
  reason: string;
  description?: string;
  reportedId?: number;
  metadata?: any;
};

export class CreateReportDto {
  type: ReportType;
  category: string;
  reason: string;
  description?: string;
  reportedId?: number;
  metadata?: any;

  constructor(args: CreateReportArgs) {
    this.type = args.type;
    this.category = args.category;
    this.reason = args.reason;
    this.description = args.description;
    this.reportedId = args.reportedId ? +args.reportedId : undefined;
    this.metadata = args.metadata;
  }
}