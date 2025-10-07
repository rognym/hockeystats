import { useState, useCallback, useEffect } from "react";
import "./App.css";

interface UrlTestResult {
  url: string;
  status: number | null;
  success: boolean;
  responseTime: number;
  title?: string;
  error?: string;
}

interface ExtractedUrl {
  gameId: string;
  fullUrl: string;
  title?: string;
}

interface TableExtractionResult {
  url: string;
  tableHtml: string;
  success: boolean;
  error?: string;
  debugInfo?: string;
}

interface TeamOverviewResult {
  url: string;
  overviewHtml: string;
  success: boolean;
  error?: string;
  debugInfo?: string;
}

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<UrlTestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [startId, setStartId] = useState(1000000);
  const [endId, setEndId] = useState(1100000);
  const [filterMIF, setFilterMIF] = useState(false);

  // Pull to refresh states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // Schedule URL extraction states
  const [scheduleLeagueId, setScheduleLeagueId] = useState("18986");
  const [extractedUrls, setExtractedUrls] = useState<ExtractedUrl[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // Table extraction states
  const [statisticsCategory, setStatisticsCategory] =
    useState("GoalScoringLeaders");
  const [leagueId, setLeagueId] = useState("18510");
  const [tableResult, setTableResult] = useState<TableExtractionResult | null>(
    null
  );
  const [isExtractingTable, setIsExtractingTable] = useState(false);

  // Team overview extraction states
  const [overviewLeagueId, setOverviewLeagueId] = useState("19041");
  const [overviewResult, setOverviewResult] =
    useState<TeamOverviewResult | null>(null);
  const [isExtractingOverview, setIsExtractingOverview] = useState(false);

  // Pull to refresh functionality
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Clear all data
      setResults([]);
      setExtractedUrls([]);
      setTableResult(null);
      setProgress(0);

      // Force reload the page to get latest version
      window.location.reload();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  // Add touch event listeners
  useEffect(() => {
    const app = document.querySelector(".app");
    if (app) {
      const touchStart = (e: Event) => {
        const touchEvent = e as TouchEvent;
        if (window.scrollY === 0) {
          setStartY(touchEvent.touches[0].clientY);
          setIsPulling(false);
        }
      };

      const touchMove = (e: Event) => {
        const touchEvent = e as TouchEvent;
        if (window.scrollY === 0 && startY > 0) {
          const currentY = touchEvent.touches[0].clientY;
          const distance = Math.max(0, currentY - startY);

          if (distance > 10) {
            setIsPulling(true);
            setPullDistance(Math.min(distance * 0.5, 80)); // Limit max distance

            // Prevent default scrolling when pulling
            if (distance > 20) {
              e.preventDefault();
            }
          }
        }
      };

      const touchEnd = () => {
        if (isPulling && pullDistance > 50) {
          handleRefresh();
        } else {
          setPullDistance(0);
          setIsPulling(false);
        }
        setStartY(0);
      };

      app.addEventListener("touchstart", touchStart, { passive: false });
      app.addEventListener("touchmove", touchMove, { passive: false });
      app.addEventListener("touchend", touchEnd);

      return () => {
        app.removeEventListener("touchstart", touchStart);
        app.removeEventListener("touchmove", touchMove);
        app.removeEventListener("touchend", touchEnd);
      };
    }
  }, [isPulling, pullDistance, startY]);

  const testUrl = async (id: number): Promise<UrlTestResult> => {
    const url = `https://stats.swehockey.se/Game/Events/${id}`;
    const startTime = performance.now();

    try {
      // First, check if the URL exists with a HEAD request
      const headResponse = await fetch(url, { method: "HEAD" });
      const endTime = performance.now();

      if (!headResponse.ok) {
        return {
          url,
          status: headResponse.status,
          success: false,
          responseTime: endTime - startTime,
        };
      }

      // If successful, fetch the content to extract the title
      try {
        const fullResponse = await fetch(url);
        const html = await fullResponse.text();

        // Extract title from HTML
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : "No title found";

        return {
          url,
          status: headResponse.status,
          success: true,
          responseTime: endTime - startTime,
          title: title,
        };
      } catch (titleError) {
        // If we can't fetch the full content, still return success but without title
        return {
          url,
          status: headResponse.status,
          success: true,
          responseTime: endTime - startTime,
          title: "Unable to fetch title",
        };
      }
    } catch (error) {
      const endTime = performance.now();
      return {
        url,
        status: null,
        success: false,
        responseTime: endTime - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const extractGameUrls = async () => {
    if (isExtracting) return;

    setIsExtracting(true);
    setExtractedUrls([]);

    // Clear other section results
    setTableResult(null);
    setOverviewResult(null);
    setResults([]);

    const scheduleUrl = `https://stats.swehockey.se/ScheduleAndResults/Schedule/${scheduleLeagueId}`;

    try {
      const response = await fetch(scheduleUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch schedule page: ${response.status}`);
      }

      const html = await response.text();

      // Extract all /Game/Events/[ID] URLs using regex
      const gameUrlPattern = /\/Game\/Events\/(\d+)/g;
      const matches = [...html.matchAll(gameUrlPattern)];

      // Create unique list of extracted URLs
      const uniqueUrls = new Map<string, ExtractedUrl>();

      for (const match of matches) {
        const gameId = match[1];
        const fullUrl = `https://stats.swehockey.se/Game/Events/${gameId}`;

        if (!uniqueUrls.has(gameId)) {
          uniqueUrls.set(gameId, {
            gameId,
            fullUrl,
          });
        }
      }

      // Convert to array and fetch titles for each URL
      const urlArray = Array.from(uniqueUrls.values());

      // Fetch titles for each extracted URL
      const urlsWithTitles = await Promise.all(
        urlArray.map(async (extractedUrl) => {
          try {
            const titleResponse = await fetch(extractedUrl.fullUrl);
            if (titleResponse.ok) {
              const titleHtml = await titleResponse.text();
              const titleMatch = titleHtml.match(
                /<title[^>]*>([^<]+)<\/title>/i
              );
              return {
                ...extractedUrl,
                title: titleMatch ? titleMatch[1].trim() : "No title found",
              };
            }
          } catch (error) {
            // If title fetch fails, return without title
          }
          return extractedUrl;
        })
      );

      setExtractedUrls(urlsWithTitles);
    } catch (error) {
      console.error("Error extracting URLs:", error);
      alert(
        `Error extracting URLs: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    setIsExtracting(false);
  };

  const extractTableContent = async () => {
    if (isExtractingTable) return;

    setIsExtractingTable(true);
    setTableResult(null);

    // Clear other section results
    setExtractedUrls([]);
    setOverviewResult(null);
    setResults([]);

    const tableUrl = `https://stats.swehockey.se/Players/Statistics/${statisticsCategory}/${leagueId}`;

    try {
      const response = await fetch(tableUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      const html = await response.text();

      // Try multiple approaches to extract the table
      let tableHtml = "";

      // Method 1: Try to find table with class="tblContent" using a more robust pattern
      const tableMatch1 = html.match(
        /<table[^>]*class[^>]*=["'][^"']*tblContent[^"']*["'][^>]*>[\s\S]*?<\/table>/i
      );

      if (tableMatch1) {
        tableHtml = tableMatch1[0];
      } else {
        // Method 2: Try alternative class attribute patterns
        const tableMatch2 = html.match(
          /<table[^>]*class=['"]tblContent['"][^>]*>[\s\S]*?<\/table>/i
        );

        if (tableMatch2) {
          tableHtml = tableMatch2[0];
        } else {
          // Method 3: Search for any table containing "tblContent" in class
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
        // Clean up the table HTML and ensure it's properly formatted
        tableHtml = tableHtml.trim();

        // Debug info
        const rowCount = (tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || []).length;
        const cellCount = (tableHtml.match(/<td[\s\S]*?<\/td>/gi) || []).length;

        setTableResult({
          url: tableUrl,
          tableHtml: tableHtml,
          success: true,
          debugInfo: `Table extracted successfully: ${rowCount} rows, ${cellCount} cells`,
        });
      } else {
        // Debug: Show what tables were found
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
      console.error("Error extracting table:", error);
      setTableResult({
        url: tableUrl,
        tableHtml: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setIsExtractingTable(false);
  };

  const extractTeamOverview = async () => {
    if (isExtractingOverview) return;

    setIsExtractingOverview(true);
    setOverviewResult(null);

    // Clear other section results
    setExtractedUrls([]);
    setTableResult(null);
    setResults([]);

    const overviewUrl = `https://stats.swehockey.se/ScheduleAndResults/Overview/${overviewLeagueId}`;

    try {
      const response = await fetch(overviewUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch overview page: ${response.status}`);
      }

      const html = await response.text();

      // Extract the TSMstats container content
      let overviewHtml = "";

      // Method 1: Find the TSMstats container and extract its full content including nested elements
      const tsmStartMatch = html.match(
        /<div[^>]*class[^>]*=["'][^"']*TSMstats[^"']*container-fluid[^"']*["'][^>]*>/i
      );

      if (tsmStartMatch) {
        const startIndex = html.indexOf(tsmStartMatch[0]);
        let divCount = 1;
        let endIndex = startIndex + tsmStartMatch[0].length;

        // Find the matching closing div by counting nested divs
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

      // Method 2: If Method 1 failed, try a broader search for TSMstats content
      if (!overviewHtml) {
        const broadMatch = html.match(
          /class[^>]*=["'][^"']*TSMstats[^"']*["'][^>]*>[\s\S]*?(?=<div[^>]*class(?![^>]*TSMstats)|<\/body>|<\/html>|$)/i
        );

        if (broadMatch) {
          overviewHtml = `<div ${broadMatch[0]}`;
        }
      }

      // Method 3: Extract everything between TSMstats start and a logical end point
      if (!overviewHtml) {
        const startPattern = /<div[^>]*class[^>]*TSMstats[^>]*>/i;
        const startMatch = html.match(startPattern);

        if (startMatch) {
          const startIndex = html.indexOf(startMatch[0]);
          const endPatterns = [
            /<div[^>]*class[^>]*(?!.*TSMstats)/i, // Next div without TSMstats
            /<footer/i,
            /<script/i,
            /<\/body>/i,
          ];

          let endIndex = html.length;
          endPatterns.forEach((pattern) => {
            const match = html.substring(startIndex + 1000).match(pattern); // Look after 1000 chars
            if (match) {
              const foundIndex =
                startIndex +
                1000 +
                html.substring(startIndex + 1000).indexOf(match[0]);
              if (foundIndex < endIndex) endIndex = foundIndex;
            }
          });

          overviewHtml = html.substring(startIndex, endIndex);
        }
      }

      // Method 4: Last resort - search for any content with TSMstats
      if (!overviewHtml) {
        const allDivMatches = html.match(/<div[\s\S]*?TSMstats[\s\S]*?>/gi);
        if (allDivMatches && allDivMatches.length > 0) {
          // Find the largest match (most likely to be the complete container)
          let largestMatch = "";
          allDivMatches.forEach((match) => {
            const startIndex = html.indexOf(match);
            if (startIndex !== -1) {
              // Extract a larger portion around this match
              const beforeIndex = Math.max(0, startIndex - 100);
              const afterIndex = Math.min(html.length, startIndex + 5000);
              const section = html.substring(beforeIndex, afterIndex);
              if (section.length > largestMatch.length) {
                largestMatch = section;
              }
            }
          });
          overviewHtml = largestMatch;
        }
      }

      if (overviewHtml) {
        // Clean up the HTML and ensure it's properly formatted
        overviewHtml = overviewHtml.trim();

        // Debug info
        const divCount = (overviewHtml.match(/<div[^>]*>/gi) || []).length;
        const tableCount = (overviewHtml.match(/<table[^>]*>/gi) || []).length;
        const textLength = overviewHtml.replace(/<[^>]*>/g, "").trim().length;
        const hasStats =
          overviewHtml.toLowerCase().includes("stats") ||
          overviewHtml.toLowerCase().includes("statistik") ||
          overviewHtml.toLowerCase().includes("points") ||
          overviewHtml.toLowerCase().includes("goals");

        setOverviewResult({
          url: overviewUrl,
          overviewHtml: overviewHtml,
          success: true,
          debugInfo: `Overview extracted: ${textLength} chars, ${divCount} divs, ${tableCount} tables, Stats content: ${
            hasStats ? "Yes" : "No"
          }`,
        });
      } else {
        // Debug: Show what was found in the HTML
        const hasTSMstats = html.includes("TSMstats");
        const hasContainerFluid = html.includes("container-fluid");
        const allTSMMatches = html.match(/TSMstats/gi) || [];
        const htmlSnippet = html.substring(0, 1000) + "...";

        setOverviewResult({
          url: overviewUrl,
          overviewHtml: "",
          success: false,
          error: `No TSMstats container found. TSMstats present: ${hasTSMstats}, container-fluid present: ${hasContainerFluid}, TSMstats matches: ${allTSMMatches.length}. HTML preview: ${htmlSnippet}`,
        });
      }
    } catch (error) {
      console.error("Error extracting team overview:", error);
      setOverviewResult({
        url: overviewUrl,
        overviewHtml: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setIsExtractingOverview(false);
  };

  const runTests = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setResults([]);
    setProgress(0);

    // Clear other section results
    setExtractedUrls([]);
    setTableResult(null);
    setOverviewResult(null);

    const total = endId - startId + 1;
    const batchSize = 50; // Process in batches to avoid overwhelming the browser
    let tested = 0;

    for (
      let batchStart = startId;
      batchStart <= endId;
      batchStart += batchSize
    ) {
      const batchEnd = Math.min(batchStart + batchSize - 1, endId);
      const batch = [];

      for (let id = batchStart; id <= batchEnd; id++) {
        batch.push(testUrl(id));
      }

      const batchResults = await Promise.all(batch);

      setResults((prev) => [...prev, ...batchResults]);
      tested += batchResults.length;
      setProgress((tested / total) * 100);

      // Small delay between batches to be respectful to the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  }, [startId, endId, isRunning]);

  const stopTests = () => {
    setIsRunning(false);
  };

  const successfulResults = results.filter((r) => {
    if (!r.success) return false;
    if (filterMIF) {
      // When filter is enabled, only show results that contain MIF
      return r.title && r.title.toLowerCase().includes("mif");
    }
    return true;
  });
  const failedResults = results.filter((r) => !r.success);
  const mifResults = results.filter(
    (r) => r.success && r.title && r.title.toLowerCase().includes("mif")
  );

  return (
    <div className="app">
      {/* Pull to Refresh Indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="pull-refresh-indicator"
          style={{
            transform: `translateY(${pullDistance - 60}px)`,
            opacity: isPulling
              ? Math.min(pullDistance / 50, 1)
              : isRefreshing
              ? 1
              : 0,
          }}
        >
          <div className={`refresh-icon ${isRefreshing ? "spinning" : ""}`}>
            ↻
          </div>
          <div className="refresh-text">
            {isRefreshing
              ? "Refreshing..."
              : pullDistance > 50
              ? "Release to refresh"
              : "Pull to refresh"}
          </div>
        </div>
      )}

      {/* Manual Refresh Button */}
      <div className="manual-refresh">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="refresh-button"
        >
          {isRefreshing ? "Refreshing..." : "🔄 Refresh App"}
        </button>
      </div>

      {/* Table Content Extraction Section */}
      <div className="controls">
        <div className="input-group">
          <label>
            Kategori:
            <select
              value={statisticsCategory}
              onChange={(e) => setStatisticsCategory(e.target.value)}
              disabled={isExtractingTable}
            >
              <option value="ScoringLeaders">Point Leaders</option>
              <option value="GoalScoringLeaders">Goal Scoring Leaders</option>
              <option value="AssistLeaders">Assist Leaders</option>
              <option value="DecisiveGoalLeaders">
                Game Winning Goal Leaders
              </option>
              <option value="MostPenPlayers">Most Penalized Players</option>
              <option value="LeadingGoaliesSVS">Leading Goalies (Saves)</option>
              <option value="LeadingGoaliesGAA">Leading Goalies (GAA)</option>
            </select>
          </label>
          <label>
            Liga:
            <select
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              disabled={isExtractingTable}
            >
              <option value="18510">Träningsmatcher U13</option>
              <option value="18756">U13P Division 2 B</option>
              <option value="18757">U13P Division 2 A</option>
              <option value="18986">U13P DM</option>
              <option value="19034">U14P Division 1 Höst</option>
              <option value="19037">U14P Division 2A Höst</option>
              <option value="19039">U14P Division 2B Höst</option>
              <option value="19041">U13P Division 1 Höst</option>
            </select>
          </label>
        </div>

        <div className="url-preview" style={{ display: "none" }}>
          <p>
            URL: https://stats.swehockey.se/Players/Statistics/
            {statisticsCategory}/{leagueId}
          </p>
        </div>

        <div className="button-group">
          <button
            onClick={extractTableContent}
            disabled={isExtractingTable || !leagueId || !statisticsCategory}
          >
            {isExtractingTable ? "Hämtar..." : "Hämta data"}
          </button>
        </div>
      </div>

      {tableResult && (
        <div className="results">
          <div className="summary" style={{ display: "none" }}>
            <h2>Table Extraction Result</h2>
            <p>
              Source URL:{" "}
              <a
                href={tableResult.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {tableResult.url}
              </a>
            </p>
            <p>Status: {tableResult.success ? "✅ Success" : "❌ Failed"}</p>
            {tableResult.debugInfo && <p>Debug: {tableResult.debugInfo}</p>}
            {!tableResult.success && tableResult.error && (
              <p>Error: {tableResult.error}</p>
            )}
          </div>

          {tableResult.success && tableResult.tableHtml && (
            <div className="results-section">
              <div className="table-container">
                <div
                  dangerouslySetInnerHTML={{ __html: tableResult.tableHtml }}
                  className="extracted-table"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule URL Extraction Section */}
      <div className="controls">
        <h2>Hämtar spelade matcher i en serie.</h2>
        <div className="input-group">
          <label>
            Serie:
            <select
              value={scheduleLeagueId}
              onChange={(e) => setScheduleLeagueId(e.target.value)}
              disabled={isExtracting}
            >
              <option value="18510">Träningsmatcher U13</option>
              <option value="18756">U13P Division 2 B</option>
              <option value="18757">U13P Division 2 A</option>
              <option value="18986">U13P DM</option>
              <option value="19034">U14P Division 1 Höst</option>
              <option value="19037">U14P Division 2A Höst</option>
              <option value="19039">U14P Division 2B Höst</option>
              <option value="19041">U13P Division 1 Höst</option>
            </select>
          </label>
        </div>

        <div className="button-group">
          <button
            onClick={extractGameUrls}
            disabled={isExtracting || !scheduleLeagueId}
          >
            {isExtracting ? "Hämtar..." : "Hämta matcher"}
          </button>
        </div>
      </div>

      {extractedUrls.length > 0 && (
        <div className="results">
          <div className="summary" style={{ display: "none" }}>
            <h2>Extracted Game URLs</h2>
            <p>Found {extractedUrls.length} unique Game/Events URLs</p>
          </div>

          <div className="results-section">
            <h3 style={{ display: "none" }}>
              Game URLs ({extractedUrls.length})
            </h3>
            <div className="results-list">
              {extractedUrls.map((extractedUrl, index) => (
                <div key={index} className="result-item success">
                  <div className="result-main">
                    <a
                      href={extractedUrl.fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {extractedUrl.title}
                    </a>
                    {/*  {extractedUrl.title && (
                      <div className="page-title">{extractedUrl.title}</div>
                    )}
                      */}
                  </div>
                  {/*<div className="result-meta">
                    <span className="status">
                      Game ID: {extractedUrl.gameId}
                    </span>
                  </div>
                  */}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Overview Statistics Section */}
      <div className="controls">
        <h2>Hämta lagoversikt och statistik</h2>
        <p>Hämta översiktsdata och statistik från ligans översiktssida</p>

        <div className="input-group">
          <label>
            Liga:
            <select
              value={overviewLeagueId}
              onChange={(e) => setOverviewLeagueId(e.target.value)}
              disabled={isExtractingOverview}
            >
              <option value="19041">U13P Division 1 Höst</option>
              <option value="18757">U13P Division 2 A</option>
              <option value="18756">U13P Division 2 B</option>
              <option value="18986">U13P DM</option>
              <option value="18510">Träningsmatcher U13</option>
              <option value="19034">U14P Division 1 Höst</option>
              <option value="19037">U14P Division 2A Höst</option>
              <option value="19039">U14P Division 2B Höst</option>
            </select>
          </label>
        </div>

        <div className="button-group">
          <button
            onClick={extractTeamOverview}
            disabled={isExtractingOverview || !overviewLeagueId}
          >
            {isExtractingOverview ? "Hämtar..." : "Hämta översikt"}
          </button>
        </div>
      </div>

      {overviewResult && (
        <div className="results">
          <div className="summary" style={{ display: "none" }}>
            <h2>Team Overview Result</h2>
            <p>
              Source URL:{" "}
              <a
                href={overviewResult.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {overviewResult.url}
              </a>
            </p>
            <p>Status: {overviewResult.success ? "✅ Success" : "❌ Failed"}</p>
            {overviewResult.debugInfo && (
              <p>Debug: {overviewResult.debugInfo}</p>
            )}
            {!overviewResult.success && overviewResult.error && (
              <p>Error: {overviewResult.error}</p>
            )}
          </div>

          {overviewResult.success && overviewResult.overviewHtml && (
            <div className="results-section">
              <div className="table-container">
                <div
                  dangerouslySetInnerHTML={{
                    __html: overviewResult.overviewHtml,
                  }}
                  className="extracted-table"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Original URL Range Testing Section */}
      <div className="controls" style={{ display: "none" }}>
        <h2>Test URL Range</h2>
        <p>
          Test URLs in the format: https://stats.swehockey.se/Game/Events/[ID]
        </p>

        <div className="input-group">
          <label>
            Start ID:
            <input
              type="number"
              value={startId}
              onChange={(e) => setStartId(Number(e.target.value))}
              min="1000000"
              max="1100000"
              disabled={isRunning}
            />
          </label>
          <label>
            End ID:
            <input
              type="number"
              value={endId}
              onChange={(e) => setEndId(Number(e.target.value))}
              min="1000000"
              max="1100000"
              disabled={isRunning}
            />
          </label>
        </div>

        <div className="filter-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filterMIF}
              onChange={(e) => setFilterMIF(e.target.checked)}
            />
            Show only URLs containing "MIF" in title
          </label>
        </div>

        <div className="button-group">
          <button onClick={runTests} disabled={isRunning || startId >= endId}>
            {isRunning ? "Testing..." : "Start Testing"}
          </button>
          {isRunning && (
            <button onClick={stopTests} className="stop-button">
              Stop
            </button>
          )}
        </div>
      </div>

      {isRunning && (
        <div className="progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{progress.toFixed(1)}% Complete</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="results">
          <div className="summary">
            <h2>Summary</h2>
            <p>Total Tested: {results.length}</p>
            <p>Successful: {successfulResults.length}</p>
            <p>Failed: {failedResults.length}</p>
            {filterMIF && (
              <p>Showing MIF results: {mifResults.length} total found</p>
            )}
            <p>
              Success Rate:{" "}
              {((successfulResults.length / results.length) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="results-section">
            <h3>Successful URLs ({successfulResults.length})</h3>
            <div className="results-list">
              {successfulResults.map((result, index) => (
                <div key={index} className="result-item success">
                  <div className="result-main">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {result.url}
                    </a>
                    {result.title && (
                      <div className="page-title">📄 {result.title}</div>
                    )}
                  </div>
                  <div className="result-meta">
                    <span className="status">Status: {result.status}</span>
                    <span className="time">
                      {result.responseTime.toFixed(0)}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {failedResults.length > 0 && (
            <div className="results-section">
              <h3>Failed URLs ({failedResults.length})</h3>
              <div className="results-list">
                {failedResults.slice(0, 50).map((result, index) => (
                  <div key={index} className="result-item failed">
                    <span>{result.url}</span>
                    <span className="status">
                      {result.status
                        ? `Status: ${result.status}`
                        : result.error}
                    </span>
                    <span className="time">
                      {result.responseTime.toFixed(0)}ms
                    </span>
                  </div>
                ))}
                {failedResults.length > 50 && (
                  <p>... and {failedResults.length - 50} more failed URLs</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
