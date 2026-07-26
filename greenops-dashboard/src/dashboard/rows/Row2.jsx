import AutoScalingEvents from "../panels/AutoScalingEvents";
import ScalingHeatmap from "../panels/ScalingHeatmap";
import ScalingFeed from "../panels/ScalingFeed";

export default function Row2() {
  return (
    <div>
      <h2 className="text-xs text-gray-400 uppercase mb-2 tracking-widest">Auto-Scaling & Emission Mitigation</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AutoScalingEvents />
        <ScalingHeatmap />
        <ScalingFeed />
      </div>
    </div>
  );
}
