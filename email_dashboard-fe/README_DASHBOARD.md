# Email Dashboard - Modern React Application

A modern, elegant email management dashboard built with React, Tailwind CSS, and shadcn/ui components.

## 🎨 Features

- **Modern UI/UX**: Clean, elegant design with smooth animations and transitions
- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile
- **Reusable Components**: Modular component architecture for easy maintenance
- **Multiple Dashboards**:
  - Home Dashboard with quick stats and activity feed
  - Response Dashboard with unreplied emails by category
  - Aging Report with time-based email analysis
  - Sentiment Analysis with interactive charts
  - Settings page with user management

## 🚀 Tech Stack

- **React 19** - UI framework
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Recharts** - Chart library for data visualization
- **Lucide React** - Beautiful icon library
- **Vite** - Fast build tool

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

## 🏃 Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔑 Login

The login page is the entry point. Use any credentials to access the dashboard (authentication is simulated).

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Badge.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   ├── Select.jsx
│   │   └── Avatar.jsx
│   ├── layout/          # Layout components
│   │   ├── Sidebar.jsx
│   │   └── DashboardLayout.jsx
│   └── common/          # Common components
│       └── FilterSection.jsx
├── pages/               # Page components
│   ├── Login.jsx
│   ├── Home.jsx
│   ├── ResponseDashboard.jsx
│   ├── AgingDashboard.jsx
│   ├── SentimentDashboard.jsx
│   └── Settings.jsx
├── lib/
│   └── utils.js         # Utility functions
├── App.jsx              # Main app component with routing
└── main.jsx             # Entry point
```

## 🎯 Key Features by Page

### Login Page
- Centered card layout with gradient background
- Username and password fields
- Remember me checkbox
- Smooth animations

### Home Dashboard
- Quick stats cards with trends
- Recent activity feed
- Quick access to other dashboards
- System status indicators

### Response Dashboard
- Filterable data table
- Email categories (Inquiry, Complaint, Request, Feedback, Other)
- Clickable badges to view email details
- Modal with email list and actions

### Aging Report
- Summary cards with metrics
- Color-coded heatmap table
- Time buckets (24-48h, 48-72h, 72-168h, 7+ days)
- Trend indicators

### Sentiment Analysis
- Interactive line chart with Recharts
- Left panel with filters and legend
- Sentiment scale visualization
- Toggle between chart and data table view
- Key insights cards

### Settings
- Tabbed interface
- User management with CRUD operations
- Email configuration
- Notification preferences

## 🎨 Design System

### Colors
- Primary: Blue (#3B82F6)
- Secondary: Purple (#8B5CF6)
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Danger: Red (#EF4444)

### Components
All components follow shadcn/ui design patterns with:
- Consistent spacing and padding
- Smooth transitions and animations
- Hover states and focus indicators
- Accessible markup

## 🔧 Customization

### Tailwind Configuration
Customize colors, spacing, and other design tokens in `tailwind.config.js`

### Component Variants
Components use `class-variance-authority` for variant management. Modify variants in individual component files.

## 📱 Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1279px
- Desktop: ≥ 1280px
- Sidebar collapse: < 1024px

## 🌟 Best Practices

- **Component Reusability**: All UI components are reusable and accept props
- **Consistent Styling**: Using Tailwind utility classes for consistent design
- **Performance**: Lazy loading and optimized rendering
- **Accessibility**: ARIA labels and keyboard navigation support
- **Code Organization**: Clear separation of concerns

## 🔮 Future Enhancements

- Real API integration
- Authentication with JWT
- Real-time updates with WebSockets
- Advanced filtering and search
- Export to Excel/PDF
- Dark mode support
- Mobile app version

## 📄 License

This project is private and proprietary.

## 👥 Support

For support, contact your development team.
