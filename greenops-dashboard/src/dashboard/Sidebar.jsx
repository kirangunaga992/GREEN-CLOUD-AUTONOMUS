import { FiHome, FiSearch, FiServer, FiBell, FiSettings, FiShield, FiUser, FiHelpCircle } from "react-icons/fi";
import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  "text-lg cursor-pointer transition-colors " +
  (isActive ? "text-greenAccent" : "text-gray-400 hover:text-white");

export default function Sidebar() {
  return (
    <div className="w-14 bg-panel border-r border-borderSubtle flex flex-col items-center py-4 space-y-6">
      <div className="text-greenAccent text-2xl font-bold">🌿</div>
      <NavLink to="/" className={linkClass} title="Overview"><FiHome /></NavLink>
      <NavLink to="/infrastructure" className={linkClass} title="Infrastructure"><FiServer /></NavLink>
      <FiSearch className="text-gray-400 hover:text-white cursor-pointer text-lg" />
      <FiBell className="text-gray-400 hover:text-white cursor-pointer text-lg" />
      <FiSettings className="text-gray-400 hover:text-white cursor-pointer text-lg" />
      <FiShield className="text-gray-400 hover:text-white cursor-pointer text-lg" />
      <div className="flex-1"></div>
      <FiUser className="text-gray-400 text-lg" />
      <FiHelpCircle className="text-gray-400 text-lg" />
    </div>
  );
}
