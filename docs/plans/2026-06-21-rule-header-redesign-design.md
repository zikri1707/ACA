# Design Document: Rule Header Card Redesign

## Goal
Redesign the active rule header card in the Visualizer tab of the Rule Base Manager to look more modern, premium, and professional.

## UI Specifications
1. **Layout**:
   - Left-aligned rule code, category label, rule name, and description.
   - Right-aligned active/draft status pill with a glowing pulse animation.
2. **Category-Based Theming**:
   - Card displays a solid left border and a soft background gradient themed after the rule's primary account category (Aset, Kewajiban, Ekuitas, Pendapatan, Beban).
3. **Animations**:
   - Pulse animations for active (green glow) and draft (red glow) dots inside the status pill.

## Technical Design
- **Target File**: [RuleBaseIndex.jsx](file:///c:/Users/HP/Documents/ACA/frontend/src/pages/RuleBaseIndex.jsx)
- **Style changes**:
  - Add `@keyframes pulseGlow` and `@keyframes pulseGlowRed` with classes `.glowing-dot-active` and `.glowing-dot-draft` to the internal `<style>` element.
  - Update rendering of the rule header inside `activeTab === 'visualizer'` to map categories, apply gradients, left border highlights, and the glowing status dot.
