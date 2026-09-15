import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiCloud } from "react-icons/fi";

export default function ActiveUsers() {
  const [users, setUsers] = useState([]);
  const [cloudAccounts, setCloudAccounts] = useState([]);
  const [filter, setFilter] = useState("web"); // "web" or "aws"
  const navigate = useNavigate();
  const token = localStorage.getItem("greenops_token");

  const loadData = async () => {
    try {
      // Load web users
      const r1 = await fetch("http://localhost:8000/api/users/all");
      const d1 = await r1.json();
      if (d1.users) setUsers(d1.users);
      
      // Load AWS accounts (only for logged in user)
      if (token) {
        const r2 = await fetch("http://localhost:8000/api/cloud/accounts", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d2 = await r2.json();
        if (d2.success) setCloudAccounts(d2.accounts || []);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Every 10 sec
    return () => clearInterval(interval);
  }, []);

  const onlineCount = users.filter(u => u.is_online).length;
  const totalCount = users.length;
  const awsCount = cloudAccounts.length;

  return (
    <div className="panel flex flex-col" style={{ height: "340px" }}>
      {/* Header with tabs */}
      <div className="panel-title flex justify-between items-center">
        <span>User Sessions</span>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setFilter("web")}
            className={"px-2 py-1 rounded flex items-center gap-1 " +
              (filter === "web" ? "bg-blueAccent text-white" : "bg-panel text-gray-400")}
          >
            <FiUser /> Web ({onlineCount}/{totalCount})
          </button>
          <button
            onClick={() => setFilter("aws")}
            className={"px-2 py-1 rounded flex items-center gap-1 " +
              (filter === "aws" ? "bg-yellowAccent text-black" : "bg-panel text-gray-400")}
          >
            <FiCloud /> AWS ({awsCount})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-2 custom-scroll" style={{ minHeight: "0" }}>
        {filter === "web" ? (
          // WEB USERS
          users.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No users yet</p>
          ) : (
            users.map((user) => (
              <div
                key={user.user_id}
                onClick={() => navigate(`/user/${user.user_id}`)}
                className="p-3 bg-bgPrimary rounded border border-borderSubtle hover:border-blueAccent cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={"w-2 h-2 rounded-full " + 
                      (user.is_online ? "bg-greenAccent animate-pulse" : "bg-gray-600")} />
                    <div>
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-[10px] text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white">{user.total_requests || 0} reqs</p>
                    <p className="text-[10px] text-gray-400">
                      {(user.total_carbon_kg || 0).toFixed(5)} kg
                    </p>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          // AWS ACCOUNTS
          cloudAccounts.length === 0 ? (
            <div className="text-center py-4">
              <FiCloud className="text-gray-600 text-3xl mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No AWS accounts connected</p>
              <button
                onClick={() => navigate("/cloud")}
                className="mt-2 px-3 py-1 bg-yellowAccent text-black rounded text-xs font-semibold"
              >
                Connect AWS
              </button>
            </div>
          ) : (
            cloudAccounts.map((acc, i) => (
              <div
                key={i}
                onClick={() => navigate(`/cloud/account/${encodeURIComponent(acc.role_arn)}`)}
                className="p-3 bg-bgPrimary rounded border border-yellowAccent/30 hover:border-yellowAccent cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellowAccent animate-pulse" />
                    <div>
                      <p className="text-sm font-semibold text-white flex items-center gap-1">
                        <FiCloud className="text-yellowAccent" />
                        {acc.account_name}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate max-w-xs">
                        {acc.region} • AWS
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-yellowAccent font-bold uppercase">Active</p>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      <p className="text-[10px] text-gray-500 text-center mt-2 pt-2 border-t border-borderSubtle">
        {filter === "web" ? "Click user for detailed analytics" : "Click AWS account for details"}
      </p>
    </div>
  );
}
