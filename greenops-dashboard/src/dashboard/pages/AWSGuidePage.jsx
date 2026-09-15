import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { FiCopy, FiCheckCircle, FiCloud, FiExternalLink, FiAlertCircle, FiShield, FiClock, FiArrowRight, FiChevronDown, FiChevronRight } from "react-icons/fi";

export default function AWSGuidePage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState("");
  const [openStep, setOpenStep] = useState(1);

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const YOUR_ACCOUNT_ID = "736461510325";

  const trustPolicy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${YOUR_ACCOUNT_ID}:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}`;

  return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Header />
        <div className="px-6 py-4 space-y-6 max-w-5xl mx-auto">

          {/* Header */}
          <div>
            <button
              onClick={() => navigate("/cloud")}
              className="text-blueAccent hover:text-blue-400 text-sm mb-3"
            >
              &larr; Back to Cloud Providers
            </button>
            <h1 className="text-3xl font-bold text-white">
              📖 AWS Account Setup Guide
            </h1>
            <p className="text-gray-400 mt-2">
              Complete step-by-step guide to connect your AWS account
            </p>
          </div>

          {/* Overview */}
          <div className="panel bg-gradient-to-br from-greenAccent/10 to-blueAccent/10 border-greenAccent/40">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <FiClock className="text-greenAccent text-3xl mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase">Total Time</p>
                <p className="text-lg font-bold text-white">5-7 minutes</p>
              </div>
              <div className="text-center">
                <FiShield className="text-blueAccent text-3xl mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase">Security</p>
                <p className="text-lg font-bold text-white">Read-Only</p>
              </div>
              <div className="text-center">
                <FiCheckCircle className="text-yellowAccent text-3xl mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase">Passwords</p>
                <p className="text-lg font-bold text-white">Not Required</p>
              </div>
              <div className="text-center">
                <FiCloud className="text-greenAccent text-3xl mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase">Cost</p>
                <p className="text-lg font-bold text-white">100% Free</p>
              </div>
            </div>
          </div>

          {/* STEP 1 */}
          <div className="panel">
            <button
              onClick={() => setOpenStep(openStep === 1 ? 0 : 1)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blueAccent/20 border-2 border-blueAccent flex items-center justify-center text-2xl">🌐</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Step 1: Open AWS Console</h3>
                  <p className="text-xs text-gray-400">Time: 1 minute</p>
                </div>
              </div>
              {openStep === 1 ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {openStep === 1 && (
              <div className="mt-4 pl-16 space-y-4">
                <p className="text-sm text-gray-300">
                  Open your AWS Management Console in a new browser tab:
                </p>
                <a
                  href="https://console.aws.amazon.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-3 bg-blueAccent text-white rounded font-semibold hover:bg-blue-600"
                >
                  <FiExternalLink /> Open AWS Console
                </a>
                <button
                  onClick={() => setOpenStep(2)}
                  className="w-full py-2 bg-greenAccent/20 text-greenAccent rounded hover:bg-greenAccent/30 font-semibold"
                >
                  Done - Next Step
                </button>
              </div>
            )}
          </div>

          {/* STEP 2 */}
          <div className="panel">
            <button
              onClick={() => setOpenStep(openStep === 2 ? 0 : 2)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellowAccent/20 border-2 border-yellowAccent flex items-center justify-center text-2xl">🔐</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Step 2: Navigate to IAM</h3>
                  <p className="text-xs text-gray-400">Time: 30 seconds</p>
                </div>
              </div>
              {openStep === 2 ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {openStep === 2 && (
              <div className="mt-4 pl-16 space-y-4">
                <p className="text-sm text-gray-300">Navigate to IAM (Identity Access Management):</p>
                <ol className="text-sm text-gray-300 space-y-2 ml-4 list-decimal">
                  <li>Click the search bar at top of AWS Console</li>
                  <li>Type: <code className="text-yellowAccent bg-black px-1 rounded">IAM</code></li>
                  <li>Click "IAM" from dropdown</li>
                </ol>
                <a
                  href="https://console.aws.amazon.com/iam/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blueAccent text-sm hover:text-blue-400 flex items-center gap-1"
                >
                  <FiExternalLink /> Direct link to IAM
                </a>
                <button
                  onClick={() => setOpenStep(3)}
                  className="w-full py-2 bg-greenAccent/20 text-greenAccent rounded hover:bg-greenAccent/30 font-semibold"
                >
                  Done - Next Step
                </button>
              </div>
            )}
          </div>

          {/* STEP 3 */}
          <div className="panel">
            <button
              onClick={() => setOpenStep(openStep === 3 ? 0 : 3)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-greenAccent/20 border-2 border-greenAccent flex items-center justify-center text-2xl">➕</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Step 3: Create IAM Role</h3>
                  <p className="text-xs text-gray-400">Time: 2 minutes</p>
                </div>
              </div>
              {openStep === 3 ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {openStep === 3 && (
              <div className="mt-4 pl-16 space-y-4">
                <ol className="text-sm text-gray-300 space-y-3 ml-4 list-decimal">
                  <li>In IAM left sidebar, click <strong className="text-white">"Roles"</strong></li>
                  <li>Click blue <strong className="text-white">"Create role"</strong> button (top right)</li>
                  <li>Select <strong className="text-white">"Custom trust policy"</strong> (third option)</li>
                </ol>
                <button
                  onClick={() => setOpenStep(4)}
                  className="w-full py-2 bg-greenAccent/20 text-greenAccent rounded hover:bg-greenAccent/30 font-semibold"
                >
                  Done - Continue
                </button>
              </div>
            )}
          </div>

          {/* STEP 4 */}
          <div className="panel">
            <button
              onClick={() => setOpenStep(openStep === 4 ? 0 : 4)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-2xl">🛡️</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Step 4: Paste Trust Policy</h3>
                  <p className="text-xs text-gray-400">Time: 1 minute - CRITICAL</p>
                </div>
              </div>
              {openStep === 4 ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {openStep === 4 && (
              <div className="mt-4 pl-16 space-y-4">
                <div className="p-3 bg-redAccent/10 border border-redAccent/30 rounded">
                  <p className="text-xs text-redAccent">
                    <strong>Important:</strong> Delete pre-filled JSON. Copy this exact policy:
                  </p>
                </div>

                <div className="relative">
                  <pre className="bg-black text-yellowAccent p-4 rounded border border-borderSubtle overflow-x-auto text-xs">
                    <code>{trustPolicy}</code>
                  </pre>
                  <button
                    onClick={() => copyText(trustPolicy, "trust")}
                    className="absolute top-2 right-2 px-3 py-1 bg-blueAccent text-white text-xs rounded hover:bg-blue-600 flex items-center gap-1"
                  >
                    {copied === "trust" ? <FiCheckCircle /> : <FiCopy />}
                    {copied === "trust" ? "Copied!" : "Copy"}
                  </button>
                </div>

                <p className="text-sm text-gray-300">Then click <strong className="text-white">"Next"</strong></p>
                <button
                  onClick={() => setOpenStep(5)}
                  className="w-full py-2 bg-greenAccent/20 text-greenAccent rounded hover:bg-greenAccent/30 font-semibold"
                >
                  Done - Continue
                </button>
              </div>
            )}
          </div>

          {/* STEP 5 */}
          <div className="panel">
            <button
              onClick={() => setOpenStep(openStep === 5 ? 0 : 5)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center text-2xl">📋</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Step 5: Attach ReadOnly Policy</h3>
                  <p className="text-xs text-gray-400">Time: 1 minute</p>
                </div>
              </div>
              {openStep === 5 ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {openStep === 5 && (
              <div className="mt-4 pl-16 space-y-4">
                <ol className="text-sm text-gray-300 space-y-3 ml-4 list-decimal">
                  <li>
                    Search: 
                    <div className="mt-2 flex items-center gap-2">
                      <code className="bg-black text-yellowAccent px-3 py-2 rounded flex-1">ReadOnlyAccess</code>
                      <button
                        onClick={() => copyText("ReadOnlyAccess", "readonly")}
                        className="px-3 py-2 bg-blueAccent text-white text-xs rounded"
                      >
                        {copied === "readonly" ? <FiCheckCircle /> : <FiCopy />}
                      </button>
                    </div>
                  </li>
                  <li>
                    <strong className="text-white">Check the box next to "ReadOnlyAccess"</strong>
                    <p className="text-xs text-greenAccent mt-1">The plain one - not "AIOpsReadOnlyAccess" or others</p>
                  </li>
                  <li>Click <strong className="text-white">"Next"</strong></li>
                  <li>
                    Role Name:
                    <div className="mt-2 flex items-center gap-2">
                      <code className="bg-black text-yellowAccent px-3 py-2 rounded flex-1">GreenOpsReadOnly</code>
                      <button
                        onClick={() => copyText("GreenOpsReadOnly", "rolename")}
                        className="px-3 py-2 bg-blueAccent text-white text-xs rounded"
                      >
                        {copied === "rolename" ? <FiCheckCircle /> : <FiCopy />}
                      </button>
                    </div>
                  </li>
                  <li>Click <strong className="text-white">"Create role"</strong></li>
                </ol>
                <button
                  onClick={() => setOpenStep(6)}
                  className="w-full py-2 bg-greenAccent/20 text-greenAccent rounded hover:bg-greenAccent/30 font-semibold"
                >
                  Done - Get ARN
                </button>
              </div>
            )}
          </div>

          {/* STEP 6 */}
          <div className="panel">
            <button
              onClick={() => setOpenStep(openStep === 6 ? 0 : 6)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-greenAccent/20 border-2 border-greenAccent flex items-center justify-center text-2xl">📎</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Step 6: Copy Role ARN</h3>
                  <p className="text-xs text-gray-400">Time: 30 seconds</p>
                </div>
              </div>
              {openStep === 6 ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {openStep === 6 && (
              <div className="mt-4 pl-16 space-y-4">
                <ol className="text-sm text-gray-300 space-y-3 ml-4 list-decimal">
                  <li>Click on <strong className="text-white">"GreenOpsReadOnly"</strong> role you just created</li>
                  <li>Look at top of the page for <strong className="text-white">"ARN"</strong></li>
                  <li>
                    Copy the value. Format:
                    <div className="mt-2 p-3 bg-bgPrimary rounded border border-borderSubtle">
                      <code className="text-xs text-yellowAccent break-all">
                        arn:aws:iam::YOUR_ID:role/GreenOpsReadOnly
                      </code>
                    </div>
                  </li>
                </ol>
                <button
                  onClick={() => setOpenStep(7)}
                  className="w-full py-2 bg-greenAccent/20 text-greenAccent rounded hover:bg-greenAccent/30 font-semibold"
                >
                  ARN Copied - Final Step
                </button>
              </div>
            )}
          </div>

          {/* STEP 7 */}
          <div className="panel border-2 border-greenAccent/40 bg-greenAccent/5">
            <button
              onClick={() => setOpenStep(openStep === 7 ? 0 : 7)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-greenAccent flex items-center justify-center text-2xl text-black">✓</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Step 7: Connect in GreenOps</h3>
                  <p className="text-xs text-gray-400">Time: 1 minute</p>
                </div>
              </div>
              {openStep === 7 ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {openStep === 7 && (
              <div className="mt-4 pl-16 space-y-4">
                <ol className="text-sm text-gray-300 space-y-3 ml-4 list-decimal">
                  <li>Come back to GreenOps</li>
                  <li>Go to Cloud Providers page</li>
                  <li>Click <strong className="text-white">"Add AWS Account"</strong></li>
                  <li>Fill Account Name, paste ARN, select Region</li>
                  <li>Click <strong className="text-white">"Connect AWS"</strong></li>
                </ol>

                <div className="p-4 bg-gradient-to-r from-greenAccent/20 to-blueAccent/20 border border-greenAccent/40 rounded">
                  <p className="text-sm text-white font-bold mb-2">Success!</p>
                  <p className="text-xs text-gray-300">
                    Your real AWS EC2 instances will appear with real cost and carbon data.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/cloud")}
                  className="w-full py-3 bg-greenAccent text-black rounded font-bold hover:bg-green-500 flex items-center justify-center gap-2"
                >
                  Go to Cloud Providers Page <FiArrowRight />
                </button>
              </div>
            )}
          </div>

          {/* Security Info */}
          <div className="panel bg-blueAccent/5 border-blueAccent/30">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <FiShield className="text-blueAccent" /> Security Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-greenAccent font-semibold mb-2">What GreenOps Gets:</p>
                <ul className="text-xs text-gray-300 space-y-1 ml-4">
                  <li>&bull; Read-only access to EC2, S3, RDS</li>
                  <li>&bull; CPU and memory metrics</li>
                  <li>&bull; Instance types and regions</li>
                  <li>&bull; Cost estimates</li>
                </ul>
              </div>
              <div>
                <p className="text-sm text-redAccent font-semibold mb-2">What GreenOps CANNOT Do:</p>
                <ul className="text-xs text-gray-300 space-y-1 ml-4">
                  <li>&bull; Delete or modify anything</li>
                  <li>&bull; Access your data</li>
                  <li>&bull; See your passwords</li>
                  <li>&bull; Create new resources</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="panel">
            <h3 className="text-lg font-bold text-white mb-3">Troubleshooting</h3>
            <div className="space-y-2">
              <details className="bg-bgPrimary p-3 rounded border border-borderSubtle">
                <summary className="cursor-pointer text-white text-sm font-semibold">
                  "Failed to assume role"
                </summary>
                <p className="text-xs text-gray-400 mt-2">
                  Trust policy is wrong. Update to allow arn:aws:iam::{YOUR_ACCOUNT_ID}:root
                </p>
              </details>
              <details className="bg-bgPrimary p-3 rounded border border-borderSubtle">
                <summary className="cursor-pointer text-white text-sm font-semibold">
                  "Access Denied"
                </summary>
                <p className="text-xs text-gray-400 mt-2">
                  Role missing ReadOnlyAccess policy. Add it in IAM console.
                </p>
              </details>
              <details className="bg-bgPrimary p-3 rounded border border-borderSubtle">
                <summary className="cursor-pointer text-white text-sm font-semibold">
                  No instances showing
                </summary>
                <p className="text-xs text-gray-400 mt-2">
                  Try adding account again with different AWS region.
                </p>
              </details>
            </div>
          </div>

          {/* Ready Button */}
          <div className="text-center py-6">
            <button
              onClick={() => navigate("/cloud")}
              className="px-8 py-4 bg-greenAccent text-black rounded font-bold hover:bg-green-500 shadow-lg text-lg inline-flex items-center gap-2"
            >
              Go Connect AWS Now <FiArrowRight />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
