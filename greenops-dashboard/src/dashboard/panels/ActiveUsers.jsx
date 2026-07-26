import { useDashboardData } from "../hooks/useBackend";
import { useNavigate } from "react-router-dom";

export default function ActiveUsers({ onUserClick }) {
  const { users } = useDashboardData();
  const navigate = useNavigate();
  const list = Array.isArray(users) ? users : [];
  const online = list.filter(u => u?.is_online);
  const offline = list.filter(u => !u?.is_online);
  const sorted = [...online, ...offline];

  const handleClick = (user) => {
    // Navigate to user detail page
    navigate(`/user/${user.user_id}`);
    if (onUserClick) onUserClick(user);
  };

  return (
    <div className="panel flex flex-col" style={{ height: "320px" }}>
      <div className="panel-title flex justify-between items-center">
        <span>Real-Time User Sessions</span>
        <span className="text-greenAccent text-xs bg-greenAccent/10 px-2 py-0.5 rounded">
          {online.length} / {list.length} Online
        </span>
      </div>

      <div className="overflow-y-auto flex-1 pr-2 space-y-2 custom-scroll">
        {sorted.length === 0 ? (
          <p className="text-gray-500 text-xs">No users found.</p>
        ) : (
          sorted.map((u, i) => (
            <div
              key={u.user_id || i}
              onClick={() => handleClick(u)}
              className={"p-3 border rounded-md cursor-pointer transition-all flex justify-between items-center " +
                (u.is_online
                  ? "border-borderSubtle bg-[#171C23] hover:border-blueAccent hover:shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                  : "border-borderSubtle/40 bg-[#0F1319] hover:border-gray-600 opacity-60 hover:opacity-100")}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={"w-2 h-2 rounded-full shrink-0 " +
                  (u.is_online ? "bg-greenAccent shadow-[0_0_8px_#22C55E] animate-pulse" : "bg-gray-600")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-200 truncate">{u.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-xs text-yellowAccent font-mono">{u.total_requests || 0} reqs</p>
                <p className="text-[10px] text-gray-400">
                  {(u.total_carbon_kg || 0).toFixed(5)} kg
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[10px] text-gray-500 text-center mt-2 italic">
        Click any user for detailed analytics
      </p>
    </div>
  );
}
