import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import KPIBar from "./KPIBar";
import Row1 from "./rows/Row1";
import Row2 from "./rows/Row2";
import Row3 from "./rows/Row3";
import Row4 from "./rows/Row4";
import UserModal from "./panels/UserModal";
import ToastManager from "./components/ToastManager";

export default function Dashboard() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="flex min-h-screen bg-bgPrimary relative">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Header />
        <div className="px-6 py-4 space-y-6">
          <KPIBar />
          <Row1 onUserClick={(user) => setSelectedUser(user)} />
          <Row2 />
          <Row3 />
          <Row4 />
        </div>
      </div>
      <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      <ToastManager />
    </div>
  );
}
