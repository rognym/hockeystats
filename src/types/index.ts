// Type definitions for the hockey statistics application

export interface TableExtractionResult {
  url: string;
  tableHtml: string;
  success: boolean;
  error?: string;
  debugInfo?: string;
}

export interface TeamOverviewResult {
  url: string;
  overviewHtml: string;
  success: boolean;
  error?: string;
  debugInfo?: string;
}