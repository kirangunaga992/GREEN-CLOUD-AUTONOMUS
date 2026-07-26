import EfficiencyByComponent from "../panels/EfficiencyByComponent";
import RiskMatrix from "../panels/RiskMatrix";
import RenewableDonut from "../panels/RenewableDonut";
export default function Row3() {
  return (
    <div>
      <h2 className="text-xs text-gray-400 uppercase mb-2 tracking-widest">Technical & Risk Assessment</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <EfficiencyByComponent /><RiskMatrix /><RenewableDonut />
      </div>
    </div>
  );
}
