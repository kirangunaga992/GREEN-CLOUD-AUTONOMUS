import { FiX, FiActivity, FiZap, FiCloud, FiDollarSign } from "react-icons/fi";

export default function UserModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-panel border border-borderSubtle w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-borderSubtle flex justify-between items-center bg-[#171C23]">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${user.is_online ? "bg-greenAccent animate-pulse" : "bg-gray-600"}`}></div>
            <div>
              <h2 className="text-lg font-bold text-white">{user.name}</h2>
              <p className="text-xs text-gray-400">ID: {user.user_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-redAccent"><FiX size={24} /></button>
        </div>

        {/* Stats */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-bgPrimary p-4 rounded border border-borderSubtle text-center">
            <FiActivity className="text-blueAccent text-2xl mx-auto mb-2" />
            <p className="text-xs text-gray-400 uppercase">Requests</p>
            <p className="text-xl font-bold text-white">{user.total_requests}</p>
          </div>
          <div className="bg-bgPrimary p-4 rounded border border-borderSubtle text-center">
            <FiZap className="text-yellowAccent text-2xl mx-auto mb-2" />
            <p className="text-xs text-gray-400 uppercase">Energy</p>
            <p className="text-xl font-bold text-white">{user.total_energy_kwh?.toFixed(4)} kWh</p>
          </div>
          <div className="bg-bgPrimary p-4 rounded border border-borderSubtle text-center">
            <FiCloud className="text-greenAccent text-2xl mx-auto mb-2" />
            <p className="text-xs text-gray-400 uppercase">Carbon</p>
            <p className="text-xl font-bold text-white">{user.total_carbon_kg?.toFixed(5)} kg</p>
          </div>
          <div className="bg-bgPrimary p-4 rounded border border-borderSubtle text-center">
            <FiDollarSign className="text-green-400 text-2xl mx-auto mb-2" />
            <p className="text-xs text-gray-400 uppercase">Cost</p>
            <p className="text-xl font-bold text-white">₹{user.total_cost_inr?.toFixed(3)}</p>
          </div>
        </div>

        {/* Details List */}
        <div className="px-6 pb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 border-b border-borderSubtle pb-2">Feature Usage</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-400 font-mono">
             {Object.entries(user.features_used || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between bg-bgPrimary p-2 rounded">
                  <span>{key}:</span> <span className="text-white font-bold">{val}</span>
                </div>
             ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">Data fetched live from MongoDB via FastAPI.</p>
        </div>

      </div>
    </div>
  );
}
