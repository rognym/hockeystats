# Swedish Hockey Statistics Dashboard

A modern React TypeScript web application for extracting and viewing hockey statistics from the Swedish Hockey Federation website (stats.swehockey.se). Features a responsive design with mobile optimization and a comprehensive red-themed UI.

## Overview

This application provides an intuitive interface to extract and display hockey statistics across three main categories:

- **Player Statistics**: Individual player performance data including points, goals, assists, and goalie stats
- **Schedule & Results**: Team schedules, game results, and match details
- **Standings**: League standings and tournament brackets

## Features

### 📊 Multiple Data Views

- **Player Statistics**: 7 different statistical categories (Point Leaders, Goal Leaders, Assist Leaders, etc.)
- **Schedule & Results**: Complete team schedules with game links and results
- **Standings**: League tables with special support for tournament formats (DM)

### 🎨 Modern UI/UX

- **Dark Theme**: Professional dark theme with custom red accent color (#a60000)
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Tab Navigation**: Clean tabbed interface with vertical tabs on mobile
- **Touch-Optimized**: Smooth scrolling and touch interactions on mobile devices

### 📱 Mobile Optimization

- **Vertical Tabs**: Tabs stack vertically on small screens for better usability
- **Column Hiding**: Automatically hides less important columns (arena, spectators) on mobile
- **Landscape Mode Prompt**: Optional landscape mode suggestion for better table viewing
- **Safe Area Support**: Proper handling of device notches and camera cutouts

### ⚡ Advanced Features

- **Link Conversion**: Automatically converts JavaScript links to proper HTTPS URLs
- **Data Processing**: Intelligent extraction of specific HTML tables and content
- **League Support**: Multiple Swedish hockey leagues (U13P, U14P, J20)
- **Special Handling**: Custom logic for tournament formats (extracts multiple tables for DM)

### 🛠 Technical Excellence

- **TypeScript**: Fully typed for better development experience
- **Fluent UI**: Microsoft's modern React component library
- **Progressive Web App**: PWA features with custom icons and manifest
- **Performance**: Optimized table rendering with hardware acceleration

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/rognym/hockeystats.git
   cd hockeystats
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Usage

### Player Statistics

1. Select a **Category** from the dropdown (Point Leaders, Goal Leaders, etc.)
2. Choose a **League** from the available options
3. Click **"Extract Statistics"** to fetch the data
4. View the formatted table with player statistics

### Schedule & Results

1. Select a **League** from the dropdown
2. Click **"Extract Overview"** to fetch schedule and results
3. Browse team schedules, game results, and clickable game links

### Standings

1. Select a **League** from the dropdown
2. Click **"Extract Standings"** to fetch league standings
3. View team standings with points, games played, and statistics
4. For tournament leagues (DM), multiple tables are automatically extracted

## Supported Leagues

- **U13P Division 1 Höst**
- **U13P Division 2A Höst**
- **U13P Division 2B Höst**
- **U13P DM** (Tournament format - extracts multiple tables)
- **Träningsmatcher U13**
- **U14P Division 1 Höst**
- **U14P Division 2A Höst**
- **U14P Division 2B Höst**
- **J20 Regional Syd**

## Technical Details

### Architecture

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Fluent UI React Components
- **Styling**: CSS-in-JS with makeStyles
- **Icons**: Fluent UI React Icons

### Data Processing

- **HTML Parsing**: Extracts specific table classes (tblContent, tblBorderNoPad)
- **Link Conversion**: Converts JavaScript `openonlinewindow` calls to proper HTTPS links
- **Mobile Optimization**: Adds responsive classes for column hiding
- **Error Handling**: Comprehensive error handling with user feedback

### Mobile Features

- **Touch Scrolling**: Hardware-accelerated smooth scrolling
- **Responsive Tables**: Horizontal scrolling with minimum widths
- **Column Management**: Smart hiding of less important columns on mobile
- **Orientation Detection**: Landscape mode suggestions with dismiss option

## Project Structure

```
src/
├── App-FluentUI.tsx    # Main application component (Fluent UI version)
├── App.tsx             # Alternative application component
├── App.css             # Application styles
├── main.tsx            # Application entry point
└── assets/             # Static assets and icons
public/
├── manifest.json       # PWA manifest
├── icon-*.png          # PWA icons in various sizes
└── ICON_INSTRUCTIONS.md # Icon generation guide
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run lint` - Run ESLint for code quality
- `npm run preview` - Preview production build locally

### Key Components

- **FluentApp**: Main application component with state management
- **Tab Navigation**: Dynamic tab system with responsive behavior
- **Data Extraction**: Fetch and process hockey statistics
- **Mobile Support**: Responsive design and touch optimization

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **PWA Support**: Can be installed as a web app on mobile devices

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is for educational and personal use. Please respect the Swedish Hockey Federation's terms of service when using their data.

## Acknowledgments

- **Swedish Hockey Federation** for providing the statistics data
- **Microsoft Fluent UI** for the component library
- **Vite** for the excellent build tool
- **React Team** for the framework
