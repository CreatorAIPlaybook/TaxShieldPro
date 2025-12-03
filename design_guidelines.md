# Safe Harbor 2025 Tax Shield - Design Guidelines

## Design Approach
**System:** Stripe-inspired FinTech aesthetic emphasizing trust, clarity, and privacy
**Rationale:** Tax calculators demand precision, transparency, and credibility. Stripe's design system excels at making complex financial data digestible while maintaining user confidence.

## Core Design Principles
1. **Trust Through Transparency:** Every calculation step visible, no hidden logic
2. **Privacy-First Visual Language:** Minimal chrome, no tracking indicators, local-first messaging
3. **Clarity Over Cleverness:** Direct labels, obvious interactions, zero ambiguity

## Typography System
- **Primary Font:** Inter (Google Fonts) - optimized for financial data readability
- **Heading:** font-semibold, text-2xl to text-3xl for page title
- **Section Headers:** font-medium, text-lg
- **Input Labels:** font-medium, text-sm, text-slate-700
- **Body/Help Text:** font-normal, text-sm, text-slate-600
- **Numbers/Results:** font-semibold with tabular-nums for alignment
- **Critical CTAs:** font-medium, text-base

## Layout System
**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16 (p-4, gap-6, mb-8, py-12, space-y-16)

**Container Structure:**
- Outer wrapper: min-h-screen bg-slate-50 py-12
- Main container: max-w-2xl mx-auto px-4
- Card spacing: space-y-8 between major sections
- Inner card padding: p-6 to p-8

## Component Library

### Input Components
**Toggle Switch (Filing Status):**
- Segmented control design (not checkbox-style)
- Two equal-width buttons in rounded container
- Active state: bg-slate-900 text-white, inactive: text-slate-600
- Container: bg-slate-100 rounded-lg p-1

**Number Inputs:**
- Label with inline tooltip icon (info circle)
- Input: border-slate-300, focus:border-slate-900, focus:ring-2 focus:ring-slate-200
- Prefix with $ symbol in muted color
- Large comfortable input fields: h-12 with text-base
- Currency formatting on blur (commas for thousands)

**Tooltips:**
- Small info icon next to labels
- Dark overlay tooltip on hover: bg-slate-900 text-white text-xs rounded-md p-2
- Max-width: max-w-xs

### Card Components
**Main Input Card:**
- bg-white rounded-xl shadow-lg p-8
- Form inputs stacked with space-y-6
- Clear visual hierarchy with section dividers (border-t border-slate-200 pt-6)

**Result Cards (Side-by-Side on Desktop):**
- Grid: grid grid-cols-1 md:grid-cols-2 gap-6
- Each card: bg-white rounded-xl shadow-lg p-6
- Header with small label + large dollar amount
- Breakdown list with smaller text below

**Recommended Card (Green Highlight):**
- bg-gradient-to-br from-emerald-50 to-emerald-100
- border border-emerald-200
- Badge: bg-emerald-600 text-white text-xs font-medium px-3 py-1 rounded-full

### Information Display
**Tax Breakdown Lists:**
- Flex rows: flex justify-between items-center
- Labels: text-sm text-slate-600, values: text-sm font-medium text-slate-900
- Dividers between line items: border-t border-slate-100 pt-2 mt-2
- Total row: border-t-2 border-slate-300 pt-3 mt-3 with font-semibold

**Quarterly Payment Grid:**
- Four-column grid on desktop (2x2 on mobile): grid grid-cols-2 md:grid-cols-4 gap-4
- Each quarter: small card with bg-slate-50 rounded-lg p-4
- Quarter label: text-xs text-slate-500, amount: text-lg font-semibold

### Privacy Badge
- Top-right corner: "100% Private • No Data Stored" badge
- Minimal design: text-xs text-slate-500 with lock icon

## Visual Hierarchy
1. **Page Title** (text-3xl font-semibold) + privacy badge
2. **Input Section** in prominent white card
3. **Results Section** with dual cards creating natural comparison
4. **Quarterly Breakdown** as supporting detail

## Interaction States
- **Hover:** Subtle border darkening (border-slate-400)
- **Focus:** Strong ring (ring-2 ring-slate-900 ring-offset-2)
- **Active Toggle:** Smooth 200ms transition
- **Disabled:** opacity-50 cursor-not-allowed
- **No animations** except smooth transitions on toggle and number formatting

## Accessibility
- All inputs have visible labels (no placeholder-only)
- Tooltips accessible via keyboard focus
- High contrast ratios: slate-900 on white for primary text
- Form validation messages: text-red-600 text-sm mt-1
- ARIA labels on toggle switch states

## Content Strategy
- Calculator loads immediately (no splash/loading)
- Progressive disclosure: results appear only after input completion
- Inline help via tooltips, no separate help section
- Clear CTA: implicit through form completion, no separate "Calculate" button needed (live calculation)