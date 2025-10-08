import React, { useState } from "react";
import { User, Lock, Bell, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Select } from "../components/ui/Select";

const ProfileSettings = () => {
  const [formData, setFormData] = useState({
    fullName: "John Doe",
    email: "john.doe@company.com",
    role: "Admin",
    department: "Sales",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    inAppNotifications: true,
    language: "English",
  });

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSaveProfile = () => {
    console.log("Saving profile:", formData);
    // Add save logic here
  };

  const handleChangePassword = () => {
    console.log("Changing password");
    // Add password change logic here
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Personal Information</CardTitle>
          </div>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <Input
                value={formData.email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <div className="flex items-center h-10">
                <Badge variant="default">{formData.role}</Badge>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <Select
                value={formData.department}
                onChange={(e) => handleInputChange("department", e.target.value)}
              >
                <option>Sales</option>
                <option>Support</option>
                <option>Marketing</option>
                <option>Operations</option>
              </Select>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Password</label>
            <Input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => handleInputChange("currentPassword", e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <Input
                type="password"
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                placeholder="Enter new password"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 8 characters with complexity
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleChangePassword}>Update Password</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <input
                type="checkbox"
                checked={formData.emailNotifications}
                onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">In-App Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications in the dashboard</p>
              </div>
              <input
                type="checkbox"
                checked={formData.inAppNotifications}
                onChange={(e) => handleInputChange("inAppNotifications", e.target.checked)}
                className="w-5 h-5"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button>Save Preferences</Button>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Display Settings</CardTitle>
          </div>
          <CardDescription>Customize your dashboard experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <p className="text-sm text-muted-foreground">
              Use the theme toggle in the sidebar to switch between light and dark modes
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <Select
              value={formData.language}
              onChange={(e) => handleInputChange("language", e.target.value)}
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </Select>
          </div>

          <div className="pt-4">
            <Button>Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
