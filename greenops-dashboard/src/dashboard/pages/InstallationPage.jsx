import { useState } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { FiDownload, FiCopy, FiCheckCircle, FiTerminal, FiServer, FiCloud, FiBook, FiPlay, FiPackage, FiShield, FiUsers, FiZap, FiExternalLink } from "react-icons/fi";

export default function InstallationPage() {
  const [copied, setCopied] = useState("");

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const downloadInstaller = () => {
    window.open("http://localhost:8000/api/cloud/install-script", "_blank");
  };

  const installCommand = "curl -sSL http://localhost:8000/api/cloud/install-script | bash";
  const dockerCommand = "git clone https://github.com/kirangunaga992/GREEN-CLOUD-AUTONOMUS.git && cd GREEN-CLOUD-AUTONOMUS && docker compose up -d";

  return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Header />
        <div className="px-6 py-4 space-y-6">

          {/* Hero Section */}
          <div className="text-center py-8 bg-gradient-to-br from-greenAccent/10 to-blueAccent/10 border border-greenAccent/30 rounded-lg">
            <div className="text-5xl mb-3">🌿</div>
            <h1 className="text-3xl font-bold text-white mb-2">Install GreenOps in 5 Minutes</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Enterprise-grade sustainable cloud monitoring. One command to install. 100% free & open source.
            </p>
            <div className="mt-6 flex gap-3 justify-center flex-wrap">
              <button
                onClick={downloadInstaller}
                className="px-6 py-3 bg-greenAccent text-black font-bold rounded hover:bg-green-500 flex items-center gap-2"
              >
                <FiDownload /> Download install.sh
              </button>
              <a
                href="https://github.com/kirangunaga992/GREEN-CLOUD-AUTONOMUS"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-panel border border-borderSubtle text-white font-bold rounded hover:border-blueAccent flex items-center gap-2"
              >
                <FiExternalLink /> View on GitHub
              </a>
            </div>
          </div>

          {/* Requirements */}
          <div className="panel">
            <div className="panel-title">📋 System Requirements</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-4 bg-bgPrimary rounded border border-borderSubtle">
                <FiServer className="text-blueAccent text-3xl mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase mb-1">Operating System</p>
                <p className="text-sm font-semibold text-white">Linux / macOS</p>
                <p className="text-[10px] text-gray-500">Ubuntu 20.04+</p>
              </div>
              <div className="text-center p-4 bg-bgPrimary rounded border border-borderSubtle">
                <FiZap className="text-yellowAccent text-3xl mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase mb-1">RAM</p>
                <p className="text-sm font-semibold text-white">4 GB minimum</p>
                <p className="text-[10px] text-gray-500">8 GB recommended</p>
              </div>
              <div className="text-center p-4 bg-bgPrimary rounded border border-borderSubtle">
                <FiPackage className="text-greenAccent text-3xl mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase mb-1">Disk Space</p>
                <p className="text-sm font-semibold text-white">10 GB free</p>
                <p className="text-[10px] text-gray-500">For Docker images</p>
              </div>
              <div className="text-center p-4 bg-bgPrimary rounded border border-borderSubtle">
                <FiCloud className="text-blueAccent text-3xl mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase mb-1">Docker</p>
                <p className="text-sm font-semibold text-white">Auto-installed</p>
                <p className="text-[10px] text-gray-500">If not present</p>
              </div>
            </div>
          </div>

          {/* Installation Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Method 1: One-Command */}
            <div className="panel border-2 border-greenAccent/40 bg-greenAccent/5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <h3 className="text-lg font-bold text-white">Method 1: One-Command (Recommended)</h3>
                  <p className="text-xs text-gray-400">Fastest way • 5 minutes</p>
                </div>
              </div>

              <div className="bg-black rounded p-3 flex justify-between items-center">
                <code className="text-xs text-greenAccent font-mono flex-1 overflow-x-auto">
                  {installCommand}
                </code>
                <button
                  onClick={() => copyText(installCommand, "install")}
                  className="ml-2 p-1.5 text-blueAccent hover:bg-blueAccent/10 rounded"
                >
                  {copied === "install" ? <FiCheckCircle className="text-greenAccent" /> : <FiCopy />}
                </button>
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-300">
                <p className="font-semibold text-white">What it does:</p>
                <p>✓ Checks system requirements</p>
                <p>✓ Installs Docker & Docker Compose (if needed)</p>
                <p>✓ Downloads GreenOps</p>
                <p>✓ Configures environment</p>
                <p>✓ Starts all services</p>
                <p>✓ Shows access URLs</p>
              </div>
            </div>

            {/* Method 2: Docker Compose */}
            <div className="panel">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🐳</span>
                <div>
                  <h3 className="text-lg font-bold text-white">Method 2: Docker Compose</h3>
                  <p className="text-xs text-gray-400">Manual • For developers</p>
                </div>
              </div>

              <div className="bg-black rounded p-3 flex justify-between items-start">
                <code className="text-xs text-blueAccent font-mono flex-1 overflow-x-auto whitespace-pre-wrap">
                  {dockerCommand}
                </code>
                <button
                  onClick={() => copyText(dockerCommand, "docker")}
                  className="ml-2 p-1.5 text-blueAccent hover:bg-blueAccent/10 rounded shrink-0"
                >
                  {copied === "docker" ? <FiCheckCircle className="text-greenAccent" /> : <FiCopy />}
                </button>
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-300">
                <p className="font-semibold text-white">Prerequisites:</p>
                <p>• Docker installed</p>
                <p>• Docker Compose installed</p>
                <p>• Git installed</p>
                <p>• 4GB+ RAM available</p>
              </div>
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="panel">
            <div className="panel-title">📖 Complete Installation Guide</div>

            <div className="space-y-4 mt-4">

              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-greenAccent/20 border border-greenAccent flex items-center justify-center shrink-0">
                  <span className="text-greenAccent font-bold">1</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-1">Prepare Your Server</h4>
                  <p className="text-sm text-gray-400 mb-2">Choose where to install GreenOps:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="p-3 bg-bgPrimary rounded border border-borderSubtle">
                      <p className="text-xs font-semibold text-blueAccent mb-1">☁️ Cloud VM</p>
                      <p className="text-[10px] text-gray-400">AWS EC2, GCP, Azure, DigitalOcean</p>
                    </div>
                    <div className="p-3 bg-bgPrimary rounded border border-borderSubtle">
                      <p className="text-xs font-semibold text-yellowAccent mb-1">🏢 On-Premise</p>
                      <p className="text-[10px] text-gray-400">Your own data center server</p>
                    </div>
                    <div className="p-3 bg-bgPrimary rounded border border-borderSubtle">
                      <p className="text-xs font-semibold text-greenAccent mb-1">💻 Local Testing</p>
                      <p className="text-[10px] text-gray-400">Laptop for demo/development</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-greenAccent/20 border border-greenAccent flex items-center justify-center shrink-0">
                  <span className="text-greenAccent font-bold">2</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-1">Run Installer</h4>
                  <p className="text-sm text-gray-400 mb-2">SSH into your server and run:</p>
                  <div className="bg-black rounded p-3 flex justify-between items-center">
                    <code className="text-xs text-greenAccent font-mono">
                      {installCommand}
                    </code>
                    <button
                      onClick={() => copyText(installCommand, "step2")}
                      className="ml-2 text-blueAccent"
                    >
                      {copied === "step2" ? <FiCheckCircle className="text-greenAccent" /> : <FiCopy />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-greenAccent/20 border border-greenAccent flex items-center justify-center shrink-0">
                  <span className="text-greenAccent font-bold">3</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-1">Configuration Wizard</h4>
                  <p className="text-sm text-gray-400 mb-2">The installer will ask you:</p>
                  <ul className="text-xs text-gray-300 space-y-1 ml-4 list-disc">
                    <li>MongoDB choice (Atlas free tier or local)</li>
                    <li>Company name for branding</li>
                    <li>Admin email</li>
                    <li>Port configuration (defaults work fine)</li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-greenAccent/20 border border-greenAccent flex items-center justify-center shrink-0">
                  <span className="text-greenAccent font-bold">4</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-1">Wait for Setup (5-10 min)</h4>
                  <p className="text-sm text-gray-400 mb-2">
                    Docker downloads images and starts services. You'll see progress bars.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-greenAccent/20 border border-greenAccent flex items-center justify-center shrink-0">
                  <span className="text-greenAccent font-bold">5</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-1">Access GreenOps</h4>
                  <p className="text-sm text-gray-400 mb-2">Installer shows your URLs:</p>
                  <div className="bg-bgPrimary p-3 rounded border border-borderSubtle text-xs font-mono">
                    <p className="text-blueAccent">🎛️ Admin Dashboard: <span className="text-white">http://YOUR-IP:3000</span></p>
                    <p className="text-yellowAccent">🚪 User Portal: <span className="text-white">http://YOUR-IP:5001</span></p>
                    <p className="text-greenAccent">🔌 API: <span className="text-white">http://YOUR-IP:8000</span></p>
                  </div>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-greenAccent/20 border border-greenAccent flex items-center justify-center shrink-0">
                  <span className="text-greenAccent font-bold">6</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-1">Sign Up & Connect AWS</h4>
                  <p className="text-sm text-gray-400 mb-2">
                    Create admin account, then connect your AWS via one-click wizard.
                  </p>
                  <p className="text-xs text-greenAccent">
                    ✅ No AWS credentials to type — just paste your Role ARN
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Security & Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="panel">
              <div className="flex items-center gap-2 mb-3">
                <FiShield className="text-greenAccent text-2xl" />
                <h3 className="text-lg font-bold text-white">Enterprise Security</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                <p>✓ Read-only IAM role access</p>
                <p>✓ AWS STS temporary credentials</p>
                <p>✓ No customer passwords stored</p>
                <p>✓ Auditable in CloudTrail</p>
                <p>✓ Revocable anytime</p>
                <p>✓ SOC 2 compliant architecture</p>
              </div>
            </div>

            <div className="panel">
              <div className="flex items-center gap-2 mb-3">
                <FiUsers className="text-blueAccent text-2xl" />
                <h3 className="text-lg font-bold text-white">Multi-Tenant Ready</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                <p>✓ Unlimited customer accounts</p>
                <p>✓ Isolated dashboards per company</p>
                <p>✓ Role-based access control</p>
                <p>✓ Team invitations</p>
                <p>✓ Per-user billing tracking</p>
                <p>✓ Company-wide reports</p>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="panel">
            <div className="panel-title">🐛 Troubleshooting</div>
            <div className="mt-4 space-y-3 text-sm">

              <details className="bg-bgPrimary rounded p-3 border border-borderSubtle">
                <summary className="cursor-pointer text-white font-semibold">Docker not found</summary>
                <p className="mt-2 text-gray-400 text-xs">
                  The installer will auto-install Docker on Linux. For macOS, install Docker Desktop from{" "}
                  <a href="https://docker.com" target="_blank" className="text-blueAccent">docker.com</a>
                </p>
              </details>

              <details className="bg-bgPrimary rounded p-3 border border-borderSubtle">
                <summary className="cursor-pointer text-white font-semibold">Port 3000 already in use</summary>
                <div className="mt-2 text-gray-400 text-xs space-y-2">
                  <p>Choose different port when installer asks, or stop conflicting service:</p>
                  <code className="block bg-black p-2 rounded">sudo lsof -i :3000 | grep LISTEN</code>
                </div>
              </details>

              <details className="bg-bgPrimary rounded p-3 border border-borderSubtle">
                <summary className="cursor-pointer text-white font-semibold">MongoDB connection failed</summary>
                <p className="mt-2 text-gray-400 text-xs">
                  Make sure your MongoDB URI is correct. Test with:
                  <code className="block bg-black p-2 mt-2 rounded">docker compose logs mongodb</code>
                </p>
              </details>

              <details className="bg-bgPrimary rounded p-3 border border-borderSubtle">
                <summary className="cursor-pointer text-white font-semibold">Services won't start</summary>
                <div className="mt-2 text-gray-400 text-xs space-y-2">
                  <p>Check logs:</p>
                  <code className="block bg-black p-2 rounded">docker compose logs -f</code>
                  <p>Restart everything:</p>
                  <code className="block bg-black p-2 rounded">docker compose down && docker compose up -d</code>
                </div>
              </details>

              <details className="bg-bgPrimary rounded p-3 border border-borderSubtle">
                <summary className="cursor-pointer text-white font-semibold">Need more help?</summary>
                <p className="mt-2 text-gray-400 text-xs">
                  Report issues on GitHub:{" "}
                  <a href="https://github.com/kirangunaga992/GREEN-CLOUD-AUTONOMUS/issues" target="_blank" className="text-blueAccent">Report Issue</a>
                </p>
              </details>

            </div>
          </div>

          {/* Uninstall */}
          <div className="panel border border-redAccent/30">
            <div className="panel-title text-redAccent">🗑️ Uninstall GreenOps</div>
            <p className="text-sm text-gray-400 mt-2 mb-3">
              To completely remove GreenOps from your server:
            </p>
            <div className="bg-black rounded p-3 flex justify-between items-center">
              <code className="text-xs text-redAccent font-mono">
                cd greenops-autonomous && docker compose down -v && cd .. && rm -rf greenops-autonomous
              </code>
              <button
                onClick={() => copyText("cd greenops-autonomous && docker compose down -v && cd .. && rm -rf greenops-autonomous", "uninstall")}
                className="ml-2 text-redAccent"
              >
                {copied === "uninstall" ? <FiCheckCircle className="text-greenAccent" /> : <FiCopy />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
