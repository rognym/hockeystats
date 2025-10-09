# Swedish Hockey Stats URL Tester# React + TypeScript + Vite

npm run dev

A React TypeScript web application for testing URLs from the Swedish Hockey Stats website to find valid game event pages.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## OverviewCurrently, two official plugins are available:

This application tests URLs in the format `https://stats.swehockey.se/Game/Events/[ID]` where the ID ranges from 1,000,000 to 1,100,000. It helps identify which game event pages exist and are accessible.- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Features

## React Compiler

- **Batch URL Testing**: Test thousands of URLs efficiently in batches

- **Progress Tracking**: Real-time progress bar and statisticsThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

- **Configurable Range**: Set custom start and end IDs for testing

- **Results Summary**: View successful and failed URLs with response details## Expanding the ESLint configuration

- **Response Time Tracking**: Monitor how long each request takes

- **Responsive Design**: Works on desktop and mobile devicesIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

## Getting Started```js

export default defineConfig([

### Prerequisites globalIgnores(['dist']),

{

- Node.js (version 18 or higher) files: ['**/*.{ts,tsx}'],

- npm or yarn extends: [

      // Other configs...

### Installation

      // Remove tseslint.configs.recommended and replace with this

1. Clone or download this repository tseslint.configs.recommendedTypeChecked,

2. Install dependencies: // Alternatively, use this for stricter rules

   ````bash tseslint.configs.strictTypeChecked,

   npm install      // Optionally, add this for stylistic rules

   ```      tseslint.configs.stylisticTypeChecked,
   ````

### Running the Application // Other configs...

    ],

Start the development server: languageOptions: {

````bash parserOptions: {

npm run dev        project: ['./tsconfig.node.json', './tsconfig.app.json'],

```        tsconfigRootDir: import.meta.dirname,

      },

The application will be available at `http://localhost:5173`      // other options...

    },

### Building for Production  },

])

Create a production build:```

```bash

npm run buildYou can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

````

````js

Preview the production build:// eslint.config.js

```bashimport reactX from 'eslint-plugin-react-x'

npm run previewimport reactDom from 'eslint-plugin-react-dom'

````

export default defineConfig([

## Usage globalIgnores(['dist']),

{

1. **Set ID Range**: Configure the start and end IDs (default: 1,000,000 to 1,100,000) files: ['**/*.{ts,tsx}'],

2. **Start Testing**: Click "Start Testing" to begin the URL validation process extends: [

3. **Monitor Progress**: Watch the progress bar and statistics update in real-time // Other configs...

4. **View Results**: Browse successful URLs (clickable links) and failed attempts // Enable lint rules for React

5. **Stop if Needed**: Use the "Stop" button to halt testing at any time reactX.configs['recommended-typescript'],

   // Enable lint rules for React DOM

## Technical Details reactDom.configs.recommended,

    ],

- **Framework**: React 18 with TypeScript languageOptions: {

- **Build Tool**: Vite parserOptions: {

- **Testing Method**: Uses `fetch()` with HEAD requests for efficiency project: ['./tsconfig.node.json', './tsconfig.app.json'],

- **Batch Processing**: Tests 50 URLs at a time to avoid overwhelming the server tsconfigRootDir: import.meta.dirname,

- **Error Handling**: Catches network errors and HTTP status codes },

- **Performance**: Tracks response times for each request // other options...

  },

## Development },

])

### Available Scripts```

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Project Structure

```
src/
├── App.tsx          # Main application component
├── App.css          # Application styles
├── main.tsx         # Application entry point
└── vite-env.d.ts    # Vite type definitions
```

## Notes

- The application makes HEAD requests to minimize bandwidth usage
- A small delay is added between batches to be respectful to the target server
- Failed requests may be due to CORS policies, network issues, or non-existent pages
- Results are limited to the first 50 failed URLs for performance reasons

## License

This project is for educational and testing purposes.
