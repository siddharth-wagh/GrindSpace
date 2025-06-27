import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft, Save, User } from "lucide-react";
import { GET_USER_INFO, UPDATE_PROFILE_ROUTE } from "../../utils/constants";
const HOST = "http://localhost:8000";

// You'll need to import your actual store and API client
import { useAppStore } from "@/store/index.js";
import { apiClient } from "@/lib/api-client.js";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userInfo, setUserInfo } = useAppStore();
  const [profilePic, setProfilePic] = useState("");
  const [about, setAbout] = useState("");
  const [originalImage, setOriginalImage] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await apiClient.get(GET_USER_INFO, {
          withCredentials: true,
        });
        if (response.status === 200 && response.data) {
          setUserInfo(response.data);
          setAbout(response.data.about || "");
          setOriginalImage(response.data.image || "");
          setProfilePic(
            response.data.image ? `${HOST}/${response.data.image}` : ""
          );
        } else {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        navigate("/auth");
      }
    };

    fetchUserInfo();
  }, [navigate, setUserInfo]);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const response = await apiClient.put(UPDATE_PROFILE_ROUTE, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 && response.data.image) {
        setUserInfo((prev) => ({ ...prev, image: response.data.image }));
        setProfilePic(response.data.profilePic || DEFAULT_PFP);

        setHasChanges(true);
        toast({
          title: "Success",
          description: "Image updated successfully",
        });
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
    }

    // Preview image locally
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = () => {
    setProfilePic("");
    setHasChanges(true);
    toast({
      title: "Success",
      description: "Image removed",
    });
  };

  const handleAboutChange = (e) => {
    setAbout(e.target.value);
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("about", about);

      if (!profilePic) {
        formData.append("removeImage", "true");
      }

      const response = await apiClient.put(UPDATE_PROFILE_ROUTE, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        setUserInfo((prev) => ({
          ...prev,
          about: about,
          image: profilePic ? response.data.image : "",
        }));
        setHasChanges(false);
        toast({
          title: "Success",
          description: "Image updated successfully",
        });
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/homepage")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Edit Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profilePic} alt="Profile" />
                  <AvatarFallback className="text-2xl">
                    <User className="h-16 w-16" />
                  </AvatarFallback>
                </Avatar>

                {profilePic && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 rounded-full h-8 w-8 p-0"
                    onClick={handleDeleteImage}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="relative"
                  onClick={() =>
                    document.getElementById("profile-image").click()
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {profilePic ? "Change Image" : "Add Image"}
                </Button>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* About Section */}
            <div className="space-y-2">
              <label
                htmlFor="about"
                className="text-sm font-medium text-gray-700"
              >
                About Me
              </label>
              <Textarea
                id="about"
                placeholder="Tell us about yourself..."
                value={about}
                onChange={handleAboutChange}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleSaveChanges}
                disabled={!hasChanges || isLoading}
                className="w-full max-w-xs"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
