import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./dashboard/Dashboard";
import InfrastructurePage from "./dashboard/pages/InfrastructurePage";
import UserDetailPage from "./dashboard/pages/UserDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/infrastructure" element={<InfrastructurePage />} />
        <Route path="/user/:userId" element={<UserDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
