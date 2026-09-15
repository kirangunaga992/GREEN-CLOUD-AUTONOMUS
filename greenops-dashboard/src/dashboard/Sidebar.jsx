import { FiHome, FiSearch, FiServer, FiCloud, FiLayers, FiZap, FiDownload, FiBell, FiSettings, FiShield, FiUser, FiHelpCircle, FiLogOut } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

const linkClass = ({ isActive }) =>
  "text-lg cursor-pointer transition-colors " +
  (isActive ? "text-greenAccent" : "text-gray-400 hover:text-white");

export default function Sidebar() {
  const { user, logout } = useAuth();
  
  const initials = user?.name ? user.name[0].toUpperCase() : "?";
  
  return (
    <div className="w-14 bg-panel border-r border-borderSubtle flex flex-col items-center py-4 space-y-6">
      <div className="text-greenAccent text-2xl font-bold" title="GreenOps">🌿</div>
      <NavLink to="/" className={linkClass} title="Overview"><FiHome /></NavLink>
      <NavLink to="/infrastructure" className={linkClass} title="Infrastructure"><FiServer /></NavLink>
      <NavLink to="/cloud" className={linkClass} title="Cloud Providers"><FiCloud /></NavLink>
      <NavLink to="/inventory" className={linkClass} title="Full Inventory"><FiLayers /></NavLink>
      <NavLink to="/autoscaler" className={linkClass} title="Smart Autoscaler"><FiZap /></NavLink>
      <NavLink to="/install" className={linkClass} title="Installation"><FiDownload /></NavLink>
      <FiSearch className="text-gray-400 hover:text-white cursor-pointer text-lg" title="Search" />
      <FiBell className="text-gray-400 hover:text-white cursor-pointer text-lg" title="Notifications" />
      <FiSettings className="text-gray-400 hover:text-white cursor-pointer text-lg" title="Settings" />
      <FiShield className="text-gray-400 hover:text-white cursor-pointer text-lg" title="Security" />
      
      <div className="flex-1"></div>
      
      {/* User Avatar */}
      {user && (
        <div className="w-8 h-8 rounded-full bg-greenAccent text-black flex items-center justify-center font-bold text-sm cursor-pointer" title={user.name}>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full" />
          ) : (
            initials
          )}
        </div>
      )}
      
      <FiLogOut 
        className="text-redAccent hover:text-red-400 cursor-pointer text-lg" 
        title="Logout"
        onClick={logout}
      />
      <FiHelpCircle className="text-gray-400 hover:text-white cursor-pointer text-lg" title="Help" />
    </div>
  );
}
