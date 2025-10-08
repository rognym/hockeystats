import { useState, useEffect } from "react";
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
  tokens,
  TabList,
  Tab,
} from "@fluentui/react-components";
import type { SelectTabData, SelectTabEvent } from "@fluentui/react-components";
import {
  DatabaseSearchRegular,
  DataBarHorizontalRegular,
  ArrowSyncRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  PeopleStarFilled,
  PeopleTeamFilled,
  SportHockeyRegular,
  PhoneScreenTimeRegular,
  DismissRegular,
} from "@fluentui/react-icons";

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
    minHeight: "100vh",
    "-webkit-text-size-adjust": "100%",
    "-ms-text-size-adjust": "100%",
    "touch-action": "manipulation",
    /* Safe area insets for iPhone notch/camera */
    paddingTop: `max(${tokens.spacingVerticalM}, env(safe-area-inset-top))`,
    paddingBottom: `max(${tokens.spacingVerticalM}, env(safe-area-inset-bottom))`,
    paddingLeft: `max(${tokens.spacingHorizontalM}, env(safe-area-inset-left))`,
    paddingRight: `max(${tokens.spacingHorizontalM}, env(safe-area-inset-right))`,
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
    top: `max(${tokens.spacingVerticalM}, env(safe-area-inset-top))`,
    right: `max(${tokens.spacingHorizontalM}, env(safe-area-inset-right))`,
    zIndex: 1000,
  },
  extractedTable: {
    width: "100%",
    overflowX: "auto", // Enable horizontal scrolling
    WebkitOverflowScrolling: "touch", // Enable smooth scrolling on iOS
    "& table": {
      width: "100%",
      minWidth: "600px", // Ensure table has minimum width for readability
      borderCollapse: "collapse",
      "& th, & td": {
        padding: tokens.spacingVerticalS,
        textAlign: "left",
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        whiteSpace: "nowrap", // Prevent text wrapping to maintain table structure
      },
      "& th": {
        backgroundColor: tokens.colorNeutralBackground2,
        fontWeight: tokens.fontWeightSemibold,
      },
    },
    "& a": {
      color: tokens.colorBrandForeground1,
      textDecoration: "none",
      "&:hover": {
        textDecoration: "underline",
        color: tokens.colorBrandForeground2,
      },
      "&:visited": {
        color: tokens.colorBrandForeground1,
      },
    },
    // Mobile-specific styling
    "@media (max-width: 768px)": {
      // Ensure scrolling container works on mobile
      touchAction: "pan-x", // Allow horizontal panning
      "& table": {
        fontSize: "0.85rem", // Smaller font for mobile
        minWidth: "500px", // Adjusted minimum width for mobile
        "& th, & td": {
          padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalXS}`,
        },
      },
    },
  },
  rotationPrompt: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.colorNeutralForeground1,
    textAlign: "center",
    padding: tokens.spacingHorizontalXL,
    /* Safe area insets for rotation prompt */
    paddingTop: `max(${tokens.spacingHorizontalXL}, env(safe-area-inset-top))`,
    paddingBottom: `max(${tokens.spacingHorizontalXL}, env(safe-area-inset-bottom))`,
    paddingLeft: `max(${tokens.spacingHorizontalXL}, env(safe-area-inset-left))`,
    paddingRight: `max(${tokens.spacingHorizontalXL}, env(safe-area-inset-right))`,
  },
  phoneIcon: {
    fontSize: "80px",
    marginBottom: tokens.spacingVerticalXL,
    animationName: {
      "0%": { transform: "rotate(0deg)" },
      "25%": { transform: "rotate(-15deg)" },
      "75%": { transform: "rotate(15deg)" },
      "100%": { transform: "rotate(90deg)" },
    },
    animationDuration: "2s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
  },
  rotationText: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalM,
  },
  rotationSubtext: {
    fontSize: tokens.fontSizeBase300,
    opacity: 0.8,
  },
  rotationPromptContent: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  dismissButton: {
    position: "absolute",
    top: "-20px",
    right: "-20px",
    color: tokens.colorNeutralForeground1,
  },
  navigationContainer: {
    marginBottom: tokens.spacingVerticalXL,
  },
  tabContent: {
    marginTop: tokens.spacingVerticalL,
  },
});

function FluentApp() {
  const styles = useStyles();

  // Orientation detection states
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [showRotationPrompt, setShowRotationPrompt] = useState(true);

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>("statistics");

  // Pull to refresh states
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // League options
  const leagueOptions = [
    { value: "18510", text: "Träningsmatcher U13" },
    { value: "19041", text: "U13P div. 1 höst" },
    { value: "18757", text: "U13P div. 2A höst" },
    { value: "18756", text: "U13P div. 2B höst" },
    { value: "18986", text: "U13P DM" },
    { value: "19034", text: "U14P div. 1 höst" },
    { value: "19037", text: "U14P div. 2A Höst" },
    { value: "19039", text: "U14P div. 2B Höst" },
    { value: "18971", text: "test" },
  ];

  // Orientation detection effect
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 768; // Mobile breakpoint
      const isPortrait = window.innerHeight > window.innerWidth;
      const newIsPortraitMobile = isMobile && isPortrait;

      // Reset rotation prompt when switching to landscape
      if (isPortraitMobile && !newIsPortraitMobile) {
        setShowRotationPrompt(true);
      }

      setIsPortraitMobile(newIsPortraitMobile);
    };

    // Prevent zoom on orientation change
    const preventZoom = (e: Event) => {
      if (e.type === "orientationchange") {
        // Wait for orientation change to complete
        setTimeout(() => {
          // Force viewport reset
          const viewport = document.querySelector("meta[name=viewport]");
          if (viewport) {
            viewport.setAttribute(
              "content",
              "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
            );
          }
          checkOrientation();
        }, 100);
      } else {
        checkOrientation();
      }
    };

    // Check on mount
    checkOrientation();

    // Listen for orientation changes with zoom prevention
    window.addEventListener("resize", preventZoom);
    window.addEventListener("orientationchange", preventZoom);

    return () => {
      window.removeEventListener("resize", preventZoom);
      window.removeEventListener("orientationchange", preventZoom);
    };
  }, []);

  const handleTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as string);
  };

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
      setTableResult(null);
      setOverviewResult(null);
      window.location.reload();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Converts JavaScript openonlinewindow links to proper HTTPS URLs
   *
   * Handles various formats:
   * - href="javascript:openonlinewindow('/Game/Events/1017728','')"
   * - Multi-line formats with whitespace
   * - onclick handlers
   *
   * @param html - The HTML string containing JavaScript links
   * @returns The HTML string with converted HTTPS links
   *
   * @example
   * const html = '<a href="javascript:openonlinewindow(\'/Game/Events/1017728\',\'\')">Game</a>';
   * const converted = convertOpenOnlineWindowLinks(html);
   * // Result: '<a href="https://stats.swehockey.se/Game/Events/1017728" target="_blank" rel="noopener noreferrer">Game</a>'
   */
  const convertOpenOnlineWindowLinks = (html: string): string => {
    let convertedHtml = html;

    // Handle multi-line format with whitespace and line breaks:
    // href="
    //   javascript:openonlinewindow('/Game/Events/1017728','')
    // "
    convertedHtml = convertedHtml.replace(
      /href="\s*javascript:openonlinewindow\('([^']+)',\s*'[^']*'\)\s*"/gis,
      'href="https://stats.swehockey.se$1" target="_blank" rel="noopener noreferrer"'
    );

    // Handle format without quotes in the second parameter
    convertedHtml = convertedHtml.replace(
      /href="\s*javascript:openonlinewindow\(([^,)]+),\s*[^)]*\)\s*"/gis,
      (_, path) => {
        // Remove any quotes from the path
        const cleanPath = path.replace(/['"]/g, "");
        return `href="https://stats.swehockey.se${cleanPath}" target="_blank" rel="noopener noreferrer"`;
      }
    );

    // Fallback: Handle single parameter format if any exist
    convertedHtml = convertedHtml.replace(
      /href="\s*javascript:openonlinewindow\('([^']+)'\)\s*"/gis,
      'href="https://stats.swehockey.se$1" target="_blank" rel="noopener noreferrer"'
    );

    // Additional fallback for any remaining onclick handlers
    convertedHtml = convertedHtml.replace(
      /onclick="\s*openonlinewindow\('([^']+)',\s*'[^']*'\)\s*"/gis,
      "onclick=\"window.open('https://stats.swehockey.se$1', '_blank', 'noopener,noreferrer')\""
    );

    // Handle any remaining openonlinewindow function calls (not in attributes)
    convertedHtml = convertedHtml.replace(
      /openonlinewindow\('([^']+)',\s*'[^']*'\)/gis,
      "window.open('https://stats.swehockey.se$1', '_blank', 'noopener,noreferrer')"
    );

    // Handle single parameter openonlinewindow calls
    convertedHtml = convertedHtml.replace(
      /openonlinewindow\('([^']+)'\)/gis,
      "window.open('https://stats.swehockey.se$1', '_blank', 'noopener,noreferrer')"
    );

    return convertedHtml;
  };

  // Function to add d-none class to specific columns for mobile hiding
  const addMobileHidingClasses = (html: string): string => {
    // Keywords that indicate columns to hide on mobile devices
    const hideKeywords = ["åskådare", "spectators", "publik", "arena", "venue"];

    try {
      // Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      // Find all tables
      const tables = tempDiv.querySelectorAll("table");

      tables.forEach((table) => {
        const headerRow = table.querySelector("tr");
        if (!headerRow) return;

        const headers = headerRow.querySelectorAll("th, td");
        const columnsToHide: number[] = [];

        // Identify columns to hide based on header text
        headers.forEach((header, index) => {
          const headerText = header.textContent?.toLowerCase().trim() || "";
          const shouldHide = hideKeywords.some(
            (keyword) => headerText === keyword || headerText.includes(keyword)
          );

          if (shouldHide) {
            columnsToHide.push(index);
            console.log(
              `Marking column ${index} for mobile hiding: "${header.textContent}"`
            );
          }
        });

        // Safety check: only hide if we're hiding 2 or fewer columns
        if (columnsToHide.length > 2) {
          console.warn(
            `Too many columns would be hidden (${columnsToHide.length}), skipping mobile optimization for this table`
          );
          return;
        }

        // Add d-none class to identified columns
        const allRows = table.querySelectorAll("tr");
        allRows.forEach((row) => {
          const cells = row.querySelectorAll("th, td");
          columnsToHide.forEach((columnIndex) => {
            if (cells[columnIndex]) {
              cells[columnIndex].classList.add("d-none");
            }
          });
        });
      });

      return tempDiv.innerHTML;
    } catch (error) {
      console.warn("Error adding mobile hiding classes:", error);
      return html; // Return original HTML if processing fails
    }
  };

  // Global fallback function for any remaining openonlinewindow calls
  useEffect(() => {
    // Define a global fallback function to prevent errors
    (window as any).openonlinewindow = (url: string, _target?: string) => {
      window.open(
        `https://stats.swehockey.se${url}`,
        "_blank",
        "noopener,noreferrer"
      );
    };

    // Cleanup function
    return () => {
      if ((window as any).openonlinewindow) {
        delete (window as any).openonlinewindow;
      }
    };
  }, []);

  const extractTableContent = async () => {
    if (isExtractingTable) return;
    setIsExtractingTable(true);
    setTableResult(null);
    setOverviewResult(null);

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

  const extractTeamOverview = async () => {
    if (isExtractingOverview) return;
    setIsExtractingOverview(true);
    setOverviewResult(null);
    setTableResult(null);

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

  return (
    <FluentProvider theme={webDarkTheme}>
      {/* Rotation Prompt Overlay */}
      {isPortraitMobile && showRotationPrompt && (
        <div className={styles.rotationPrompt}>
          <div className={styles.rotationPromptContent}>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={() => setShowRotationPrompt(false)}
              className={styles.dismissButton}
              title="Continue in portrait mode"
            />
            <PhoneScreenTimeRegular className={styles.phoneIcon} />
            <div className={styles.rotationText}>Please rotate your device</div>
            <div className={styles.rotationSubtext}>
              This app works best in landscape mode
            </div>
            <Button
              appearance="secondary"
              onClick={() => setShowRotationPrompt(false)}
              style={{ marginTop: tokens.spacingVerticalL }}
            >
              Continue anyway
            </Button>
          </div>
        </div>
      )}

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
            style={{
              fontSize: "48px",
              color: "#a20000ff", // Replace with any valid CSS color or Fluent token
            }}
          />
        </div>

        {/* Navigation Tabs */}
        <div className={styles.navigationContainer}>
          <TabList
            selectedValue={activeTab}
            onTabSelect={handleTabSelect}
            size="large"
          >
            <Tab value="statistics" icon={<PeopleStarFilled />}>
              Player Statistics
            </Tab>
            <Tab value="overview" icon={<PeopleTeamFilled />}>
              Schedule and Results
            </Tab>
          </TabList>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Player Statistics Section */}
          {activeTab === "statistics" && (
            <Card className={styles.section}>
              <CardHeader
                header={<Title3>Player Statistics</Title3>}
                description={"Extract player statistics from league pages"}
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
                          display: "none",
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
                    //description={tableResult.debugInfo}
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
          )}

          {/* Team Overview Section */}
          {activeTab === "overview" && (
            <Card className={styles.section}>
              <CardHeader
                header={<Title3>Schedule and Results</Title3>}
                description={
                  "Extract team overview and statistics from league overview pages"
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
                          display: "none",
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
                    //description={overviewResult.debugInfo}
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
          )}
        </div>
      </div>
    </FluentProvider>
  );
}

export default FluentApp;
