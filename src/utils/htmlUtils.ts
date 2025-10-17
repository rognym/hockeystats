/**
 * Converts JavaScript openonlinewindow links to proper HTTPS URLs
 *
 * Handles various formats:
 * - href="javascript:openonlinewindow('/Game/Events/1017728','')"
 * - href="javascript:openonlinewindow('/Game/Events/1017728', '')"
 * - href="javascript:openonlinewindow('/Game/Events/1017728')"
 * - onclick="openonlinewindow('/Game/Events/1017728','')"
 *
 * @param html - HTML string containing JavaScript openonlinewindow links
 * @returns HTML string with converted HTTPS links
 *
 * @example
 * const html = '<a href="javascript:openonlinewindow(\'/Game/Events/1017728\',\'\')">Game</a>';
 * const converted = convertOpenOnlineWindowLinks(html);
 * // Result: '<a href="https://stats.swehockey.se/Game/Events/1017728" target="_blank" rel="noopener noreferrer">Game</a>'
 */
export const convertOpenOnlineWindowLinks = (html: string): string => {
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

/**
 * Function to add d-none class to specific columns for mobile hiding
 * Identifies columns containing spectator/arena information and hides them on mobile
 */
export const addMobileHidingClasses = (html: string): string => {
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

/**
 * Sets up global fallback function for any remaining openonlinewindow calls
 */
export const setupOpenOnlineWindowGlobal = () => {
  // Define a global fallback function to prevent errors
  (window as any).openonlinewindow = (url: string, _target?: string) => {
    window.open(
      `https://stats.swehockey.se${url}`,
      "_blank",
      "noopener,noreferrer"
    );
  };
};