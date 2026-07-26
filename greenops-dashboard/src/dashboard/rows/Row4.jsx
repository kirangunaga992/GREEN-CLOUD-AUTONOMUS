import LogsPanel from "../panels/LogsPanel";
import RoadmapPanel from "../panels/RoadmapPanel";
export default function Row4() {
  return (
    <div>
      <h2 className="text-xs text-gray-400 uppercase mb-2 tracking-widest">Project Logs & Notes</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LogsPanel /><RoadmapPanel />
      </div>
    </div>
  );
}
