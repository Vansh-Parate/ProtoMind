## ProtoMind SAR Narrative Dashboard

A professional internal dashboard for compliance analysts to triage SAR (Suspicious Activity Report) narratives, built to follow the design system defined in `design.md`.

### Stack

- **Frontend**: React + TypeScript
- **Build tool**: Vite
- **Styling**: Tailwind CSS with custom palette (slate, warm stone, sage, terracotta, amber)
- **Routing**: React Router

### Key Screens

- **Cases Overview**: Table of SAR cases with risk badges, status, and scores.
- **Case Detail**: Customer profile, risk assessment, reasons for alert, transaction timeline placeholder, and generated narrative preview.
- **SAR Editor**: Two-column layout with generated narrative on the left and editable narrative on the right, with character count and mock autosave.
- **Audit Timeline**: Vertical timeline of actions taken on narratives.

### Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the dev server:

   ```bash
   npm run dev
   ```

3. Open the app in your browser at the URL printed in the terminal (by default `http://localhost:5173`).

### Next Steps

- Wire the mock data in `src/data/mockCases.ts` to a real backend.
- Replace the timeline placeholder in `CaseDetailPage` with a real visualization.
- Connect the SAR editor save/submit actions to your workflow engine.

