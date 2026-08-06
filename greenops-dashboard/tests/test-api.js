/**
 * Frontend API Tests
 * Tests all backend endpoints are reachable
 */

const API_BASE = "http://localhost:8000";

const tests = {
  passed: 0,
  failed: 0,
  results: []
};

async function testEndpoint(name, url, method = "GET", expectedStatus = 200) {
  try {
    const response = await fetch(url, { method });
    const ok = response.status === expectedStatus;
    
    if (ok) {
      tests.passed++;
      tests.results.push({ name, status: "PASS", code: response.status });
      console.log(`✅ ${name}: PASS (${response.status})`);
    } else {
      tests.failed++;
      tests.results.push({ name, status: "FAIL", code: response.status });
      console.log(`❌ ${name}: FAIL (expected ${expectedStatus}, got ${response.status})`);
    }
  } catch (e) {
    tests.failed++;
    tests.results.push({ name, status: "ERROR", error: e.message });
    console.log(`❌ ${name}: ERROR - ${e.message}`);
  }
}

async function runTests() {
  console.log("\n🧪 Running Frontend API Tests\n");
  console.log("=" + "=".repeat(50));
  
  // Health checks
  await testEndpoint("Backend Health", `${API_BASE}/health`);
  await testEndpoint("Backend Root", `${API_BASE}/`);
  
  // Auth endpoints
  await testEndpoint("Get CAPTCHA", `${API_BASE}/api/auth/captcha`);
  await testEndpoint("Login (no data)", `${API_BASE}/api/auth/login`, "POST", 422);
  await testEndpoint("Signup (no data)", `${API_BASE}/api/auth/signup`, "POST", 422);
  
  // Public endpoints
  await testEndpoint("Get Services Catalog", `${API_BASE}/api/services/catalog`);
  
  // Protected endpoints (should return 401 without token)
  await testEndpoint("Cloud accounts (no auth)", `${API_BASE}/api/cloud/accounts`, "GET", 401);
  await testEndpoint("AWS instances (no auth)", `${API_BASE}/api/cloud/aws-instances`, "GET", 401);
  await testEndpoint("Full inventory (no auth)", `${API_BASE}/api/cloud/aws-full-inventory`, "GET", 401);
  await testEndpoint("Autoscaler analyze (no auth)", `${API_BASE}/api/autoscaler/analyze`, "POST", 401);
  
  // Print summary
  console.log("\n" + "=".repeat(51));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${tests.passed}`);
  console.log(`   ❌ Failed: ${tests.failed}`);
  console.log(`   📈 Total:  ${tests.passed + tests.failed}`);
  
  const passRate = ((tests.passed / (tests.passed + tests.failed)) * 100).toFixed(1);
  console.log(`   🎯 Pass Rate: ${passRate}%\n`);
  
  if (tests.failed === 0) {
    console.log("🎉 ALL TESTS PASSED!\n");
    process.exit(0);
  } else {
    console.log("⚠️  Some tests failed\n");
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error("Test runner error:", e);
  process.exit(1);
});
