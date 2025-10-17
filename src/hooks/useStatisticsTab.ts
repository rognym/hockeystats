import { useState } from 'react';
import type { TableExtractionResult } from '../types';

export const useStatisticsTab = () => {
  const [isExtractingTable, setIsExtractingTable] = useState(false);
  const [tableResult, setTableResult] = useState<TableExtractionResult | null>(null);
  const [statisticsCategory, setStatisticsCategory] = useState("ScoringLeaders");
  const [leagueId, setLeagueId] = useState("18757");

  const extractTableContent = async () => {
    if (isExtractingTable) return;
    setIsExtractingTable(true);
    setTableResult(null);

    const tableUrl = `https://stats.swehockey.se/Players/Statistics/${statisticsCategory}/${leagueId}`;

    try {
      const response = await fetch(tableUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      const html = await response.text();
      let tableHtml = "";

      const tableMatch1 = html.match(
        /<table[^>]*class[^>]*=["'][^"']*tblContent[^"']*["'][^>]*>[\s\S]*?<\/table>/i
      );

      if (tableMatch1) {
        tableHtml = tableMatch1[0];
      } else {
        const tableMatch2 = html.match(
          /<table[^>]*class=['"]tblContent['"][^>]*>[\s\S]*?<\/table>/i
        );

        if (tableMatch2) {
          tableHtml = tableMatch2[0];
        } else {
          const allTableMatches = html.match(/<table[\s\S]*?<\/table>/gi);
          if (allTableMatches) {
            const tblContentTable = allTableMatches.find(
              (table) =>
                table.includes("tblContent") ||
                table.includes('class="tblContent"')
            );
            if (tblContentTable) {
              tableHtml = tblContentTable;
            }
          }
        }
      }

      if (tableHtml) {
        tableHtml = tableHtml.trim();
        const rowCount = (tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || []).length;
        const cellCount = (tableHtml.match(/<td[\s\S]*?<\/td>/gi) || []).length;

        setTableResult({
          url: tableUrl,
          tableHtml: tableHtml,
          success: true,
          debugInfo: `Table extracted successfully: ${rowCount} rows, ${cellCount} cells`,
        });
      } else {
        const allTables = html.match(/<table[\s\S]*?<\/table>/gi);
        const tableInfo = allTables
          ? `Found ${allTables.length} table(s) on the page, but none with class 'tblContent'`
          : "No tables found on the page";

        setTableResult({
          url: tableUrl,
          tableHtml: "",
          success: false,
          error: `No table with class 'tblContent' found. ${tableInfo}`,
        });
      }
    } catch (error) {
      setTableResult({
        url: tableUrl,
        tableHtml: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setIsExtractingTable(false);
  };

  return {
    isExtractingTable,
    tableResult,
    statisticsCategory,
    setStatisticsCategory,
    leagueId,
    setLeagueId,
    extractTableContent,
  };
};