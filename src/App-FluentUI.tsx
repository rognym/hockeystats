import { useState, useEffect } from "react";
import {
  FluentProvider,
  webDarkTheme,
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
import "./App.css";
import { useStatisticsTab, useOverviewTab, useStandingsTab } from "./hooks";
import { setupOpenOnlineWindowGlobal } from "./utils/htmlUtils";

function FluentApp() {
  // Custom hooks for tab functionality
  const {
    isExtractingTable,
    tableResult,
    statisticsCategory,
    setStatisticsCategory,
    leagueId,
    setLeagueId,
    extractTableContent,
  } = useStatisticsTab();

  const {
    isExtractingOverview,
    overviewResult,
    overviewLeagueId,
    setOverviewLeagueId,
    extractTeamOverview,
  } = useOverviewTab();

  const {
    isExtractingStandings,
    standingsResult,
    standingsLeagueId,
    setStandingsLeagueId,
    extractStandings,
  } = useStandingsTab();

  // Orientation detection states
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [showRotationPrompt, setShowRotationPrompt] = useState(true);

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>("statistics");

  // Pull to refresh states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // League options
  const leagueOptions = [
    { value: "19041", text: "U13P Division 1 Höst" },
    { value: "18757", text: "U13P Division 2A Höst" },
    { value: "18756", text: "U13P Division 2B Höst" },
    { value: "18986", text: "U13P DM" },
    { value: "18510", text: "Träningsmatcher U13" },
    { value: "19034", text: "U14P Division 1 Höst" },
    { value: "19037", text: "U14P Division 2A Höst" },
    { value: "19039", text: "U14P Division 2B Höst" },
    { value: "18560", text: "J20 Regional Syd" },
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

  // Pull to refresh effect
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
        setIsPulling(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        const currentY = e.touches[0].clientY;
        const distance = currentY - startY;

        if (distance > 0) {
          e.preventDefault();
          setPullDistance(Math.min(distance, 100));
          setIsPulling(distance > 50);
        }
      }
    };

    const handleTouchEnd = () => {
      if (isPulling && !isRefreshing) {
        handleRefresh();
      }
      setPullDistance(0);
      setIsPulling(false);
      setStartY(0);
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startY, isPulling, isRefreshing]);

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
      // Clear all results and reload the page
      window.location.reload();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
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

  // Set up the global openonlinewindow function
  useEffect(() => {
    setupOpenOnlineWindowGlobal();
  }, []);

  return (
    <FluentProvider theme={webDarkTheme}>
      {/* Rotation Prompt Overlay */}
      {isPortraitMobile && showRotationPrompt && (
        <div className="fluent-rotation-prompt">
          <div className="fluent-rotation-prompt-content">
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={() => setShowRotationPrompt(false)}
              className="fluent-dismiss-button"
              title="Continue in portrait mode"
            />
            <PhoneScreenTimeRegular className="fluent-phone-icon" />
            <div className="fluent-rotation-text">
              Please rotate your device
            </div>
            <div className="fluent-rotation-subtext">
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

      <div className="fluent-app">
        {/* Pull to Refresh Indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div
            className={`fluent-pull-to-refresh ${
              pullDistance > 50 || isRefreshing ? "visible" : ""
            } ${isPulling ? "pulling" : ""}`}
            style={{
              transform: `translateX(-50%) translateY(${Math.min(
                pullDistance - 50,
                0
              )}px)`,
            }}
          >
            {isRefreshing ? (
              <>
                <Spinner size="tiny" />
                <span>Refreshing...</span>
              </>
            ) : isPulling ? (
              <>
                <ArrowSyncRegular />
                <span>Release to refresh</span>
              </>
            ) : (
              <>
                <ArrowSyncRegular />
                <span>Pull to refresh</span>
              </>
            )}
          </div>
        )}

        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: tokens.spacingVerticalXXL,
          }}
        >
          <SportHockeyRegular
            style={{
              fontSize: "24px",
              color: "#a20000ff", // Replace with any valid CSS color or Fluent token
            }}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="fluent-navigation-container">
          <TabList
            selectedValue={activeTab}
            onTabSelect={handleTabSelect}
            size="large"
          >
            <Tab value="statistics" icon={<PeopleStarFilled />}>
              Player Statistics
            </Tab>
            <Tab value="overview" icon={<PeopleTeamFilled />}>
              Schedule & Results
            </Tab>
            <Tab value="standings" icon={<DataBarHorizontalRegular />}>
              Standings
            </Tab>
          </TabList>
        </div>

        {/* Tab Content */}
        <div className="fluent-tab-content">
          {/* Player Statistics Section */}
          {activeTab === "statistics" && (
            <Card className="fluent-section">
              <CardHeader
                header={<Title3>Player Statistics</Title3>}
                description={"Extract player statistics from league pages"}
              />
              <div className="fluent-controls">
                <div className="fluent-form-row">
                  <Field label="Category">
                    <Dropdown
                      className="fluent-dropdown"
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
                      className="fluent-dropdown"
                      value={
                        leagueOptions.find((opt) => opt.value === leagueId)
                          ?.text
                      }
                      selectedOptions={[leagueId]} // <-- This sets the initially selected option
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

                <div className="fluent-button-group">
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
                <Card className="fluent-result-card">
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
                        className="fluent-extracted-table"
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
            <Card className="fluent-section">
              <CardHeader
                header={<Title3>Schedule & Results</Title3>}
                description={
                  "Extract team overview and statistics from league overview pages"
                }
              />
              <div className="fluent-controls">
                <div className="fluent-form-row">
                  <Field label="League">
                    <Dropdown
                      className="fluent-dropdown"
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

                <div className="fluent-button-group">
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
                <Card className="fluent-result-card">
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
                        className="fluent-extracted-table"
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

          {/* Standings Section */}
          {activeTab === "standings" && (
            <Card className="fluent-section">
              <CardHeader
                header={<Title3>Standings</Title3>}
                description={"Extract league standings from standings pages"}
              />
              <div className="fluent-controls">
                <div className="fluent-form-row">
                  <Field label="League">
                    <Dropdown
                      className="fluent-dropdown"
                      value={
                        leagueOptions.find(
                          (opt) => opt.value === standingsLeagueId
                        )?.text
                      }
                      onOptionSelect={(_, data) =>
                        setStandingsLeagueId(data.optionValue as string)
                      }
                      disabled={isExtractingStandings}
                    >
                      {leagueOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.text}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                </div>

                <div className="fluent-button-group">
                  <Button
                    appearance="primary"
                    icon={
                      isExtractingStandings ? (
                        <Spinner size="tiny" />
                      ) : (
                        <DataBarHorizontalRegular />
                      )
                    }
                    onClick={extractStandings}
                    disabled={isExtractingStandings || !standingsLeagueId}
                  >
                    {isExtractingStandings
                      ? "Extracting..."
                      : "Extract Standings"}
                  </Button>
                </div>
              </div>

              {standingsResult && (
                <Card className="fluent-result-card">
                  <CardHeader
                    header={
                      <div
                        style={{
                          display: "none",
                          alignItems: "center",
                          gap: tokens.spacingHorizontalXS,
                        }}
                      >
                        {standingsResult.success ? (
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
                          {standingsResult.success
                            ? "Standings Extracted"
                            : "Extraction Failed"}
                        </Text>
                      </div>
                    }
                    //description={standingsResult.debugInfo}
                  />
                  {standingsResult.success && standingsResult.overviewHtml && (
                    <CardPreview>
                      <div
                        className="fluent-extracted-table"
                        dangerouslySetInnerHTML={{
                          __html: standingsResult.overviewHtml,
                        }}
                      />
                    </CardPreview>
                  )}
                  {!standingsResult.success && standingsResult.error && (
                    <MessageBar intent="error">
                      <MessageBarBody>{standingsResult.error}</MessageBarBody>
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
