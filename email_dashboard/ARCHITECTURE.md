# 🏗️ Architecture Overview

## Application Structure

```
Email Dashboard Application
│
├── 🔐 Authentication Layer
│   └── Login Page (Simulated Auth)
│
├── 📐 Layout Layer
│   ├── DashboardLayout
│   │   ├── Sidebar (Fixed Left)
│   │   └── Main Content Area
│   │
│   └── Sidebar Components
│       ├── Logo & Branding
│       ├── User Profile Dropdown
│       ├── Navigation Menu
│       └── Footer
│
├── 📄 Page Layer
│   ├── Home Dashboard
│   ├── Response Dashboard
│   ├── Aging Report
│   ├── Sentiment Analysis
│   └── Settings
│
├── 🧩 Component Layer
│   ├── UI Components (8)
│   ├── Layout Components (2)
│   └── Common Components (1)
│
└── 🛠️ Utility Layer
    └── Helper Functions
```

---

## Component Hierarchy

### Login Flow
```
App
└── Router
    └── Login Page
        ├── Card
        │   ├── CardHeader
        │   ├── CardContent
        │   │   ├── Input (username)
        │   │   ├── Input (password)
        │   │   └── Button (submit)
        │   └── CardFooter
        └── Background Gradient
```

### Dashboard Flow
```
App
└── Router
    └── DashboardLayout
        ├── Sidebar
        │   ├── Logo
        │   ├── User Profile
        │   │   ├── Avatar
        │   │   └── Dropdown Menu
        │   ├── Navigation Menu
        │   │   └── NavLink Items
        │   │       ├── Icon
        │   │       ├── Label
        │   │       └── Badge (optional)
        │   └── Settings Link
        │
        └── Main Content (Outlet)
            └── [Current Page Component]
```

### Home Dashboard Structure
```
Home
├── Header Section
├── Quick Stats Grid
│   └── 4 × Stat Cards
│       ├── Icon
│       ├── Value
│       ├── Trend Badge
│       └── Link
├── Content Grid
│   ├── Quick Access (2 cols)
│   │   └── 3 × Dashboard Links
│   │       └── Card with Icon
│   └── Recent Activity (1 col)
│       ├── Activity Feed
│       │   └── Activity Items
│       └── System Status
│           └── Status Items
```

### Response Dashboard Structure
```
ResponseDashboard
├── Header Section
├── FilterSection Component
│   ├── Customer Search Input
│   ├── Business Type Selector
│   ├── Time Period Dropdown
│   └── Action Buttons
├── Data Table Card
│   └── Table
│       ├── TableHeader
│       └── TableBody
│           └── TableRow (per user)
│               ├── Avatar + Name
│               └── Category Badges (5)
│                   └── onClick → Modal
└── Email Details Modal
    ├── ModalHeader
    ├── ModalContent
    │   └── Email Cards
    │       ├── Sender Info
    │       ├── Subject
    │       ├── Preview
    │       ├── Metadata Badges
    │       └── Action Buttons
    └── ModalClose
```

### Aging Dashboard Structure
```
AgingDashboard
├── Header Section
├── FilterSection Component
├── Summary Stats Grid
│   └── 4 × Stat Cards
│       ├── Icon
│       ├── Value
│       └── Trend Indicator
├── Aging Table Card
│   └── Table
│       ├── TableHeader (5 time buckets)
│       └── TableBody
│           └── TableRow (per user)
│               ├── Avatar + Name
│               └── Aging Buckets (4)
│                   └── Badge + Heatmap
└── Legend Card
```

### Sentiment Dashboard Structure
```
SentimentDashboard
├── Header Section
├── Summary Stats Grid (3 cards)
├── Main Grid Layout
│   ├── Left Panel (1 col)
│   │   ├── Filters Card
│   │   │   ├── Customer Search
│   │   │   ├── Business Type Radio
│   │   │   └── Time Period Buttons
│   │   ├── Sentiment Scale Card
│   │   │   └── 5 × Scale Items
│   │   └── Key Insights Card
│   │
│   └── Right Panel (3 cols)
│       └── Chart Card
│           ├── Toggle Button
│           └── Content (Chart or Table)
│               ├── LineChart (Recharts)
│               │   ├── XAxis
│               │   ├── YAxis
│               │   ├── CartesianGrid
│               │   ├── Tooltip
│               │   ├── Legend
│               │   ├── ReferenceLine
│               │   └── 4 × Line (customers)
│               └── Data Table (alternate view)
```

### Settings Structure
```
Settings
├── Header Section
├── Tab Navigation
│   ├── User Management Tab
│   ├── Email Configuration Tab
│   └── Notifications Tab
├── Tab Content
│   └── [Active Tab Component]
│       ├── User Management
│       │   ├── Add User Button
│       │   └── User Table
│       │       └── TableRow
│       │           ├── Avatar + Info
│       │           └── Action Buttons
│       ├── Email Config
│       │   └── Form Fields
│       └── Notifications
│           └── Toggle Switches
└── Create User Modal
    ├── Form Fields
    │   ├── Email Input
    │   ├── Name Input
    │   ├── Password Input
    │   ├── Role Select
    │   └── Department Select
    └── Action Buttons
```

---

## Data Flow

### State Management Pattern

```
Component State (useState)
    ↓
User Interaction
    ↓
Event Handler
    ↓
State Update
    ↓
Re-render
    ↓
Updated UI
```

### Example: Filter Flow
```
FilterSection Component
    ↓ (user changes filter)
handleFilterChange()
    ↓ (updates local state)
setFilters({ ...filters, field: value })
    ↓ (user clicks Apply)
onApplyFilters(filters)
    ↓ (parent component receives)
Parent updates data display
```

