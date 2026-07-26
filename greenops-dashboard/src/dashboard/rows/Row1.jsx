import UserPresence from "../panels/UserPresence";
import ActiveUsers from "../panels/ActiveUsers";
import CarbonGauge from "../panels/CarbonGauge";

export default function Row1({ onUserClick }) {
  return (
    <div>
      <h2 className="text-xs text-gray-400 uppercase mb-2 tracking-widest">Active Traffic & Sessions</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[320px]">
        <ActiveUsers onUserClick={onUserClick} />
        <UserPresence />
        <CarbonGauge />
      </div>
    </div>
  );
}
