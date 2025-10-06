import { useState, useCallback } from "react";
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

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<UrlTestResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [startId, setStartId] = useState(1000000);
  const [endId, setEndId] = useState(1100000);
  const [filterMIF, setFilterMIF] = useState(false);

  // Schedule URL extraction states
  const [scheduleUrl, setScheduleUrl] = useState(
    "https://stats.swehockey.se/ScheduleAndResults/Schedule/18991"
  );
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

  const runTests = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setResults([]);
    setProgress(0);

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
      <h1>Swedish Hockey Stats URL Tester</h1>

      {/* Table Content Extraction Section */}
      <div className="controls">
        <h2>Extract Table Content</h2>
        <p>Extract player statistics tables from Swedish Hockey Stats</p>

        <div className="input-group">
          <label>
            Statistics Category:
            <select
              value={statisticsCategory}
              onChange={(e) => setStatisticsCategory(e.target.value)}
              disabled={isExtractingTable}
            >
              <option value="GoalScoringLeaders">Goal Scoring Leaders</option>
              <option value="ScoringLeaders">Scoring Leaders</option>
              <option value="MostPenPlayers">Most Penalized Players</option>
              <option value="LeadingGoaliesSVS">Leading Goalies (Saves)</option>
            </select>
          </label>
          <label>
            League:
            <select
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              disabled={isExtractingTable}
            >
              <option value="19041">U13P Division 1 Höst</option>
              <option value="18757">U13P Division 2 A</option>
              <option value="18756">U13P Division 2 B</option>
              <option value="18510">Träningsmatcher U13</option>
            </select>
          </label>
        </div>

        <div className="url-preview">
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
            {isExtractingTable ? "Extracting..." : "Extract Table Content"}
          </button>
        </div>
      </div>

      {tableResult && (
        <div className="results">
          <div className="summary">
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
              <h3>Extracted Table Content</h3>
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
        <h2>Extract Game URLs from Schedule Page</h2>
        <p>Extract all /Game/Events/[ID] URLs from a schedule page</p>

        <div className="input-group">
          <label>
            Schedule URL:
            <input
              type="text"
              value={scheduleUrl}
              onChange={(e) => setScheduleUrl(e.target.value)}
              placeholder="https://stats.swehockey.se/ScheduleAndResults/Schedule/18991"
              disabled={isExtracting}
              style={{ width: "400px" }}
            />
          </label>
        </div>

        <div className="button-group">
          <button
            onClick={extractGameUrls}
            disabled={isExtracting || !scheduleUrl}
          >
            {isExtracting ? "Extracting..." : "Extract Game URLs"}
          </button>
        </div>
      </div>

      {extractedUrls.length > 0 && (
        <div className="results">
          <div className="summary">
            <h2>Extracted Game URLs</h2>
            <p>Found {extractedUrls.length} unique Game/Events URLs</p>
          </div>

          <div className="results-section">
            <h3>Game URLs ({extractedUrls.length})</h3>
            <div className="results-list">
              {extractedUrls.map((extractedUrl, index) => (
                <div key={index} className="result-item success">
                  <div className="result-main">
                    <a
                      href={extractedUrl.fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {extractedUrl.fullUrl}
                    </a>
                    {extractedUrl.title && (
                      <div className="page-title">📄 {extractedUrl.title}</div>
                    )}
                  </div>
                  <div className="result-meta">
                    <span className="status">
                      Game ID: {extractedUrl.gameId}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Original URL Range Testing Section */}
      <div className="controls">
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
