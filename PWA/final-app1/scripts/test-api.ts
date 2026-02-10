/**
 * API テストスクリプト
 * 
 * 使用方法:
 * npx ts-node scripts/test-api.ts
 * または
 * npm run test:api
 */

const BASE_URL = "http://localhost:3000";

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  status: "PASS" | "FAIL";
  statusCode?: number;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<TestResult> {
  const startTime = Date.now();
  const method = options.method || "GET";

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    const result: TestResult = {
      name,
      endpoint,
      method,
      status: response.ok && data.success !== false ? "PASS" : "FAIL",
      statusCode: response.status,
      duration,
      error: data.success === false ? data.error : undefined,
    };

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name,
      endpoint,
      method,
      status: "FAIL",
      duration,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("API テスト開始");
  console.log("=".repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`開始時刻: ${new Date().toISOString()}`);
  console.log("");

  // 1. 商品API テスト
  console.log("📦 商品API テスト");
  console.log("-".repeat(40));

  results.push(
    await testEndpoint("商品一覧取得", "/api/products")
  );

  results.push(
    await testEndpoint("商品一覧（グループ化）", "/api/products?grouped=true")
  );

  results.push(
    await testEndpoint("商品検索", "/api/products?search=ポロシャツ")
  );

  results.push(
    await testEndpoint("JAN検索（存在しないコード）", "/api/products/0000000000000")
  );

  // 2. 在庫API テスト
  console.log("\n📊 在庫API テスト");
  console.log("-".repeat(40));

  results.push(
    await testEndpoint("在庫一覧取得", "/api/stock")
  );

  // 3. 注文API テスト
  console.log("\n🛒 注文API テスト");
  console.log("-".repeat(40));

  results.push(
    await testEndpoint("注文一覧取得", "/api/orders")
  );

  results.push(
    await testEndpoint("注文詳細取得（ID: 1001）", "/api/orders/1001")
  );

  // 4. ダッシュボードAPI テスト
  console.log("\n📈 ダッシュボードAPI テスト");
  console.log("-".repeat(40));

  results.push(
    await testEndpoint("ダッシュボードデータ", "/api/dashboard")
  );

  // 5. CSV API テスト
  console.log("\n📁 CSV API テスト");
  console.log("-".repeat(40));

  results.push(
    await testEndpoint("CSVテンプレートダウンロード", "/api/csv/download?type=template")
  );

  results.push(
    await testEndpoint("CSV現在データダウンロード", "/api/csv/download?type=data")
  );

  // 6. 接続テストAPI
  console.log("\n🔗 接続テストAPI");
  console.log("-".repeat(40));

  results.push(
    await testEndpoint("Spreadsheet接続テスト", "/api/test-sheets")
  );

  // 結果表示
  console.log("\n");
  console.log("=".repeat(60));
  console.log("テスト結果サマリー");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const total = results.length;

  console.log(`\n合計: ${total} テスト | ✅ PASS: ${passed} | ❌ FAIL: ${failed}`);
  console.log("");

  // 詳細結果
  results.forEach((r, index) => {
    const statusIcon = r.status === "PASS" ? "✅" : "❌";
    const statusText = r.status === "PASS" ? "PASS" : "FAIL";
    console.log(
      `${index + 1}. ${statusIcon} [${statusText}] ${r.name}`
    );
    console.log(`   ${r.method} ${r.endpoint}`);
    console.log(`   Status: ${r.statusCode || "N/A"} | Duration: ${r.duration}ms`);
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
    console.log("");
  });

  // 成功率
  const successRate = ((passed / total) * 100).toFixed(1);
  console.log("=".repeat(60));
  console.log(`成功率: ${successRate}%`);
  console.log(`終了時刻: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  return { passed, failed, total, successRate };
}

// 実行
runTests().then((summary) => {
  process.exit(summary.failed > 0 ? 1 : 0);
});
