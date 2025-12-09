# Safe Harbor 2025 Tax Shield

## Overview

Safe Harbor 2025 Tax Shield is a privacy-focused, client-side tax calculator designed for US solopreneurs and freelancers earning $50k-$500k annually. The application calculates estimated quarterly tax payments for the 2025 tax year using the IRS "Safe Harbor" method to help users avoid underpayment penalties. Built as a single-page React application, it performs all calculations in the browser without any backend database, ensuring complete user privacy. The interface follows a Stripe-inspired FinTech aesthetic emphasizing trust, clarity, and transparency.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server, providing fast HMR and optimized production builds
- Wouter for lightweight client-side routing (single-page application pattern)

**UI Component System**
- Shadcn/ui component library with Radix UI primitives for accessible, unstyled components
- Tailwind CSS for utility-first styling following a custom design system
- Custom theme with Stripe-inspired FinTech aesthetic defined in CSS variables
- Inter font family (Google Fonts) optimized for financial data readability

**State Management & Data Fetching**
- TanStack Query (React Query) for async state management and caching
- Local component state using React hooks for calculator inputs
- No global state management needed due to simple, single-page nature

**Tax Calculation Logic**
- Pure client-side calculations implemented in `lib/taxCalculator.ts`
- 2025 tax year constants including standard deductions, tax brackets, and self-employment tax rates
- Safe Harbor algorithm implementation: calculates the lesser of 100%/110% of prior year tax OR 90% of current year projected liability
- Progressive tax bracket calculations for both single and married filing statuses
- Self-employment tax calculations with Social Security wage base caps and Medicare thresholds

**Design System Principles**
1. Trust through transparency: All calculation steps visible to users
2. Privacy-first visual language: Minimal UI chrome, no tracking indicators
3. Clarity over cleverness: Direct labels, obvious interactions, zero ambiguity
4. Consistent spacing using Tailwind units (4, 6, 8, 12, 16)
5. Typography hierarchy with Inter font at various weights for different UI elements

### Backend Architecture

**Server Setup**
- Express.js server serving static files and providing minimal API infrastructure
- Development mode uses Vite middleware for HMR and module transformation
- Production mode serves pre-built static assets from `dist/public`

**Data Storage Strategy**
- **No persistent database by design** - privacy is a core constraint
- In-memory storage (`MemStorage` class) provided as placeholder for potential future features
- All tax calculations happen client-side in the browser
- User schema defined in Drizzle ORM but currently unused (supports future opt-in features)

**Session Management**
- No authentication or session management currently implemented
- Session infrastructure (express-session, connect-pg-simple) available but unused
- Supports future opt-in features while maintaining current privacy-first approach

### External Dependencies

