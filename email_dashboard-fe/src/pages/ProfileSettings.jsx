import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { User, Lock, Bell, Globe, Save, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Select } from "../components/ui/Select";
import { ProfileSkeleton } from "../components/ui/Skeleton";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { authApi, userApi } from "../api/index";
import { useNavigate } from "react-router-dom";

const ProfileSettings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser, refreshProfile } = useAuth();
  const [viewingUserId, setViewingUserId] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "",
    department: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    inAppNotifications: true,
    language: "English",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Check if viewing another user's profile (from Settings page)
  useEffect(() => {
    if (location.state?.userId) {
      setViewingUserId(location.state.userId);
      fetchUserById(location.state.userId);
    } else {
      setViewingUserId(null);
    }
  }, [location.state]);

  // Fetch current user's data
  useEffect(() =>{
    if (!viewingUserId && currentUser) {
      setFormData({
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        role: currentUser.role || "",
        department: currentUser.department || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        emailNotifications: true,
        inAppNotifications: true,
        language: "English",
      });
    }
  }, [currentUser, viewingUserId]);

  const fetchUserById = async (userId) => {
    setIsLoadingUser(true);
    setErrorMessage("");
    try {
      const result = await userApi.getUserById(userId);
      if (result.success) {
        setFormData({
          fullName: result.user.fullName || "",
          email: result.user.email || "",
          role: result.user.role || "",
          department: result.user.department || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          emailNotifications: true,
          inAppNotifications: true,
          language: "English",
        });
      } else {
        setErrorMessage(result.message || "Failed to fetch user data");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to fetch user data");
    } finally {
      setIsLoadingUser(false);
    }
  };

  const isViewingOtherUser = viewingUserId && viewingUserId !== currentUser?.id;
  const isOwnProfile = !viewingUserId || viewingUserId === currentUser?.id;

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updateData = {
        fullName: formData.fullName,
        department: formData.department,
      };

      const result = await authApi.updateProfile(updateData);

      if (result.success) {
        setSuccessMessage("Profile updated successfully!");
        setIsEditing(false);
        // Refresh the user profile in context
        await refreshProfile();
      } else {
        setErrorMessage(result.message || "Failed to update profile");
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setIsChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    // Validate passwords
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setPasswordError("All password fields are required");
      setIsChangingPassword(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      setIsChangingPassword(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordError("New passwords do not match");
      setIsChangingPassword(false);
      return;
    }

    try {
      const result = await authApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (result.success) {
        setPasswordSuccess("Password changed successfully!");
        // Clear password fields
        setFormData({
          ...formData,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPasswordError(result.message || "Failed to change password");
      }
    } catch (error) {
      setPasswordError(error.message || "Failed to change password. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isAdmin = ["admin","super admin"].includes(currentUser?.role);

  if (isLoadingUser) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isViewingOtherUser && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate("/settings")}
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
            <h1 className="text-xl sm:text-2xl font-semibold">
              {isViewingOtherUser ? "User Profile" : "Profile Settings"}
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {isViewingOtherUser
              ? "View user information"
              : "Manage your personal information and preferences"}
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
            </div>
            {isAdmin && !isEditing && isOwnProfile && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Full Name</label>
              <Input
                value={formData.fullName}
                disabled={!isEditing}
                className={cn("text-sm sm:text-base", !isEditing && "bg-muted cursor-not-allowed")}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Email Address</label>
              <Input
                value={formData.email}
                disabled
                className="bg-muted cursor-not-allowed text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Role</label>
              <div className="flex items-center h-10">
                <Badge variant="default" className="text-xs sm:text-sm">{formData.role}</Badge>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Department</label>
              <Input
                value={formData.department}
                disabled={!isEditing}
                className={cn("text-sm sm:text-base", !isEditing && "bg-muted cursor-not-allowed")}
                onChange={(e) => handleInputChange("department", e.target.value)}
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full sm:w-auto text-sm">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto text-sm"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    ...formData,
                    fullName: currentUser?.fullName || "",
                    department: currentUser?.department || "",
                  });
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password - Only show for own profile */}
      {isOwnProfile && (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-base sm:text-lg">Change Password</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          {passwordSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
              {passwordError}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Current Password</label>
            <Input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => handleInputChange("currentPassword", e.target.value)}
              placeholder="Enter current password"
              className="text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">New Password</label>
              <Input
                type="password"
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                placeholder="Enter new password"
                className="text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 8 characters with complexity
              </p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Confirm New Password</label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirm new password"
                className="text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleChangePassword} disabled={isChangingPassword} className="w-full sm:w-auto text-sm">
              {isChangingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Notification Preferences
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
      </Card> */}

    </div>
  );
};

export default ProfileSettings;
