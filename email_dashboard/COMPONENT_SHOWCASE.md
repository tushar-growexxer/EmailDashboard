# 🎨 Component Showcase

## UI Components Library

All components are built with shadcn/ui patterns and Tailwind CSS.

---

## 1. Button Component

**Location**: `src/components/ui/Button.jsx`

### Variants
```jsx
// Primary button (default)
<Button>Click Me</Button>

// Destructive (red)
<Button variant="destructive">Delete</Button>

// Outline
<Button variant="outline">Cancel</Button>

// Secondary (purple)
<Button variant="secondary">Secondary</Button>

// Ghost (transparent)
<Button variant="ghost">Ghost</Button>

// Link style
<Button variant="link">Link Button</Button>
```

### Sizes
```jsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

### With Icons
```jsx
import { Mail, Trash2 } from "lucide-react";

<Button>
  <Mail className="h-4 w-4 mr-2" />
  Send Email
</Button>

<Button variant="destructive">
  <Trash2 className="h-4 w-4 mr-2" />
  Delete
</Button>
```

---

## 2. Card Component

**Location**: `src/components/ui/Card.jsx`

### Basic Usage
```jsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### With Stats
```jsx
<Card className="hover:shadow-lg transition-shadow">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Total Users</p>
        <p className="text-3xl font-bold">1,234</p>
      </div>
      <Users className="h-8 w-8 text-primary" />
    </div>
  </CardContent>
</Card>
```

---

## 3. Badge Component

**Location**: `src/components/ui/Badge.jsx`

### Color Variants
```jsx
<Badge variant="default">Default</Badge>
<Badge variant="blue">Inquiry</Badge>
<Badge variant="red">Complaint</Badge>
<Badge variant="green">Success</Badge>
<Badge variant="yellow">Warning</Badge>
<Badge variant="orange">Attention</Badge>
<Badge variant="purple">Premium</Badge>
<Badge variant="gray">Other</Badge>
<Badge variant="outline">Outline</Badge>
```

### Interactive Badge
```jsx
<Badge 
  variant="blue" 
  className="cursor-pointer hover:scale-110 transition-transform"
  onClick={() => handleClick()}
>
  5 Items
</Badge>
```

---

## 4. Input Component

**Location**: `src/components/ui/Input.jsx`

### Basic Input
```jsx
<Input 
  type="text" 
  placeholder="Enter text" 
/>
```

### With Label
```jsx
<div>
  <label className="block text-sm font-medium mb-2">
    Email Address
  </label>
  <Input 
    type="email" 
    placeholder="user@example.com" 
  />
</div>
```

### With Icon
```jsx
<div className="relative">
  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
  <Input 
    placeholder="Search..." 
    className="pl-10" 
  />
</div>
```

### Password Input
```jsx
<Input 
  type="password" 
  placeholder="Enter password" 
/>
```

---

## 5. Modal Component

**Location**: `src/components/ui/Modal.jsx`

### Full Modal Example
```jsx
const [isOpen, setIsOpen] = useState(false);

<Modal open={isOpen} onClose={() => setIsOpen(false)}>
  <ModalClose onClose={() => setIsOpen(false)} />
  
  <ModalHeader>
    <ModalTitle>Modal Title</ModalTitle>
    <ModalDescription>
      Optional description text
    </ModalDescription>
  </ModalHeader>
  
  <ModalContent>
    <p>Your modal content here</p>
  </ModalContent>
  
  <ModalFooter>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button onClick={handleSubmit}>
      Confirm
    </Button>
  </ModalFooter>
</Modal>
```

### Large Modal
```jsx
<Modal 
  open={isOpen} 
  onClose={() => setIsOpen(false)}
  className="max-w-4xl"
>
  {/* Content */}
</Modal>
```

---

## 6. Table Component

**Location**: `src/components/ui/Table.jsx`

### Complete Table
```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
        <TableCell>
          <Badge variant="green">Active</Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### With Sticky Header
```jsx
<div className="max-h-[500px] overflow-auto">
  <Table>
    <TableHeader className="sticky top-0 bg-background">
      {/* Headers */}
    </TableHeader>
    <TableBody>
      {/* Rows */}
    </TableBody>
  </Table>
</div>
```

---

## 7. Select Component

**Location**: `src/components/ui/Select.jsx`

### Basic Select
```jsx
<Select>
  <option>Option 1</option>
  <option>Option 2</option>
  <option>Option 3</option>
</Select>
```

### With Label
```jsx
<div>
  <label className="block text-sm font-medium mb-2">
    Choose Option
  </label>
  <Select value={value} onChange={(e) => setValue(e.target.value)}>
    <option value="1">First</option>
    <option value="2">Second</option>
    <option value="3">Third</option>
  </Select>
