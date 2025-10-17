import { useState } from 'react';
import type { TeamOverviewResult } from '../types';
import { convertOpenOnlineWindowLinks, addMobileHidingClasses } from '../utils/htmlUtils';

export const useStandingsTab = () => {
  const [isExtractingStandings, setIsExtractingStandings] = useState(false);
  const [standingsResult, setStandingsResult] = useState<TeamOverviewResult | null>(null);
  const [standingsLeagueId, setStandingsLeagueId] = useState("19041");

  const extractStandings = async () => {
    if (isExtractingStandings) return;
    setIsExtractingStandings(true);
    setStandingsResult(null);

    const standingsUrl = `https://stats.swehockey.se/ScheduleAndResults/Standings/${standingsLeagueId}`;

    try {
      const response = await fetch(standingsUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch standings page: ${response.status}`);
      }

      const html = await response.text();
      let standingsHtml = "";

      // Find the TSMstats container-fluid div
      const tsmStartMatch = html.match(
        /<div[^>]*class[^>]*=["'][^"']*TSMstats[^"']*container-fluid[^"']*["'][^>]*>/i
      );

      if (tsmStartMatch) {
        const startIndex = html.indexOf(tsmStartMatch[0]);
        let divCount = 1;
        let endIndex = startIndex + tsmStartMatch[0].length;

        while (endIndex < html.length && divCount > 0) {
          const nextDiv = html.indexOf("<div", endIndex);
          const nextCloseDiv = html.indexOf("</div>", endIndex);

          if (nextCloseDiv === -1) break;

          if (nextDiv !== -1 && nextDiv < nextCloseDiv) {
            divCount++;
            endIndex = nextDiv + 4;
          } else {
            divCount--;
            endIndex = nextCloseDiv + 6;
          }
        }

        if (divCount === 0) {
          const containerHtml = html.substring(startIndex, endIndex);

          // Special handling for league ID 18986 - extract first 2 tables
          if (standingsLeagueId === "18986") {
            const allTableMatches = containerHtml.match(
              /<table[^>]*class[^>]*=["'][^"']*tblBorderNoPad[^"']*["'][^>]*>[\s\S]*?<\/table>/gi
            );

            if (allTableMatches && allTableMatches.length >= 2) {
              standingsHtml = allTableMatches[0] + allTableMatches[1];
            } else if (allTableMatches && allTableMatches.length === 1) {
              standingsHtml = allTableMatches[0];
            }
          } else {
            // Default behavior - find the first table with class "tblBorderNoPad"
            const tableMatch = containerHtml.match(
              /<table[^>]*class[^>]*=["'][^"']*tblBorderNoPad[^"']*["'][^>]*>[\s\S]*?<\/table>/i
            );

            if (tableMatch) {
              standingsHtml = tableMatch[0];
            }
          }
        }
      }

      if (standingsHtml) {
        standingsHtml = standingsHtml.trim();

        // Convert JavaScript openonlinewindow links to proper HTTPS URLs
        standingsHtml = convertOpenOnlineWindowLinks(standingsHtml);

        // Add d-none class to specific columns for mobile hiding
        standingsHtml = addMobileHidingClasses(standingsHtml);

        const rowCount = (standingsHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [])
          .length;
        const cellCount = (standingsHtml.match(/<td[\s\S]*?<\/td>/gi) || [])
          .length;
        const tableCount = (standingsHtml.match(/<table[^>]*>/gi) || []).length;

        setStandingsResult({
          url: standingsUrl,
          overviewHtml: standingsHtml,
          success: true,
          debugInfo: `Standings extracted: ${tableCount} table(s), ${rowCount} rows, ${cellCount} cells`,
        });
      } else {
        const hasTSMstats = html.includes("TSMstats");
        const hasContainerFluid = html.includes("container-fluid");
        const hasTblBorderNoPad = html.includes("tblBorderNoPad");

        setStandingsResult({
          url: standingsUrl,
          overviewHtml: "",
          success: false,
          error: `No standings table found. TSMstats: ${hasTSMstats}, container-fluid: ${hasContainerFluid}, tblBorderNoPad: ${hasTblBorderNoPad}`,
        });
      }
    } catch (error) {
      setStandingsResult({
        url: standingsUrl,
        overviewHtml: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setIsExtractingStandings(false);
  };

  return {
    isExtractingStandings,
    standingsResult,
    standingsLeagueId,
    setStandingsLeagueId,
    extractStandings,
  };
};