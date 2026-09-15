import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { FiCopy, FiCheckCircle, FiExternalLink, FiChevronDown, FiChevronRight, FiZap, FiClock, FiDollarSign, FiActivity, FiInfo, FiAlertTriangle, FiArrowRight } from "react-icons/fi";

export default function WakeOnRequestGuide() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState("");
  const [openStep, setOpenStep] = useState(1);

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const lambdaCode = `import boto3
import json

def lambda_handler(event, context):
    """
    Wake-on-Request: Start EC2 instance when visitor arrives
    """
    ec2 = boto3.client('ec2', region_name='us-east-1')
    instance_id = 'YOUR_INSTANCE_ID'  # Replace with your instance
    
    # Get current state
    response = ec2.describe_instances(InstanceIds=[instance_id])
    state = response['Reservations'][0]['Instances'][0]['State']['Name']
    
    if state == 'stopped':
        # Start the instance
        ec2.start_instances(InstanceIds=[instance_id])
        return {
            'statusCode': 202,
            'headers': {'Content-Type': 'text/html', 'Retry-After': '30'},
            'body': '''
                <html><body style="font-family:Arial;text-align:center;padding:50px;background:#0B0F14;color:#e2e8f0;">
                    <h1>🚀 Waking up server...</h1>
                    <p>This site was sleeping to save energy. Auto-refreshing in 30 seconds.</p>
                    <script>setTimeout(() => location.reload(), 30000);</script>
                </body></html>
            '''
        }
    elif state == 'pending':
        return {
            'statusCode': 202,
            'body': 'Server is starting, please wait...'
        }
    else:
        # Instance is running, redirect to actual server
        public_ip = response['Reservations'][0]['Instances'][0].get('PublicIpAddress')
        return {
            'statusCode': 302,
            'headers': {'Location': f'http://{public_ip}'},
            'body': ''
        }`;

  const stopLambdaCode = `import boto3
from datetime import datetime, timedelta, timezone

def lambda_handler(event, context):
    """
    Auto-stop: Check idle instances every 15 min, stop if no traffic
    """
    ec2 = boto3.client('ec2', region_name='us-east-1')
    cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')
    
    instance_id = 'YOUR_INSTANCE_ID'
    
    # Get network traffic for last 15 minutes
    metrics = cloudwatch.get_metric_statistics(
        Namespace='AWS/EC2',
        MetricName='NetworkIn',
        Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
        StartTime=datetime.now(timezone.utc) - timedelta(minutes=15),
        EndTime=datetime.now(timezone.utc),
        Period=300,
        Statistics=['Sum']
    )
    
    total_bytes = sum(d['Sum'] for d in metrics['Datapoints'])
    
    # If less than 100KB traffic in 15 min = idle
    if total_bytes < 100000:
        ec2.stop_instances(InstanceIds=[instance_id])
        print(f"Stopped instance {instance_id} - idle")
    else:
        print(f"Instance active: {total_bytes} bytes")
    
    return {'statusCode': 200, 'body': 'Check complete'}`;

  const cloudFrontConfig = `{
  "Origins": [
    {
      "Id": "LambdaOrigin",
      "DomainName": "YOUR_API_GATEWAY.execute-api.us-east-1.amazonaws.com",
      "CustomOriginConfig": {
        "OriginProtocolPolicy": "https-only"
      }
    },
    {
      "Id": "EC2Origin", 
      "DomainName": "YOUR_EC2_PUBLIC_DNS.compute-1.amazonaws.com",
      "CustomOriginConfig": {
        "OriginProtocolPolicy": "http-only"
      }
    }
  ]
}`;

  return (
    <div className="flex min-h-screen bg-bgPrimary">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Header />
        <div className="px-6 py-4 space-y-6 max-w-5xl mx-auto">

          {/* Back Button */}
          <button
            onClick={() => navigate("/autoscaler")}
            className="text-blueAccent hover:text-blue-400 text-sm flex items-center gap-1"
          >
            &larr; Back to Autoscaler
          </button>

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              ⚡ Wake-on-Request Setup Guide
            </h1>
            <p className="text-gray-400 mt-2">
              Auto-stop idle web servers, auto-wake when visitors arrive. Save 90%+ on cost & carbon.
            </p>
          </div>

          {/* Overview */}
          <div className="panel bg-gradient-to-br from-yellowAccent/10 to-greenAccent/10 border-yellowAccent/40">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <FiClock className="text-yellowAccent text-3xl mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase">Setup Time</p>
                <p className="text-lg font-bold text-white">30-45 min</p>
              </div>
              <div className="text-center">
                <FiDollarSign className="text-greenAccent text-3xl mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase">Save</p>
                <p className="text-lg font-bold text-white">90%+</p>
              </div>
              <div className="text-center">
                <FiActivity className="text-blueAccent text-3xl mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase">First Visit</p>
                <p className="text-lg font-bold text-white">30-60s</p>
              </div>
              <div className="text-center">
                <FiZap className="text-yellowAccent text-3xl mx-auto mb-2" />
                <p className="text-xs text-gray-400 uppercase">Next Visits</p>
                <p className="text-lg font-bold text-white">Instant</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="panel bg-blueAccent/5 border-blueAccent/30">
            <div className="flex items-start gap-3">
              <FiInfo className="text-blueAccent text-2xl mt-1" />
              <div>
                <p className="text-sm font-bold text-white mb-1">Best For:</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>✓ Personal blogs / portfolios</li>
                  <li>✓ Dev/staging environments</li>
                  <li>✓ Low-traffic marketing sites</li>
                  <li>✓ Documentation sites</li>
                  <li>✓ Internal tools</li>
                </ul>
                <p className="text-sm font-bold text-white mt-3 mb-1">NOT For:</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>✗ E-commerce sites (users won't wait 30s)</li>
                  <li>✗ Real-time apps (chat, gaming)</li>
                  <li>✗ Mission-critical services</li>
                  <li>✗ APIs with SLA requirements</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="panel">
            <h2 className="text-lg font-bold text-white mb-4">🎯 How It Works</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-bgPrimary rounded border border-borderSubtle">
                <span className="text-2xl">1.</span>
                <div>
                  <p className="text-sm text-white font-semibold">Visitor arrives at your website</p>
                  <p className="text-xs text-gray-400">Request goes to CloudFront (CDN)</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-bgPrimary rounded border border-borderSubtle">
                <span className="text-2xl">2.</span>
                <div>
                  <p className="text-sm text-white font-semibold">CloudFront checks if EC2 is running</p>
                  <p className="text-xs text-gray-400">Uses Lambda@Edge for health check</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-yellowAccent/5 rounded border border-yellowAccent/30">
                <span className="text-2xl">3.</span>
                <div>
                  <p className="text-sm text-white font-semibold">If EC2 is STOPPED:</p>
                  <p className="text-xs text-gray-400">Lambda starts instance + shows "Waking up..." page</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-greenAccent/5 rounded border border-greenAccent/30">
                <span className="text-2xl">4.</span>
                <div>
                  <p className="text-sm text-white font-semibold">Instance running (30-60 sec later)</p>
                  <p className="text-xs text-gray-400">Page auto-refreshes, visitor sees your site</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-bgPrimary rounded border border-borderSubtle">
                <span className="text-2xl">5.</span>
                <div>
                  <p className="text-sm text-white font-semibold">15 min no traffic</p>
                  <p className="text-xs text-gray-400">Second Lambda stops instance (saves money)</p>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 1: Create Wake Lambda */}
          <div className="panel">
            <button
              onClick={() => setOpenStep(openStep === 1 ? 0 : 1)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellowAccent/20 border-2 border-yellowAccent flex items-center justify-center text-2xl">⚡</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Step 1: Create "Wake Instance" Lambda</h3>
                  <p className="text-xs text-gray-400">Time: 10 minutes</p>
                </div>
              </div>
              {openStep === 1 ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {openStep === 1 && (
              <div className="mt-4 pl-16 space-y-4">
                <p className="text-sm text-gray-300">Create AWS Lambda function that wakes up your EC2 instance:</p>

                <ol className="text-sm text-gray-300 space-y-2 ml-4 list-decimal">
                  <li>Open <a href="https://console.aws.amazon.com/lambda" target="_blank" className="text-blueAccent">AWS Lambda Console</a></li>
                  <li>Click <strong>"Create function"</strong></li>
                  <li>Function name: <code className="bg-black text-yellowAccent px-2 rounded">wake-ec2-instance</code></li>
                  <li>Runtime: <strong>Python 3.11</strong></li>
                  <li>Click <strong>"Create function"</strong></li>
                  <li>Paste this code (replace YOUR_INSTANCE_ID):</li>
                </ol>

                <div className="relative">
                  <pre className="bg-black text-greenAccent p-4 rounded overflow-x-auto text-xs">
                    <code>{lambdaCode}</code>
                  </pre>
                  <button
                    onClick={() => copyText(lambdaCode, "wake-lambda")}
                    className="absolute top-2 right-2 px-3 py-1 bg-blueAccent text-white text-xs rounded"
                  >
                    {copied === "wake-lambda" ? "✓ Copied" : <FiCopy />}
                  </button>
                </div>

                <div className="p-3 bg-yellowAccent/10 border border-yellowAccent/30 rounded">
                  <p className="text-xs text-yellowAccent">
                    <strong>⚠️ IMPORTANT:</strong> Add IAM permissions to Lambda:
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Configuration → Permissions → Add policies:
                    <br />• <strong>AmazonEC2FullAccess</strong> (or restrict to ec2:StartInstances)
                  </p>
                </div>

                <p className="text-sm text-gray-300">Click <strong className="text-white">"Deploy"</strong></p>

                <button
                  onClick={() => setOpenStep(2)}
                  className="w-full py-2 bg-greenAccent/20 text-greenAccent rounded hover:bg-greenAccent/30 font-semibold"
                >
                  Done - Next Step
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: API Gateway */}
          <div className="panel">
            <button
              onClick={() => setOpenStep(openStep === 2 ? 0 : 2)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blueAccent/20 border-2 border-blueAccent flex items-center justify-center text-2xl">🌐</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Step 2: Create API Gateway</h3>
                  <p className="text-xs text-gray-400">Time: 10 minutes</p>
                </div>
              </div>
              {openStep === 2 ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {openStep === 2 && (
              <div className="mt-4 pl-16 space-y-4">
                <p className="text-sm text-gray-300">Create HTTP endpoint that triggers Lambda:</p>

                <ol className="text-sm text-gray-300 space-y-2 ml-4 list-decimal">
                  <li>Open <a href="https://console.aws.amazon.com/apigateway" target="_blank" className="text-blueAccent">API Gateway Console</a></li>
                  <li>Click <strong>"Create API"</strong></li>
                  <li>Choose <strong>"HTTP API"</strong> → Build</li>
                  <li>Add integration: <strong>Lambda</strong> → Select <code className="bg-black px-1 rounded">wake-ec2-instance</code></li>
                  <li>API name: <code className="bg-black text-yellowAccent px-2 rounded">wake-api</code></li>
                  <li>Configure routes: <code className="bg-black text-yellowAccent px-2 rounded">GET /</code></li>
                  <li>Deploy → Copy the <strong>Invoke URL</strong></li>
                </ol>

                <div className="p-3 bg-blueAccent/10 border border-blueAccent/30 rounded">
                  <p className="text-xs text-blueAccent">
                    <strong>Test it:</strong> Visit the Invoke URL in browser. Should show "Waking up server..." message
                  </p>
                </div>

                <button
                  onClick={() => setOpenStep(3)}
                  className="w-full py-2 bg-greenAccent/20 text-greenAccent rounded hover:bg-greenAccent/30 font-semibold"
                >
                  Done - Next Step
                </button>
              </div>
            )}
          </div>

          {/* STEP 3: Auto-Stop Lambda */}
          <div className="panel">
            <button
              onClick={() => setOpenStep(openStep === 3 ? 0 : 3)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-redAccent/20 border-2 border-redAccent flex items-center justify-center text-2xl">⏸️</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Step 3: Create "Auto-Stop" Lambda</h3>
                  <p className="text-xs text-gray-400">Time: 10 minutes</p>
                </div>
              </div>
              {openStep === 3 ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {openStep === 3 && (
              <div className="mt-4 pl-16 space-y-4">
                <p className="text-sm text-gray-300">Create Lambda that auto-stops idle instances:</p>

                <ol className="text-sm text-gray-300 space-y-2 ml-4 list-decimal">
                  <li>Create new Lambda: <code className="bg-black text-yellowAccent px-2 rounded">auto-stop-ec2</code></li>
                  <li>Runtime: Python 3.11</li>
                  <li>Paste this code:</li>
                </ol>

                <div className="relative">
                  <pre className="bg-black text-greenAccent p-4 rounded overflow-x-auto text-xs">
                    <code>{stopLambdaCode}</code>
                  </pre>
                  <button
                    onClick={() => copyText(stopLambdaCode, "stop-lambda")}
                    className="absolute top-2 right-2 px-3 py-1 bg-blueAccent text-white text-xs rounded"
                  >
                    {copied === "stop-lambda" ? "✓ Copied" : <FiCopy />}
                  </button>
                </div>

                <ol className="text-sm text-gray-300 space-y-2 ml-4 list-decimal" start="4">
                  <li>Add permissions: <strong>AmazonEC2FullAccess</strong> + <strong>CloudWatchReadOnlyAccess</strong></li>
                  <li>Go to <strong>EventBridge</strong></li>
                  <li>Create rule: <code className="bg-black text-yellowAccent px-2 rounded">stop-idle-check</code></li>
                  <li>Schedule: <code className="bg-black text-yellowAccent px-2 rounded">rate(15 minutes)</code></li>
                  <li>Target: <code className="bg-black px-1 rounded">auto-stop-ec2</code> Lambda</li>
                </ol>

                <button
                  onClick={() => setOpenStep(4)}
                  className="w-full py-2 bg-greenAccent/20 text-greenAccent rounded hover:bg-greenAccent/30 font-semibold"
                >
                  Done - Next Step
                </button>
              </div>
            )}
          </div>

          {/* STEP 4: CloudFront */}
          <div className="panel">
            <button
              onClick={() => setOpenStep(openStep === 4 ? 0 : 4)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-2xl">☁️</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Step 4: Setup CloudFront (CDN)</h3>
                  <p className="text-xs text-gray-400">Time: 15 minutes</p>
                </div>
              </div>
              {openStep === 4 ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {openStep === 4 && (
              <div className="mt-4 pl-16 space-y-4">
                <p className="text-sm text-gray-300">CloudFront routes traffic to Lambda (if stopped) or EC2 (if running):</p>

                <ol className="text-sm text-gray-300 space-y-2 ml-4 list-decimal">
                  <li>Open <a href="https://console.aws.amazon.com/cloudfront" target="_blank" className="text-blueAccent">CloudFront Console</a></li>
                  <li>Click <strong>"Create distribution"</strong></li>
                  <li>Origin domain: Your <strong>API Gateway URL</strong> (from Step 2)</li>
                  <li>Behavior: Redirect HTTP → HTTPS</li>
                  <li>Cache policy: <strong>CachingDisabled</strong> (dynamic content)</li>
                  <li>Create distribution</li>
                  <li>Wait 5-15 min for deployment</li>
                  <li>Copy the CloudFront domain: <code className="bg-black text-yellowAccent px-2 rounded">d1234abcd.cloudfront.net</code></li>
                </ol>

                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
                  <p className="text-xs text-purple-400">
                    <strong>💡 Pro tip:</strong> Add custom domain (yoursite.com) via CloudFront settings
                  </p>
                </div>

                <button
                  onClick={() => setOpenStep(5)}
                  className="w-full py-2 bg-greenAccent/20 text-greenAccent rounded hover:bg-greenAccent/30 font-semibold"
                >
                  Done - Next Step
                </button>
              </div>
            )}
          </div>

          {/* STEP 5: Test */}
          <div className="panel border-2 border-greenAccent/40 bg-greenAccent/5">
            <button
              onClick={() => setOpenStep(openStep === 5 ? 0 : 5)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-greenAccent flex items-center justify-center text-2xl text-black">✓</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">Step 5: Test & Enjoy Savings!</h3>
                  <p className="text-xs text-gray-400">Time: 5 minutes</p>
                </div>
              </div>
              {openStep === 5 ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {openStep === 5 && (
              <div className="mt-4 pl-16 space-y-4">
                <p className="text-sm text-gray-300">Let's verify everything works:</p>

                <div className="space-y-3">
                  <div className="p-3 bg-bgPrimary rounded border border-borderSubtle">
                    <p className="text-sm font-semibold text-white mb-2">Test 1: Stop your instance manually</p>
                    <p className="text-xs text-gray-400">In EC2 Console → Actions → Stop Instance</p>
                  </div>

                  <div className="p-3 bg-bgPrimary rounded border border-borderSubtle">
                    <p className="text-sm font-semibold text-white mb-2">Test 2: Visit your CloudFront URL</p>
                    <p className="text-xs text-gray-400">You should see "Waking up server..." page</p>
                  </div>

                  <div className="p-3 bg-bgPrimary rounded border border-borderSubtle">
                    <p className="text-sm font-semibold text-white mb-2">Test 3: Wait 30-60 seconds</p>
                    <p className="text-xs text-gray-400">Page auto-refreshes, shows your actual site</p>
                  </div>

                  <div className="p-3 bg-bgPrimary rounded border border-borderSubtle">
                    <p className="text-sm font-semibold text-white mb-2">Test 4: Wait 15 min without visiting</p>
                    <p className="text-xs text-gray-400">Instance auto-stops. Check EC2 Console.</p>
                  </div>
                </div>

                <div className="p-4 bg-greenAccent/20 border border-greenAccent/40 rounded">
                  <p className="text-sm text-white font-bold mb-2">🎉 Congratulations!</p>
                  <p className="text-xs text-gray-300">
                    Your website now auto-scales to zero when idle. Expected savings:
                  </p>
                  <ul className="text-xs text-gray-300 mt-2 space-y-1 ml-4">
                    <li>✅ 20 visitors/day = only 2 hours runtime = 90% savings</li>
                    <li>✅ 100 visitors/day = only 10 hours runtime = 60% savings</li>
                    <li>✅ Zero visitors = 100% savings (with tiny wake fee)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Cost Comparison */}
          <div className="panel">
            <h3 className="text-lg font-bold text-white mb-4">💰 Cost Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-redAccent/10 border border-redAccent/30 rounded">
                <p className="text-sm font-bold text-redAccent mb-2">❌ WITHOUT Wake-on-Request</p>
                <p className="text-3xl font-bold text-white">$7.49<span className="text-sm text-gray-400">/mo</span></p>
                <p className="text-xs text-gray-400 mt-2">t3.micro running 24/7</p>
                <p className="text-xs text-gray-400">720 hours/month</p>
              </div>
              <div className="p-4 bg-greenAccent/10 border border-greenAccent/30 rounded">
                <p className="text-sm font-bold text-greenAccent mb-2">✅ WITH Wake-on-Request</p>
                <p className="text-3xl font-bold text-white">$0.75<span className="text-sm text-gray-400">/mo</span></p>
                <p className="text-xs text-gray-400 mt-2">Only runs during traffic</p>
                <p className="text-xs text-gray-400">~2 hours/day = 60 hours/month</p>
                <p className="text-xs text-greenAccent mt-1 font-bold">💰 90% SAVINGS!</p>
              </div>
            </div>
          </div>

          {/* Additional Costs */}
          <div className="panel bg-yellowAccent/5 border-yellowAccent/30">
            <h3 className="text-sm font-bold text-yellowAccent mb-2">⚠️ Additional AWS Costs</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <p>• Lambda invocations: ~$0.20/1M requests (free tier: 1M/month FREE)</p>
              <p>• API Gateway: ~$1/1M requests (free tier: 1M/month FREE)</p>
              <p>• CloudFront: 1TB free/month, then $0.085/GB</p>
              <p className="text-greenAccent font-bold mt-2">💡 For most personal sites: All costs stay in AWS FREE tier!</p>
            </div>
          </div>

          {/* Alternative Solutions */}
          <div className="panel">
            <h3 className="text-lg font-bold text-white mb-4">🎯 Simpler Alternatives</h3>
            <div className="space-y-3">
              <div className="p-3 bg-bgPrimary rounded border border-borderSubtle">
                <p className="text-sm text-white font-semibold">Option 1: AWS Lambda (Serverless)</p>
                <p className="text-xs text-gray-400">Convert your app to Lambda. Auto-scales 0 to infinite. Pay per request.</p>
                <p className="text-xs text-greenAccent mt-1">Best for: APIs, simple web apps</p>
              </div>
              <div className="p-3 bg-bgPrimary rounded border border-borderSubtle">
                <p className="text-sm text-white font-semibold">Option 2: AWS Fargate (Containers)</p>
                <p className="text-xs text-gray-400">Run Docker containers. Auto-scales. No servers to manage.</p>
                <p className="text-xs text-greenAccent mt-1">Best for: Existing Docker apps</p>
              </div>
              <div className="p-3 bg-bgPrimary rounded border border-borderSubtle">
                <p className="text-sm text-white font-semibold">Option 3: AWS Amplify Hosting</p>
                <p className="text-xs text-gray-400">Static sites hosted on CDN. Free for personal use.</p>
                <p className="text-xs text-greenAccent mt-1">Best for: React/Next.js/Static sites</p>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="p-4 rounded bg-blueAccent/10 border border-blueAccent/30">
            <p className="text-sm text-white font-bold mb-2">🆘 Need Help?</p>
            <p className="text-xs text-gray-300">
              This is an ADVANCED setup. If stuck, contact support or use monitor-only mode which is safer.
            </p>
          </div>

          {/* Ready Button */}
          <div className="text-center py-6">
            <button
              onClick={() => navigate("/autoscaler")}
              className="px-8 py-4 bg-greenAccent text-black rounded font-bold hover:bg-green-500 shadow-lg text-lg inline-flex items-center gap-2"
            >
              Back to Autoscaler <FiArrowRight />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
