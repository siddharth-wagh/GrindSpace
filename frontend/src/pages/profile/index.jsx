import { useState } from "react"
import { useNavigate } from "react-router-dom";
import { GET_USER_INFO, UPDATE_PROFILE_ROUTE,  } from "../../utils/constants";

const Profile = () => {
const navigate = useNavigate();
const { userInfo, setUserInfo } = useAppStore();
const[profilepic, setProfilePic] = useState();
const[about,setAbout] = useState();

  useEffect(() => {
    const fetchUserInfo = async () => {
        try {
            const response = await apiClient.get(GET_USER_INFO, { withCredentials: true });
            if (response.status === 200 && response.data) {
                setUserInfo(response.data);
                about(response.data.about || "");
                setImage(`${HOST}/${response.data.image}`); 
            } else {
                navigate("/auth"); // Redirect to auth if user info is not available
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            navigate("/auth"); // Redirect to auth on error
        }
    };

    fetchUserInfo();
}, [profilepic]);

const handleImageChange = async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const formData = new FormData();
  formData.append("profile-image", file); // Must match multer field name

  try {
    const response = await apiClient.post(UPDATE_PROFILE_ROUTE, formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.status === 200 && response.data.image) {
      // update store
      setUserInfo((prev) => ({ ...prev, image: response.data.image }));
      toast.success("Image updated successfully");
    }
  } catch (error) {
    console.error("Image upload failed:", error);
    toast.error("Failed to upload image");
  }

  // Preview image locally
  const reader = new FileReader();
  reader.onload = () => {
    setImage(reader.result); // if you're using a preview state
  };
  reader.readAsDataURL(file);
};




  return (
    <div>
      
    </div>
  )
}

export default Profile
