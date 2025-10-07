import { useState, useCallback, useEffect } from "react";
import {
  FluentProvider,
  webDarkTheme,
  makeStyles,
  Button,
  Dropdown,
  Option,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Spinner,
  MessageBar,
  MessageBarBody,
  Field,
  Badge,
  tokens,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from "@fluentui/react-components";
import {
  DatabaseSearchRegular,
  CalendarSearchRegular,
  DataBarHorizontalRegular,
  ArrowSyncRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  SportHockeyRegular,
} from "@fluentui/react-icons";

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

const useStyles = makeStyles({
  app: {
    padding: tokens.spacingHorizontalM,
    width: "100%",
    margin: "0",
  },
  section: {
    marginBottom: tokens.spacingVerticalXXL,
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
  },
  formRow: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
    alignItems: "end",
  },
  dropdown: {
    minWidth: "200px",
    flex: 1,
  },
  buttonGroup: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalM,
  },
  resultCard: {
    marginTop: tokens.spacingVerticalM,
  },
  resultsList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    maxHeight: "400px",
    overflowY: "auto",
  },
  resultItem: {
    padding: tokens.spacingVerticalS,
    borderLeft: `4px solid ${tokens.colorBrandBackground}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
  },
  refreshButton: {
    position: "fixed",
    top: tokens.spacingVerticalM,
    right: tokens.spacingHorizontalM,
    zIndex: 1000,
  },
  extractedTable: {
    width: "100%",
    "& table": {
      width: "100%",
      borderCollapse: "collapse",
      "& th, & td": {
        padding: tokens.spacingVerticalS,
        textAlign: "left",
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
      },
      "& th": {
        backgroundColor: tokens.colorNeutralBackground2,
        fontWeight: tokens.fontWeightSemibold,
      },
    },
  },
});

function FluentApp() {
  const styles = useStyles();

  // All your existing state variables
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
  const [overviewLeagueId, setOverviewLeagueId] = useState("18757");
  const [overviewResult, setOverviewResult] =
    useState<TeamOverviewResult | null>(null);
  const [isExtractingOverview, setIsExtractingOverview] = useState(false);

  // League options
  const leagueOptions = [
    { value: "18510", text: "Träningsmatcher U13" },
    { value: "19041", text: "U13P div. 1 höst" },
    { value: "18757", text: "U13P div. 2A höst" },
    { value: "18756", text: "U13P div. 2B höst" },
    { value: "18986", text: "U13P DM" },
    { value: "19034", text: "U14P div. 1 höst" },
    { value: "19037", text: "U14P div. 2A höst" },
    { value: "19039", text: "U14P div. 2B höst" },
  ];

  const statisticsOptions = [
    { value: "ScoringLeaders", text: "Point Leaders" },
    { value: "GoalScoringLeaders", text: "Goal Scoring Leaders" },
    { value: "AssistLeaders", text: "Assist Leaders" },
    { value: "DecisiveGoalLeaders", text: "Game Winning Goal Leaders" },
    { value: "MostPenPlayers", text: "Most Penalized Players" },
    { value: "LeadingGoaliesSVS", text: "Leading Goalies (Saves)" },
    { value: "LeadingGoaliesGAA", text: "Leading Goalies (GAA)" },
  ];

  // Your existing functions (extractGameUrls, extractTableContent, etc.)
  // I'll include simplified versions here - you can copy your full logic

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setResults([]);
      setExtractedUrls([]);
      setTableResult(null);
      setOverviewResult(null);
      setProgress(0);
      window.location.reload();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const extractTableContent = async () => {
    if (isExtractingTable) return;
    setIsExtractingTable(true);
    setTableResult(null);
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

  const extractGameUrls = async () => {
    if (isExtracting) return;
    setIsExtracting(true);
    setExtractedUrls([]);
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
      const gameUrlPattern = /\/Game\/Events\/(\d+)/g;
      const matches = [...html.matchAll(gameUrlPattern)];
      const uniqueUrls = new Map<string, ExtractedUrl>();

      for (const match of matches) {
        const gameId = match[1];
        const fullUrl = `https://stats.swehockey.se/Game/Events/${gameId}`;
        if (!uniqueUrls.has(gameId)) {
          uniqueUrls.set(gameId, { gameId, fullUrl });
        }
      }

      const urlArray = Array.from(uniqueUrls.values());
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
    }

    setIsExtracting(false);
  };

  const extractTeamOverview = async () => {
    if (isExtractingOverview) return;
    setIsExtractingOverview(true);
    setOverviewResult(null);
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

  return (
    <FluentProvider theme={webDarkTheme}>
      <div className={styles.app}>
        {/* Theme Toggle and Refresh Button */}
        <div className={styles.refreshButton}>
          <Button
            appearance="primary"
            icon={<ArrowSyncRegular />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: tokens.spacingVerticalXXL,
          }}
        >
          <SportHockeyRegular
            style={{ fontSize: "48px", color: tokens.colorBrandBackground }}
          />
          <Title3>Hockey Stats Tool</Title3>
        </div>

        {/* Accordion Sections */}
        <Accordion multiple collapsible>
          {/* Player Statistics Section */}
          <AccordionItem value="statistics">
            <AccordionHeader icon={<DatabaseSearchRegular />}>
              <Title3>Player Statistics</Title3>
            </AccordionHeader>
            <AccordionPanel>
              <Card className={styles.section}>
                <CardHeader
                  header={
                    <Text weight="semibold">Extract Player Statistics</Text>
                  }
                  description={
                    <Text>Get player statistics from league pages</Text>
                  }
                />
                <div className={styles.controls}>
                  <div className={styles.formRow}>
                    <Field label="Category">
                      <Dropdown
                        className={styles.dropdown}
                        value={
                          statisticsOptions.find(
                            (opt) => opt.value === statisticsCategory
                          )?.text
                        }
                        onOptionSelect={(_, data) =>
                          setStatisticsCategory(data.optionValue as string)
                        }
                        disabled={isExtractingTable}
                      >
                        {statisticsOptions.map((option) => (
                          <Option key={option.value} value={option.value}>
                            {option.text}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>

                    <Field label="League">
                      <Dropdown
                        className={styles.dropdown}
                        value={
                          leagueOptions.find((opt) => opt.value === leagueId)
                            ?.text
                        }
                        onOptionSelect={(_, data) =>
                          setLeagueId(data.optionValue as string)
                        }
                        disabled={isExtractingTable}
                      >
                        {leagueOptions.map((option) => (
                          <Option key={option.value} value={option.value}>
                            {option.text}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                  </div>

                  <div className={styles.buttonGroup}>
                    <Button
                      appearance="primary"
                      icon={
                        isExtractingTable ? (
                          <Spinner size="tiny" />
                        ) : (
                          <DatabaseSearchRegular />
                        )
                      }
                      onClick={extractTableContent}
                      disabled={
                        isExtractingTable || !leagueId || !statisticsCategory
                      }
                    >
                      {isExtractingTable ? "Fetching..." : "Extract Statistics"}
                    </Button>
                  </div>
                </div>

                {tableResult && (
                  <Card className={styles.resultCard}>
                    <CardHeader
                      header={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: tokens.spacingHorizontalXS,
                          }}
                        >
                          {tableResult.success ? (
                            <CheckmarkCircleRegular
                              style={{
                                color: tokens.colorPaletteGreenForeground1,
                              }}
                            />
                          ) : (
                            <ErrorCircleRegular
                              style={{
                                color: tokens.colorPaletteRedForeground1,
                              }}
                            />
                          )}
                          <Text weight="semibold">
                            {tableResult.success
                              ? "Statistics Extracted"
                              : "Extraction Failed"}
                          </Text>
                        </div>
                      }
                      description={tableResult.debugInfo}
                    />
                    {tableResult.success && tableResult.tableHtml && (
                      <CardPreview>
                        <div
                          className={styles.extractedTable}
                          dangerouslySetInnerHTML={{
                            __html: tableResult.tableHtml,
                          }}
                        />
                      </CardPreview>
                    )}
                    {!tableResult.success && tableResult.error && (
                      <MessageBar intent="error">
                        <MessageBarBody>{tableResult.error}</MessageBarBody>
                      </MessageBar>
                    )}
                  </Card>
                )}
              </Card>
            </AccordionPanel>
          </AccordionItem>

          {/* Game URLs Section */}
          <AccordionItem value="games">
            <AccordionHeader icon={<CalendarSearchRegular />}>
              <Title3>Game URLs</Title3>
            </AccordionHeader>
            <AccordionPanel>
              <Card className={styles.section}>
                <CardHeader
                  header={<Text weight="semibold">Extract Game URLs</Text>}
                  description={
                    <Text>Get all game URLs from schedule pages</Text>
                  }
                />
                <div className={styles.controls}>
                  <div className={styles.formRow}>
                    <Field label="League">
                      <Dropdown
                        className={styles.dropdown}
                        value={
                          leagueOptions.find(
                            (opt) => opt.value === scheduleLeagueId
                          )?.text
                        }
                        onOptionSelect={(_, data) =>
                          setScheduleLeagueId(data.optionValue as string)
                        }
                        disabled={isExtracting}
                      >
                        {leagueOptions.map((option) => (
                          <Option key={option.value} value={option.value}>
                            {option.text}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                  </div>

                  <div className={styles.buttonGroup}>
                    <Button
                      appearance="primary"
                      icon={
                        isExtracting ? (
                          <Spinner size="tiny" />
                        ) : (
                          <CalendarSearchRegular />
                        )
                      }
                      onClick={extractGameUrls}
                      disabled={isExtracting || !scheduleLeagueId}
                    >
                      {isExtracting ? "Extracting..." : "Extract Games"}
                    </Button>
                  </div>
                </div>

                {extractedUrls.length > 0 && (
                  <Card className={styles.resultCard}>
                    <CardHeader
                      header={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: tokens.spacingHorizontalXS,
                          }}
                        >
                          <CheckmarkCircleRegular
                            style={{
                              color: tokens.colorPaletteGreenForeground1,
                            }}
                          />
                          <Text weight="semibold">Games Found</Text>
                          <Badge size="small" color="brand">
                            {extractedUrls.length}
                          </Badge>
                        </div>
                      }
                    />
                    <div className={styles.resultsList}>
                      {extractedUrls.map((url, index) => (
                        <div key={index} className={styles.resultItem}>
                          <a
                            href={url.fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {url.title}
                          </a>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </Card>
            </AccordionPanel>
          </AccordionItem>

          {/* Team Overview Section */}
          <AccordionItem value="overview">
            <AccordionHeader icon={<DataBarHorizontalRegular />}>
              <Title3>Team Overview</Title3>
            </AccordionHeader>
            <AccordionPanel>
              <Card className={styles.section}>
                <CardHeader
                  header={<Text weight="semibold">Extract Team Overview</Text>}
                  description={
                    <Text>
                      Get team overview and statistics from league overview
                      pages
                    </Text>
                  }
                />
                <div className={styles.controls}>
                  <div className={styles.formRow}>
                    <Field label="League">
                      <Dropdown
                        className={styles.dropdown}
                        value={
                          leagueOptions.find(
                            (opt) => opt.value === overviewLeagueId
                          )?.text
                        }
                        onOptionSelect={(_, data) =>
                          setOverviewLeagueId(data.optionValue as string)
                        }
                        disabled={isExtractingOverview}
                      >
                        {leagueOptions.map((option) => (
                          <Option key={option.value} value={option.value}>
                            {option.text}
                          </Option>
                        ))}
                      </Dropdown>
                    </Field>
                  </div>

                  <div className={styles.buttonGroup}>
                    <Button
                      appearance="primary"
                      icon={
                        isExtractingOverview ? (
                          <Spinner size="tiny" />
                        ) : (
                          <DataBarHorizontalRegular />
                        )
                      }
                      onClick={extractTeamOverview}
                      disabled={isExtractingOverview || !overviewLeagueId}
                    >
                      {isExtractingOverview
                        ? "Extracting..."
                        : "Extract Overview"}
                    </Button>
                  </div>
                </div>

                {overviewResult && (
                  <Card className={styles.resultCard}>
                    <CardHeader
                      header={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: tokens.spacingHorizontalXS,
                          }}
                        >
                          {overviewResult.success ? (
                            <CheckmarkCircleRegular
                              style={{
                                color: tokens.colorPaletteGreenForeground1,
                              }}
                            />
                          ) : (
                            <ErrorCircleRegular
                              style={{
                                color: tokens.colorPaletteRedForeground1,
                              }}
                            />
                          )}
                          <Text weight="semibold">
                            {overviewResult.success
                              ? "Overview Extracted"
                              : "Extraction Failed"}
                          </Text>
                        </div>
                      }
                      description={overviewResult.debugInfo}
                    />
                    {overviewResult.success && overviewResult.overviewHtml && (
                      <CardPreview>
                        <div
                          className={styles.extractedTable}
                          dangerouslySetInnerHTML={{
                            __html: overviewResult.overviewHtml,
                          }}
                        />
                      </CardPreview>
                    )}
                    {!overviewResult.success && overviewResult.error && (
                      <MessageBar intent="error">
                        <MessageBarBody>{overviewResult.error}</MessageBarBody>
                      </MessageBar>
                    )}
                  </Card>
                )}
              </Card>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </FluentProvider>
  );
}

export default FluentApp;
