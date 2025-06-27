import {useAppStore} from "../../store/index.js";
import Sidebar from "../../components/sidebar.jsx";
import MainFrame from "../../components/mainframe.jsx";
const Homepage = () => {
  const {userInfo,currentGroup} = useAppStore();
  console.log(userInfo);
  console.log(currentGroup)
  return (
    <div>
      <div className="flex bg-[green]">
      <Sidebar></Sidebar>
      {currentGroup?<MainFrame></MainFrame>:""}
      </div>
    </div>
  )
}

export default Homepage
