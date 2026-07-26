import ServerRack from "../panels/ServerRack";
import BeforeAfter from "../panels/BeforeAfter";

export default function RowInfra() {
  return (
    <div className="space-y-4">
      <h2 className="text-xs text-gray-400 uppercase mb-2 tracking-widest">🖥️ Infrastructure Live View</h2>
      <ServerRack />
      <BeforeAfter />
    </div>
  );
}
