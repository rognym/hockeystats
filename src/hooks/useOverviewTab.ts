import { useState } from 'react';
import type { TeamOverviewResult } from '../types';
import { convertOpenOnlineWindowLinks, addMobileHidingClasses } from '../utils/htmlUtils';

export const useOverviewTab = () => {
  const [isExtractingOverview, setIsExtractingOverview] = useState(false);
  const [overviewResult, setOverviewResult] = useState<TeamOverviewResult | null>(null);
  const [overviewLeagueId, setOverviewLeagueId] = useState("19041");

  const extractTeamOverview = async () => {
    if (isExtractingOverview) return;
    setIsExtractingOverview(true);
    setOverviewResult(null);

    const overviewUrl = `https://stats.swehockey.se/ScheduleAndResults/Schedule/${overviewLeagueId}`;

    try {
      const response = await fetch(overviewUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch overview page: ${response.status}`);
      }

      const html = await response.text();
      let overviewHtml = "";

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
          overviewHtml = html.substring(startIndex, endIndex);
        }
      }

      if (overviewHtml) {
        overviewHtml = overviewHtml.trim();

        // Convert JavaScript openonlinewindow links to proper HTTPS URLs
        overviewHtml = convertOpenOnlineWindowLinks(overviewHtml);

        // Add d-none class to specific columns for mobile hiding
        overviewHtml = addMobileHidingClasses(overviewHtml);

        const divCount = (overviewHtml.match(/<div[^>]*>/gi) || []).length;
        const tableCount = (overviewHtml.match(/<table[^>]*>/gi) || []).length;
        const textLength = overviewHtml.replace(/<[^>]*>/g, "").trim().length;

        setOverviewResult({
          url: overviewUrl,
          overviewHtml: overviewHtml,
          success: true,
          debugInfo: `Overview extracted: ${textLength} chars, ${divCount} divs, ${tableCount} tables`,
        });
      } else {
        const hasTSMstats = html.includes("TSMstats");
        const hasContainerFluid = html.includes("container-fluid");

        setOverviewResult({
          url: overviewUrl,
          overviewHtml: "",
          success: false,
          error: `No TSMstats container found. TSMstats present: ${hasTSMstats}, container-fluid present: ${hasContainerFluid}`,
        });
      }
    } catch (error) {
      setOverviewResult({
        url: overviewUrl,
        overviewHtml: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setIsExtractingOverview(false);
  };

  return {
    isExtractingOverview,
    overviewResult,
    overviewLeagueId,
    setOverviewLeagueId,
    extractTeamOverview,
  };
};