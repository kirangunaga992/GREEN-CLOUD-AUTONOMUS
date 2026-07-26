import Header from "../Header";
import Sidebar from "../Sidebar";
import ServerRack from "../panels/ServerRack";
import BeforeAfter from "../panels/BeforeAfter";
import LoadTest from "../panels/LoadTest";
import ServiceUsage from "../panels/ServiceUsage";
import RequestStats from "../panels/RequestStats";

export default function InfrastructurePage() {
  return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Header />
        <div className="px-6 py-4 space-y-6">
          <div>
            <h2 className="text-xs text-gray-400 uppercase mb-2 tracking-widest">
              Live Service Consumption
            </h2>
            <ServiceUsage />
          </div>
          <div>
            <h2 className="text-xs text-gray-400 uppercase mb-2 tracking-widest">
              Request Success & Failure Tracking
            </h2>
            <RequestStats />
          </div>
          <div>
            <h2 className="text-xs text-gray-400 uppercase mb-2 tracking-widest">
              Live Load Simulator
            </h2>
            <LoadTest />
          </div>
          <div>
            <h2 className="text-xs text-gray-400 uppercase mb-2 tracking-widest">
              Infrastructure Live View
            </h2>
            <ServerRack />
          </div>
          <div>
            <h2 className="text-xs text-gray-400 uppercase mb-2 tracking-widest">
              Cost & Carbon Comparison
            </h2>
            <BeforeAfter />
          </div>
        </div>
      </div>
    </div>
  );
}