### Example: Modal Flow
```
Table Cell (Badge)
    ↓ (user clicks)
handleCategoryClick(user, category, count)
    ↓ (updates state)
setModalOpen(true)
setSelectedUser(user)
setSelectedCategory(category)
    ↓ (modal renders)
Modal Component (open={modalOpen})
    ↓ (displays email list)
Email Cards with Actions
```

---

## Routing Architecture

```
/ (root)
    ↓ (redirect)
/login
    ↓ (after auth)
/dashboard (DashboardLayout wrapper)
    ├── /dashboard (Home)
    ├── /response (Response Dashboard)
    ├── /aging (Aging Report)
    ├── /sentiment (Sentiment Analysis)
    └── /settings (Settings)
```

### Route Protection (Future)
```
PrivateRoute Component
    ↓ (check auth)
isAuthenticated?
    ├── Yes → Render Component
    └── No → Redirect to /login
```

---

## Component Communication

### Props Down
```
Parent Component
    ↓ (passes props)
Child Component
    ↓ (receives props)
Renders with props
```

### Events Up
```
Child Component
    ↓ (user interaction)
Calls callback prop
    ↓ (event bubbles up)
Parent Component
    ↓ (handles event)
Updates state
```

### Example
```jsx
// Parent
<FilterSection 
  onApplyFilters={(filters) => handleFilters(filters)}
/>

// Child
<Button onClick={() => onApplyFilters(currentFilters)}>
  Apply
</Button>
```

---

## Styling Architecture

### Tailwind Utility-First
```
Component
    ↓ (applies classes)
Tailwind Utilities
    ↓ (processes)
CSS Output
    ↓ (renders)
Styled Component
```

### Class Composition
```
Base Classes
    +
Conditional Classes
    +
Responsive Classes
    ↓ (merged with cn())
Final className
```

### Example
```jsx
className={cn(
  "base-class",              // Always applied
  isActive && "active-class", // Conditional
  "md:hidden lg:block"       // Responsive
)}
```

---

## Design System Layers

```
1. Design Tokens (CSS Variables)
   ↓
2. Tailwind Configuration
   ↓
3. Base Components (UI)
   ↓
4. Composite Components (Common)
   ↓
5. Page Components
   ↓
6. Application
```

---

## File Organization Strategy

### By Feature
```
components/
├── ui/           # Generic, reusable UI
├── layout/       # Layout-specific
└── common/       # Shared business logic
```

### By Type
```
pages/            # Route components
lib/              # Utilities
assets/           # Static files
```

---

## Performance Considerations

### Component Optimization
```
React.memo()          # Prevent unnecessary re-renders
useCallback()         # Memoize callbacks
useMemo()            # Memoize computed values
Lazy Loading         # Code splitting
```

### Future Optimizations
```
Virtual Scrolling    # Large tables
Image Optimization   # Next.js Image
Bundle Splitting     # Route-based
Service Workers      # PWA features
```

---

## Scalability Patterns

### Adding New Dashboard
1. Create page component in `src/pages/`
2. Add route in `App.jsx`
3. Add navigation item in `Sidebar.jsx`
4. Reuse existing UI components
5. Add filters if needed

### Adding New UI Component
1. Create in `src/components/ui/`
2. Follow shadcn/ui patterns
3. Use `cn()` for class merging
4. Export component
5. Document usage

### Adding New Feature
1. Identify required components
2. Create/reuse components
3. Add to appropriate page
4. Update routing if needed
5. Test responsiveness

---

## Integration Points

### API Integration (Future)
```
Component
    ↓ (calls)
API Service
    ↓ (fetches)
Backend API
    ↓ (returns)
Component State
    ↓ (renders)
UI Update
```

### Authentication Flow (Future)
```
Login
    ↓ (submit)
Auth Service
    ↓ (validate)
JWT Token
    ↓ (store)
LocalStorage/Context
    ↓ (use)
Protected Routes
```

---

## Testing Strategy (Future)

### Unit Tests
```
Component
    ↓ (test)
Render + Assertions
    ↓ (verify)
Props, State, Events
```

### Integration Tests
```
Page Component
    ↓ (test)
User Interactions
    ↓ (verify)
Expected Outcomes
```

### E2E Tests
```
Full User Flow
    ↓ (test)
Login → Navigate → Interact
    ↓ (verify)
Complete Workflow
```

---

## Deployment Architecture

```
Development
    ↓ (npm run build)
Production Build
    ↓ (optimize)
Static Assets
    ↓ (deploy)
CDN / Web Server
    ↓ (serve)
End Users
```

---

## Key Architectural Decisions

### ✅ Why React Router?
- Client-side routing
- Nested routes support
- Easy navigation management

### ✅ Why Tailwind CSS?
- Utility-first approach
- Rapid development
- Consistent design system
- Small bundle size

### ✅ Why shadcn/ui Pattern?
- Copy-paste components
- Full customization
- No package dependencies
- Type-safe (ready for TS)

### ✅ Why Recharts?
- React-native charts
- Responsive by default
- Easy customization
- Good documentation

### ✅ Why Component Composition?
- Reusability
- Maintainability
- Testability
- Flexibility

---

## Future Architecture Enhancements

1. **State Management**: Redux/Zustand for global state
2. **API Layer**: Axios/Fetch wrapper with interceptors
3. **Authentication**: JWT with refresh tokens
4. **Real-time**: WebSocket integration
5. **Caching**: React Query for server state
6. **TypeScript**: Type safety across app
7. **Testing**: Vitest + React Testing Library
8. **CI/CD**: Automated deployment pipeline
9. **Monitoring**: Error tracking (Sentry)
10. **Analytics**: User behavior tracking

---

**Architecture is designed for scalability, maintainability, and performance.**