</div>
```

---

## 8. Avatar Component

**Location**: `src/components/ui/Avatar.jsx`

### With Fallback
```jsx
<Avatar>
  <AvatarFallback className="bg-primary text-primary-foreground">
    JD
  </AvatarFallback>
</Avatar>
```

### With Image
```jsx
<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Different Sizes
```jsx
<Avatar className="h-8 w-8">
  <AvatarFallback>SM</AvatarFallback>
</Avatar>

<Avatar className="h-16 w-16">
  <AvatarFallback>LG</AvatarFallback>
</Avatar>
```

---

## 9. FilterSection Component

**Location**: `src/components/common/FilterSection.jsx`

### Usage
```jsx
<FilterSection
  onApplyFilters={(filters) => {
    console.log('Filters:', filters);
    // Apply filters to your data
  }}
  onReset={(filters) => {
    console.log('Reset:', filters);
    // Reset to default filters
  }}
  onExport={() => {
    console.log('Export data');
    // Export functionality
  }}
/>
```

### Features
- Customer search input
- Business type segmented control (All/Domestic/Export)
- Time period dropdown
- Custom date range picker
- Apply, Reset, and Export buttons

---

## 10. Sidebar Component

**Location**: `src/components/layout/Sidebar.jsx`

### Usage
```jsx
<Sidebar 
  user={{
    name: "John Doe",
    email: "john@company.com",
    role: "Admin"
  }}
/>
```

### Features
- Logo and branding
- User profile with dropdown
- Navigation menu with icons
- Active state highlighting
- Badge support for notifications
- Settings link
- Footer

---

## Layout Components

### DashboardLayout

**Location**: `src/components/layout/DashboardLayout.jsx`

```jsx
// In App.jsx
<Route element={<DashboardLayout />}>
  <Route path="/dashboard" element={<Home />} />
  <Route path="/response" element={<ResponseDashboard />} />
  {/* More routes */}
</Route>
```

Provides:
- Fixed sidebar (280px)
- Main content area with padding
- Responsive layout

---

## Utility Functions

### cn() - Class Name Merger

**Location**: `src/lib/utils.js`

```jsx
import { cn } from "../lib/utils";

// Merge classes with Tailwind
<div className={cn(
  "base-class",
  isActive && "active-class",
  "hover:bg-gray-100"
)}>
  Content
</div>
```

---

## Color System

### Tailwind Custom Colors

```jsx
// Primary (Blue)
className="bg-primary text-primary-foreground"

// Secondary (Purple)
className="bg-secondary text-secondary-foreground"

// Destructive (Red)
className="bg-destructive text-destructive-foreground"

// Muted (Gray)
className="bg-muted text-muted-foreground"

// Accent
className="bg-accent text-accent-foreground"
```

---

## Animation Classes

```jsx
// Fade in
className="animate-fade-in"

// Scale up
className="animate-scale-up"

// Custom transitions
className="transition-all duration-300"
className="hover:scale-105 transition-transform"
```

---

## Responsive Utilities

```jsx
// Grid responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"

// Flex responsive
className="flex flex-col lg:flex-row gap-4"

// Hide/Show
className="hidden md:block"
className="block md:hidden"
```

---

## Best Practices

### 1. Component Composition
```jsx
// Good ✅
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Avoid ❌
<div className="card">
  <div className="card-header">Title</div>
  <div className="card-content">Content</div>
</div>
```

### 2. Consistent Spacing
```jsx
// Use Tailwind spacing scale
<div className="space-y-4">  {/* 16px gap */}
<div className="space-y-6">  {/* 24px gap */}
<div className="gap-2">      {/* 8px gap */}
```

### 3. Color Variants
```jsx
// Use semantic variants
<Badge variant="red">Error</Badge>
<Badge variant="green">Success</Badge>
<Badge variant="yellow">Warning</Badge>
```

### 4. Accessibility
```jsx
// Always include labels
<label htmlFor="email">Email</label>
<Input id="email" type="email" />

// Use semantic HTML
<button> instead of <div onClick>
<nav> for navigation
<main> for main content
```

---

## Quick Reference

| Component | Primary Use | Key Props |
|-----------|-------------|-----------|
| Button | Actions | variant, size, disabled |
| Card | Content containers | className |
| Badge | Status indicators | variant |
| Input | Form fields | type, placeholder, value |
| Modal | Dialogs | open, onClose |
| Table | Data display | - |
| Select | Dropdowns | value, onChange |
| Avatar | User images | - |

---

**All components are fully customizable with Tailwind classes!**
