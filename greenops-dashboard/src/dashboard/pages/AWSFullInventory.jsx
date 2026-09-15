import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { FiServer, FiDatabase, FiHardDrive, FiCloud, FiBox, FiZap, FiRefreshCw, FiDollarSign, FiLayers } from "react-icons/fi";

const API = "http://localhost:8000/api/cloud";

export default function AWSFullInventory() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const token = localStorage.getItem("greenops_token");

  const loadInventory = async () => {
    try {
      const r = await fetch(`${API}/aws-full-inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (d.success) setInventory(d);
      setLoading(false);
    } catch (e) { 
      console.error(e); 
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
    const interval = setInterval(loadInventory, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <p className="text-center text-gray-500 py-20">Loading full inventory...</p>
      </div>
    </div>
  );

  if (!inventory || !inventory.totals) return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-8 text-center">
          <FiCloud className="text-gray-600 text-5xl mx-auto mb-3" />
          <p className="text-gray-400 mb-4">No AWS accounts connected</p>
          <button onClick={() => navigate("/cloud")} className="px-6 py-2 bg-greenAccent text-black rounded font-bold">
            Connect AWS Account
          </button>
        </div>
      </div>
    </div>
  );

  const totals = inventory.totals;
  const data = inventory.inventory;

  const tabs = [
    { id: "overview", label: "Overview", icon: FiLayers },
    { id: "ec2", label: `EC2 (${totals.ec2_count})`, icon: FiServer },
    { id: "s3", label: `S3 (${totals.s3_count})`, icon: FiCloud },
    { id: "rds", label: `RDS (${totals.rds_count})`, icon: FiDatabase },
    { id: "lambda", label: `Lambda (${totals.lambda_count})`, icon: FiZap },
    { id: "ebs", label: `EBS (${totals.ebs_count})`, icon: FiHardDrive },
    { id: "elb", label: `Load Bal (${totals.load_balancer_count})`, icon: FiBox },
    { id: "dynamo", label: `DynamoDB (${totals.dynamodb_count})`, icon: FiDatabase },
  ];

  return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Header />
        <div className="px-6 py-4 space-y-6">

          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <FiLayers className="text-blueAccent" />
                Complete AWS Inventory
              </h1>
              <p className="text-sm text-gray-400 mt-1">All AWS resources across your connected accounts</p>
            </div>
            <button
              onClick={loadInventory}
              className="px-4 py-2 rounded bg-blueAccent text-white font-semibold text-sm hover:bg-blue-600 flex items-center gap-2"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>

          {/* Total Cost Banner */}
          <div className="p-6 bg-gradient-to-br from-yellowAccent/10 to-redAccent/10 border border-yellowAccent/40 rounded-lg">
            <div className="flex items-center gap-4">
              <FiDollarSign className="text-yellowAccent text-5xl" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Estimated Monthly Cost</p>
                <p className="text-4xl font-bold text-white">${totals.total_monthly_cost}</p>
                <p className="text-xs text-gray-400 mt-1">Across all AWS services</p>
              </div>
            </div>
          </div>

          {/* Service Cards Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ServiceCard icon={<FiServer />} label="EC2 Instances" count={totals.ec2_running} total={totals.ec2_count} color="greenAccent" onClick={() => setActiveTab("ec2")} />
            <ServiceCard icon={<FiCloud />} label="S3 Buckets" count={totals.s3_count} sub={`${totals.s3_total_gb} GB`} color="blueAccent" onClick={() => setActiveTab("s3")} />
            <ServiceCard icon={<FiDatabase />} label="RDS Databases" count={totals.rds_count} color="purple-500" onClick={() => setActiveTab("rds")} />
            <ServiceCard icon={<FiZap />} label="Lambda Functions" count={totals.lambda_count} color="yellowAccent" onClick={() => setActiveTab("lambda")} />
            <ServiceCard icon={<FiHardDrive />} label="EBS Volumes" count={totals.ebs_count} sub={`${totals.ebs_total_gb} GB`} color="cyan-500" onClick={() => setActiveTab("ebs")} />
            <ServiceCard icon={<FiBox />} label="Load Balancers" count={totals.load_balancer_count} color="redAccent" onClick={() => setActiveTab("elb")} />
            <ServiceCard icon={<FiDatabase />} label="DynamoDB Tables" count={totals.dynamodb_count} color="pink-500" onClick={() => setActiveTab("dynamo")} />
          </div>

          {/* Tabs */}
          <div className="panel">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 border-b border-borderSubtle">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={"px-4 py-2 rounded text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 " +
                    (activeTab === tab.id 
                      ? "bg-blueAccent text-white" 
                      : "bg-bgPrimary text-gray-400 hover:text-white")}
                >
                  <tab.icon /> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">Click any service card above or tab to see details</p>
                <div className="p-4 bg-bgPrimary rounded border border-borderSubtle">
                  <p className="text-sm text-white font-semibold mb-2">📊 Cost Breakdown:</p>
                  <div className="space-y-1 text-xs text-gray-300">
                    <p>EC2 Instances: ~${Math.round(data.ec2_instances.reduce((s, i) => s + (i.cost_per_hour || 0) * 24 * 30, 0))}/mo</p>
                    <p>S3 Storage: ~${data.s3_buckets.reduce((s, b) => s + b.monthly_cost, 0).toFixed(2)}/mo</p>
                    <p>RDS Databases: ~${data.rds_databases.reduce((s, r) => s + r.monthly_cost, 0).toFixed(2)}/mo</p>
                    <p>EBS Volumes: ~${data.ebs_volumes.reduce((s, v) => s + v.monthly_cost, 0).toFixed(2)}/mo</p>
                    <p>Load Balancers: ~${data.load_balancers.reduce((s, l) => s + l.monthly_cost, 0).toFixed(2)}/mo</p>
                    <p>DynamoDB: ~${data.dynamodb_tables.reduce((s, t) => s + t.monthly_cost, 0).toFixed(2)}/mo</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ec2" && <ResourceTable data={data.ec2_instances} columns={["name", "type", "state", "region", "cost_per_hour"]} costPrefix="$" />}
            {activeTab === "s3" && <ResourceTable data={data.s3_buckets} columns={["name", "created", "size_gb", "monthly_cost"]} costPrefix="$" />}
            {activeTab === "rds" && <ResourceTable data={data.rds_databases} columns={["identifier", "engine", "class", "status", "monthly_cost"]} costPrefix="$" />}
            {activeTab === "lambda" && <ResourceTable data={data.lambda_functions} columns={["name", "runtime", "memory_mb", "timeout_sec"]} />}
            {activeTab === "ebs" && <ResourceTable data={data.ebs_volumes} columns={["id", "size_gb", "type", "state", "monthly_cost"]} costPrefix="$" />}
            {activeTab === "elb" && <ResourceTable data={data.load_balancers} columns={["name", "type", "state", "scheme", "monthly_cost"]} costPrefix="$" />}
            {activeTab === "dynamo" && <ResourceTable data={data.dynamodb_tables} columns={["name", "status", "size_gb", "item_count", "monthly_cost"]} costPrefix="$" />}
          </div>

          <div className="p-3 rounded bg-greenAccent/10 border border-greenAccent/30 text-xs text-gray-300">
            <strong className="text-greenAccent">🌱 GreenOps Value:</strong> By monitoring all these AWS services, we can identify:
            unused resources, over-provisioned instances, forgotten S3 buckets, and optimize costs by up to 60%.
          </div>

        </div>
      </div>
    </div>
  );
}

function ServiceCard({ icon, label, count, total, sub, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="kpi-card text-left hover:border-blueAccent transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={"text-3xl text-" + color}>{icon}</div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase">{label}</p>
          <p className="text-2xl font-bold text-white">
            {count}{total && total !== count ? `/${total}` : ""}
          </p>
          {sub && <p className="text-[10px] text-gray-500">{sub}</p>}
        </div>
      </div>
    </button>
  );
}

function ResourceTable({ data, columns, costPrefix = "" }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">No resources found</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] text-gray-400 uppercase border-b border-borderSubtle">
            {columns.map((col) => (
              <th key={col} className="p-2">{col.replace(/_/g, " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-borderSubtle hover:bg-panel">
              {columns.map((col) => (
                <td key={col} className="p-2 text-gray-300">
                  {col.includes("cost") && costPrefix}{row[col] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
