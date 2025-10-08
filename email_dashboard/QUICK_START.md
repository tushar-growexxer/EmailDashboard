# 🚀 Quick Start Guide - Email Dashboard

## Prerequisites
- Node.js (v18 or higher)
- npm or pnpm package manager

## Installation & Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

The application will start at: **http://localhost:5173**

## 🎯 First Time Usage

### 1. Login Page
- Navigate to `http://localhost:5173`
- You'll be redirected to the login page
- Enter any username and password (authentication is simulated)
- Click "Sign In"

### 2. Explore the Dashboard
After login, you'll see:

#### **Home Dashboard** (`/dashboard`)
- Overview of all metrics
- Quick access cards
- Recent activity feed
- System status

#### **Response Dashboard** (`/response`)
- View unreplied emails by category
- Click on any colored badge to see email details
- Use filters to narrow down results
- Export data

#### **Aging Report** (`/aging`)
- See emails grouped by age
- Color-coded heatmap (yellow → orange → red)
- Summary statistics at top
- Trend indicators

#### **Sentiment Analysis** (`/sentiment`)
- Interactive line chart showing sentiment trends
- Filter by customer, business type, time period
- Toggle between chart and table view
- View key insights

#### **Settings** (`/settings`)
- Manage users (Admin only)
- Configure email settings
- Set notification preferences

## 📁 File Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.jsx         # Button with variants
│   │   ├── Card.jsx           # Card container
│   │   ├── Input.jsx          # Input field
│   │   ├── Badge.jsx          # Colored badges
│   │   ├── Modal.jsx          # Modal dialog
│   │   ├── Table.jsx          # Data table
│   │   ├── Select.jsx         # Dropdown select
│   │   └── Avatar.jsx         # User avatar
│   ├── layout/
│   │   ├── Sidebar.jsx        # Left navigation sidebar
│   │   └── DashboardLayout.jsx # Main layout wrapper
│   └── common/
│       └── FilterSection.jsx  # Reusable filter component
├── pages/
│   ├── Login.jsx              # Login page
│   ├── Home.jsx               # Home dashboard
│   ├── ResponseDashboard.jsx  # Response dashboard
│   ├── AgingDashboard.jsx     # Aging report
│   ├── SentimentDashboard.jsx # Sentiment analysis
│   └── Settings.jsx           # Settings page
├── lib/
│   └── utils.js               # Utility functions
├── App.jsx                    # Main app with routing
└── main.jsx                   # Entry point
```

## 🎨 Customization

### Change Colors
Edit `tailwind.config.js` to customize the color palette:
```javascript
theme: {
  extend: {
    colors: {
      primary: "your-color",
      // ... other colors
    }
  }
}
```

### Modify Components
All components are in `src/components/ui/`. Each component accepts props for customization.

Example:
```jsx
<Button variant="destructive" size="lg">
  Delete
</Button>
```

### Add New Pages
1. Create a new file in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation item in `src/components/layout/Sidebar.jsx`

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## 📊 Mock Data

The application currently uses mock data. To integrate with real APIs:

1. Create an `api` folder in `src/`
2. Add API service files
3. Replace mock data in pages with API calls
4. Add loading and error states

Example:
```javascript
// src/api/emails.js
export const fetchUnrepliedEmails = async () => {
  const response = await fetch('/api/emails/unreplied');
  return response.json();
};
```

## 🎯 Key Features to Test

### ✅ Navigation
- Click sidebar menu items
- Active state highlighting
- User profile dropdown

### ✅ Filters
- Search customers
- Toggle business type
- Change time period
- Apply and reset filters

### ✅ Interactive Elements
- Click badges in Response Dashboard
- View email details in modal
- Toggle chart/table in Sentiment Dashboard
- Create user in Settings

### ✅ Responsive Design
- Resize browser window
- Test on mobile viewport
- Check tablet layout

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 3000
```

### Styling Issues
```bash
# Rebuild Tailwind
npm run build
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Component Usage Examples

### Button
```jsx
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
```

### Card
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Badge
```jsx
<Badge variant="blue">Inquiry</Badge>
<Badge variant="red">Critical</Badge>
<Badge variant="green">Success</Badge>
```

### Modal
```jsx
<Modal open={isOpen} onClose={() => setIsOpen(false)}>
  <ModalHeader>
    <ModalTitle>Title</ModalTitle>
  </ModalHeader>
  <ModalContent>
    Content
  </ModalContent>
  <ModalFooter>
    <Button>Action</Button>
  </ModalFooter>
</Modal>
```

## 🌟 Pro Tips

1. **Use the Filter Section** - It's reusable across all dashboards
2. **Check Hover States** - All interactive elements have smooth hover effects
3. **Keyboard Navigation** - Tab through forms and buttons
4. **Responsive Testing** - Use browser dev tools to test different screen sizes
5. **Component Reusability** - All UI components can be imported and reused

## 📞 Need Help?

- Check `PROJECT_SUMMARY.md` for detailed implementation info
- Review `README_DASHBOARD.md` for comprehensive documentation
- Inspect component files for prop definitions and usage

## ✨ Next Steps

1. ✅ Run the application
2. ✅ Explore all pages
3. ✅ Test interactive features
4. 🔄 Integrate with your backend API
5. 🔄 Add authentication
6. 🔄 Deploy to production

---

**Happy Coding! 🎉**
