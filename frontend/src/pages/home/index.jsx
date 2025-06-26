import {useAppStore} from "../../store/index.js";
import Sidebar from "../../components/sidebar.jsx";
import MainFrame from "../../components/mainframe.jsx";
const Homepage = () => {
  const {userInfo} = useAppStore();
  
  return (
    <div>
      <div className="flex bg-[green]">
      <Sidebar></Sidebar>
      <MainFrame></MainFrame>
      </div>
    </div>
  )
}

export default Homepage