**UI Framework & Components**
- React and React DOM for component rendering
- Radix UI primitives (@radix-ui/*) for accessible headless components
- Lucide React for icons
- class-variance-authority for component variant management
- clsx and tailwind-merge for conditional className composition

**Forms & Validation**
- React Hook Form for form state management
- Zod for schema validation
- @hookform/resolvers for integrating Zod with React Hook Form
- drizzle-zod for generating Zod schemas from Drizzle ORM schemas

**Database & ORM (Infrastructure Only)**
- Drizzle ORM configured for PostgreSQL
- @neondatabase/serverless for Neon database connectivity
- Database currently unused - infrastructure present for future opt-in features

**Development Tools**
- TypeScript for type safety
- ESBuild for server bundling
- Vite plugins for Replit integration (@replit/vite-plugin-*)
- PostCSS with Autoprefixer for CSS processing

**Styling**
- Tailwind CSS with custom configuration
- Custom color palette using HSL values and CSS variables
- New York style variant from Shadcn/ui

**Date Handling**
- date-fns for date manipulation and formatting

**Key Architectural Decisions**

1. **Privacy-First Architecture**: No backend database ensures user financial data never leaves their browser, addressing privacy concerns critical for tax calculations.

2. **Client-Side Calculations**: All tax logic runs in the browser using exact 2025 tax year constants, eliminating server dependency and enabling offline functionality.

3. **Component Library Choice**: Shadcn/ui provides copy-paste components rather than npm dependency, allowing customization while maintaining design consistency.

4. **Single-Page Application**: Wouter provides lightweight routing for potential future pages while keeping bundle size minimal.

5. **Type Safety**: TypeScript throughout ensures tax calculation accuracy through compile-time type checking.

6. **Design System**: Stripe-inspired aesthetic chosen to convey trust and professionalism essential for financial tools, documented in `design_guidelines.md`.

7. **Future-Ready Infrastructure**: Database and session management infrastructure present but inactive, allowing easy opt-in feature additions without architectural changes.

## Recent Changes (December 2025)

### Completed Features
- **Local Storage Persistence**: User inputs (filing status, prior year tax, prior year AGI, current year profit) persist across browser sessions using the `useLocalStorage` hook
- **Calculation Explanation**: Collapsible 7-step breakdown showing exactly how Safe Harbor calculations work
- **Penalty Savings Comparison**: Shows potential IRS underpayment penalties avoided by using Safe Harbor method
- **PDF Export**: Two export options - Tax Summary PDF and IRS Form 1040-ES payment vouchers using jspdf library
- **Branding Footer**: Footer with link to Playbook Media at creatoraiplaybook.co

### Lead Generation Features
- **Email Capture Modal ("Soft Gate")**: Modal popup that collects first name and email before downloading the personalized tax plan PDF
- **Lead Magnet PDF**: Professional PDF named "2025_Safe_Harbor_Plan.pdf" with personalized greeting, 4 quarterly payment deadlines, and exact dollar amounts
- **FreshBooks Affiliate Card ("Revenue Bridge")**: High-visibility card with "Stop Guessing" headline promoting FreshBooks with "Start Free Trial" CTA
- **Beehiiv Newsletter Integration**: Backend proxy at `/api/subscribe` securely connects to Beehiiv API for newsletter subscriptions

### API Routes
- **POST /api/subscribe**: Backend proxy for Beehiiv newsletter subscriptions
  - Request body: `{ email: string, firstName?: string }`
  - Uses `BEEHIIV_API_KEY` and `BEEHIIV_PUB_ID` environment secrets
  - Adds subscribers with `utm_source: "Tax_Shield_Tool"` tracking
  - Handles duplicate subscribers (409) gracefully

### Key Files
- `client/src/components/TaxCalculator.tsx` - Main calculator component with all UI including email modal
- `client/src/lib/taxCalculator.ts` - Pure calculation logic with 2025 tax constants
- `client/src/lib/pdfExport.ts` - PDF generation including lead magnet PDF with personalized content
- `client/src/hooks/useLocalStorage.ts` - Local storage persistence hook
- `design_guidelines.md` - Stripe-inspired FinTech design system

### Integration Notes
- FreshBooks affiliate link is set to `https://www.freshbooks.com` - update with your actual affiliate URL
- Beehiiv integration is fully connected via backend proxy at `/api/subscribe`
- Required secrets: `BEEHIIV_API_KEY` and `BEEHIIV_PUB_ID` (configured in Secrets pane)
- Subscribers are tagged with `utm_source: "Tax_Shield_Tool"` for tracking

## Vercel Deployment

### Configuration
The app is configured for Vercel deployment with:
- `vercel.json` - Deployment configuration with rewrites
- `api/index.ts` - Serverless function adapter that exports the Express app
- `server/index.ts` - Dual-mode server (development with Vite, production for serverless)

### Deployment Steps
1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard:
   - `BEEHIIV_API_KEY` - Your Beehiiv API key
   - `BEEHIIV_PUB_ID` - Your Beehiiv publication ID
3. Deploy - Vercel will:
   - Build the frontend with `npm run build`
   - Serve static files from `dist/public` via CDN
   - Deploy API routes as serverless functions

### Architecture on Vercel
- **Frontend**: Static files served from Vercel's CDN (not Express)
- **API**: `/api/subscribe` runs as a Node.js serverless function via `api/index.ts`
- **No Express static serving**: Vercel handles all frontend asset delivery

### Development vs Production
- **Development** (`NODE_ENV !== 'production'`): Full Express server with Vite HMR, httpServer.listen()
- **Production** (`NODE_ENV === 'production'`): Routes registered synchronously, no server listening (Vercel invokes as serverless)

This dual-mode approach ensures:
- Development works with hot reload and full debugging
- Production is optimized for Vercel's serverless model (no httpServer, synchronous route registration)