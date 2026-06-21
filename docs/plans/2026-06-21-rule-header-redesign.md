# Rule Header Card Redesign Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Redesign the active rule header card in the Visualizer tab of the Rule Base Manager to look more modern, premium, and professional.

**Architecture:** Add glowing CSS keyframe animations to the stylesheet in [RuleBaseIndex.jsx](file:///c:/Users/HP/Documents/ACA/frontend/src/pages/RuleBaseIndex.jsx). Redesign the rule header component inside the visualizer tab with dynamic, category-themed soft background gradients, left colored highlight borders, improved typography, and an active/draft status pill with a glowing pulse dot.

**Tech Stack:** React, CSS, Vite

---

### Task 1: Add CSS Pulse Animations

**Files:**
- Modify: [RuleBaseIndex.jsx](file:///c:/Users/HP/Documents/ACA/frontend/src/pages/RuleBaseIndex.jsx)

**Step 1: Write the minimal CSS code for glowing status dots inside RuleBaseIndex.jsx stylesheet**
Add `@keyframes pulseGlow`, `@keyframes pulseGlowRed`, and class names `.glowing-dot-active` and `.glowing-dot-draft` inside the page's `<style>` tag around lines 892-905.

**Step 2: Commit**
```bash
git add frontend/src/pages/RuleBaseIndex.jsx
git commit -m "style: add glowing dot animations for rule active status"
```

---

### Task 2: Redesign the Rule Header Card

**Files:**
- Modify: [RuleBaseIndex.jsx](file:///c:/Users/HP/Documents/ACA/frontend/src/pages/RuleBaseIndex.jsx)

**Step 1: Update the Rule Title and Details card markup and inline styles**
Modify lines 1381–1392 to fetch the `debit_account_category` and `credit_account_category`, apply a soft category gradient, left accent borders, upgraded typography with the rule code capsule at the top, and the glowing indicator inside the status badge.

**Step 2: Verify the build passes**
Run: `npm run build --prefix frontend`
Expected: Production build compiles successfully.

**Step 3: Commit**
```bash
git add frontend/src/pages/RuleBaseIndex.jsx
git commit -m "feat: redesign rule header card with dynamic gradient and glowing badge"
```
