# Frontend UI — HCP Interaction Logger

This directory contains the user interface for the **HCP Interaction Logger**, built with **React 18**, **TypeScript**, **Redux Toolkit**, and **TailwindCSS**. It implements a beautiful, highly polished split-screen design tailored for field sales representatives logging post-visit notes.

---

## Architectural Philosophy: AI-Controlled UI

Unlike standard web forms where users interact directly with input fields, this UI is **entirely AI-controlled**:
- **Disabled State**: Every single input field, dropdown, and checkbox in the form panel is disabled. Direct manual data entry is restricted.
- **Conversational Driving**: Form updates are performed exclusively by sending conversational instructions to the right-hand Chat Panel.
- **Visual Feedback**: When the backend agent mutates specific form properties, those fields flash with a soft blue highlight animation (`.field-updated`) for seamless visual confirmation.

---

## Codebase Layout

```
frontend/
├── public/
│   ├── index.html        # Main HTML entry point with premium meta headers
│   └── favicon.ico       # Brand icon
└── src/
    ├── App.tsx           # Split-screen responsive layout wrapper & Redux setup
    ├── types.ts          # Strongly typed definitions for FormState and API models
    ├── index.css         # Tailwind directives, Google Inter font imports, and keyframe animations
    ├── store/
    │   ├── index.ts      # Redux store configuration
    │   ├── formSlice.ts  # State controller managing form updates and animation triggers
    │   └── chatSlice.ts  # State controller for messages, tool badges, and loading indicators
    └── components/
        ├── FormPanel.tsx # Left pane: displays disabled HCP, Visit, Products, and Notes state
        └── ChatPanel.tsx # Right pane: conversational interface communicating with FastAPI
```

---

## Core Components & Capabilities

### 1. State Management (`Redux Toolkit`)
- **`formSlice`**: Holds the current values of all 12 form fields. Exposes actions to sync state returned by the `/chat` endpoint.
- **`chatSlice`**: Appends rep messages and assistant responses. Integrates tool badge markers (e.g. `⚡ Log Interaction`, `⚡ Lookup HCP`) under assistant bubbles to clarify AI routing logic.

### 2. Real-Time Highlight Animations
To prevent the user from having to reread the entire form after an update, a custom CSS keyframe animation (`highlight-flash`) dynamically attaches to any input container whose value diverges from the previous state.

### 3. Responsive Layout
Utilizes CSS Flexbox and Tailwind grid layout utilities to present a clean 50/50 split on desktop screens while graceful stacking on narrower devices.

---

## Local Development Setup

### Prerequisites
- Node.js version 18 or higher
- The Backend FastAPI service running concurrently on port `8000`

### Running the App

1. **Install Node Dependencies**
   ```bash
   npm install
   ```

2. **Start the Local Development Server**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application in your browser. Live reloading is fully enabled.

3. **Building for Production**
   ```bash
   npm run build
   ```
   Bundles optimized and minified static assets into the `build/` directory for deployment.
