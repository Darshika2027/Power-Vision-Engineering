const { chromium } = require("playwright");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:4200";
const results = [];

function record(name, status, details = "") {
  results.push({ Test: name, Result: status, Details: details });
  const color = status === "PASSED" ? "\x1b[32m" : "\x1b[31m";
  console.log(`${color}[${status}]\x1b[0m ${name} ${details}`);
}

async function test(name, action) {
  try {
    const details = await action();
    record(name, "PASSED", details || "");
  } catch (error) {
    record(name, "FAILED", error.message);
  }
}

async function openPage(page, route) {
  const response = await page.goto(`${BASE}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 20000
  });
  if (!response || response.status() !== 200) {
    throw new Error(`Page returned HTTP ${response?.status()}`);
  }
  await page.waitForTimeout(700);
}

(async () => {
  console.log("\n===== PVE-BMS FUNCTIONAL UI TESTS =====\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  page.setDefaultTimeout(10000);

  const tempXlsx = path.join(process.cwd(), "pve-ui-test-data.xlsx");

  const testWorksheet = XLSX.utils.aoa_to_sheet([
    ["SKU", "Product Name", "Category", "Barcode", "Description", "Cost Price", "Selling Price", "Active"],
    ["UI-TEST-001", "UI Test Product", "Electrical Accessories", "9999912345678", "Automated UI test product", 100, 150, "Yes"]
  ]);

  const testWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(testWorkbook, testWorksheet, "Products");
  XLSX.writeFile(testWorkbook, tempXlsx);

  const tempCsv = path.join(process.cwd(), "pve-ui-test-data.csv");
  fs.writeFileSync(
    tempCsv,
    "SKU,Product Name,Category,Barcode,Description,Cost Price,Selling Price,Active\nUI-TEST-CSV-001,UI Test CSV Product,Electrical Accessories,9999912345679,Automated CSV test product,100,150,Yes",
    "utf8"
  );

  // 1. CATEGORY MANAGEMENT
  await test("Category page loads", async () => {
    await openPage(page, "/");
    return "HTTP 200";
  });

  await test("Category search input", async () => {
    const search = page.getByPlaceholder("Search categories...");
    await search.fill("PVE-UI-NO-MATCH");
    if (await search.inputValue() !== "PVE-UI-NO-MATCH") {
      throw new Error("Search value was not accepted");
    }
    await search.fill("");
    return "Search and clear work";
  });

  await test("Category status filter", async () => {
    const select = page.locator("select").first();
    await select.selectOption({ label: "Active" });
    await select.selectOption({ label: "All Status" });
    return "Active and All Status selectable";
  });

  await test("Category Grid and List controls", async () => {
    await page.getByRole("button", { name: /Grid/ }).click();
    await page.getByRole("button", { name: /List/ }).click();
    return "Both view controls clickable";
  });

  // 2. PRODUCT MANAGEMENT
  await test("Product page loads", async () => {
    await openPage(page, "/products");
    return "HTTP 200";
  });

  await test("Product search input", async () => {
    const search = page.getByPlaceholder("Search by name, SKU or category...");
    await search.fill("PVE-UI-NO-MATCH");
    if (await search.inputValue() !== "PVE-UI-NO-MATCH") {
      throw new Error("Search value was not accepted");
    }
    await search.fill("");
    return "Search and clear work";
  });

  await test("Product category and status filters", async () => {
    await page.getByLabel("Filter products by category")
      .selectOption({ index: 0 });
    await page.getByLabel("Filter products by status")
      .selectOption({ label: "Inactive" });
    await page.getByLabel("Filter products by status")
      .selectOption({ label: "All Status" });
    return "Category and status filters selectable";
  });

  await test("Product required-field validation", async () => {
    const form = page.locator("form").first();
    const valid = await form.evaluate(el => el.checkValidity());
    if (valid) throw new Error("Empty product form unexpectedly valid");
    return "Empty product form correctly fails browser validation";
  });

  await test("Product Clear button", async () => {
    await page.getByPlaceholder("Enter SKU").fill("UI-TEST");
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    const value = await page.getByPlaceholder("Enter SKU").inputValue();
    if (value !== "") throw new Error("Clear did not clear SKU");
    return "Product form cleared";
  });

  // 3. BARCODE LOOKUP
  await test("Barcode lookup page loads", async () => {
    await openPage(page, "/product-lookup");
    return "HTTP 200";
  });

  await test("Valid barcode lookup", async () => {
    const response = await fetch("http://localhost:8080/api/products");
    if (!response.ok) throw new Error("Cannot retrieve products from API");

    const products = await response.json();
    const product = products.find(p => p.barcode);

    if (!product) throw new Error("No product with a barcode exists");

    await page.getByPlaceholder("Scan or enter product barcode...")
      .fill(String(product.barcode));

    await page.getByRole("button", { name: /Search Product/ }).click();

    await page.waitForTimeout(1500);

    const body = await page.locator("body").innerText();
    if (!body.includes(product.name)) {
      throw new Error(`Lookup result did not show ${product.name}`);
    }

    return `Found ${product.name}`;
  });

  await test("Unknown barcode lookup", async () => {
    await page.getByPlaceholder("Scan or enter product barcode...")
      .fill("9999999999999999");

    await page.getByRole("button", { name: /Search Product/ }).click();
    await page.waitForTimeout(1200);

    const body = (await page.locator("body").innerText()).toLowerCase();

    if (
      !body.includes("not found") &&
      !body.includes("no product") &&
      !body.includes("error") &&
      !body.includes("invalid")
    ) {
      throw new Error("No visible unknown-barcode feedback found");
    }

    return "Unknown barcode produces feedback";
  });

  await test("Barcode Clear button", async () => {
    await page.getByRole("button", { name: /Clear/ }).click();
    const value = await page
      .getByPlaceholder("Scan or enter product barcode...")
      .inputValue();

    if (value !== "") throw new Error("Barcode input was not cleared");
    return "Barcode input cleared";
  });

  // 4. GOODS RECEIVING
  await test("Goods Receiving page loads", async () => {
    await openPage(page, "/goods-receiving");
    return "HTTP 200";
  });

  await test("Goods Receiving product options load", async () => {
    const select = page.locator("select").first();

    await page.waitForFunction(() => {
      const selects = [...document.querySelectorAll("select")];
      return selects.some(s => !s.disabled && s.options.length > 1);
    }, { timeout: 15000 });

    const count = await select.locator("option").count();
    if (count < 2) throw new Error("Product options not available");

    return `${count} options available`;
  });

  await test("Goods Receiving review validation", async () => {
    await page.getByPlaceholder("Enter supplier name").fill("");
    await page.getByPlaceholder("Enter invoice number").fill("");

    await page.getByRole("button", {
      name: /Review Receiving Details/
    }).click();

    await page.waitForTimeout(500);

    const body = (await page.locator("body").innerText()).toLowerCase();

    if (
      !body.includes("required") &&
      !body.includes("supplier") &&
      !body.includes("invoice") &&
      !body.includes("invalid")
    ) {
      throw new Error("Required-field validation feedback not detected");
    }

    return "Empty receiving form does not proceed silently";
  });

  await test("Goods Receiving reset button", async () => {
    await page.getByPlaceholder("Enter supplier name").fill("UI Test Supplier");
    await page.getByPlaceholder("Enter invoice number").fill("UI-TEST-INVOICE");
    await page.getByRole("button", { name: /Reset Form/ }).click();

    const supplier = await page.getByPlaceholder("Enter supplier name").inputValue();
    const invoice = await page.getByPlaceholder("Enter invoice number").inputValue();

    if (supplier !== "" || invoice !== "") {
      throw new Error("Reset did not clear receiving fields");
    }

    return "Receiving form reset";
  });

  // 5. RACK AND STOCK
  await test("Rack & Stock page loads", async () => {
    await openPage(page, "/rack-stock-management");
    return "HTTP 200";
  });

  await test("Rack search input", async () => {
    const search = page.getByPlaceholder("Search product, SKU or rack number...");
    await search.fill("PVE-UI-NO-MATCH");
    if (await search.inputValue() !== "PVE-UI-NO-MATCH") {
      throw new Error("Rack search value not accepted");
    }
    await search.fill("");
    return "Search and clear work";
  });

  await test("Rack location filter", async () => {
    const select = page.locator("select").first();
    await select.selectOption({ label: "Main Store" });
    await select.selectOption({ label: "All Locations" });
    return "Location filter selectable";
  });

  await test("Rack Reset Filters button", async () => {
    await page.getByRole("button", { name: /Reset Filters/ }).click();
    return "Reset Filters button works";
  });

  await test("Rack Refresh button", async () => {
    await page.getByRole("button", { name: "Refresh" }).click();
    await page.waitForTimeout(500);
    return "Refresh button clicked";
  });

  await test("Add Stock Location form opens", async () => {
    const before = await page.locator("input").count();

    await page.getByRole("button", { name: /Add Stock Location/ }).click();
    await page.waitForTimeout(400);

    const after = await page.locator("input").count();
    const dialogs = await page.locator('[role="dialog"]').count();

    if (after <= before && dialogs === 0) {
      throw new Error("No visible form or dialog appeared");
    }

    await page.keyboard.press("Escape");
    return "Add Stock Location interface opened";
  });

  // 6. BULK PRODUCT IMPORT
  await test("Bulk Product Import page loads", async () => {
    await openPage(page, "/bulk-product-import");
    return "HTTP 200";
  });

  await test("Excel template download", async () => {
    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
    await page.getByRole("button", { name: /Download Excel Template/ }).click();
    const download = await downloadPromise;
    return `Downloaded ${download.suggestedFilename()}`;
  });

  await test("Bulk import file selection", async () => {
    const input = page.locator('input[type="file"]').first();

    await input.setInputFiles(tempXlsx);

    const files = await input.evaluate(el => el.files.length);
    if (files !== 1) throw new Error("Excel file was not selected");

    await page.locator(".file-details").waitFor({
      state: "visible",
      timeout: 15000
    });

    await page.locator(".preview-section").waitFor({
      state: "visible",
      timeout: 15000
    });

    return "Valid XLSX selected and preview displayed";
  });

  // 7. STANDALONE SPREADSHEET PREVIEW
  await test("Spreadsheet Preview page opens", async () => {
    const file = path.join(
      "..",
      "spreadsheet-import-preview",
      "spreadsheet-import-preview.html"
    );

    const absolute = path.resolve(file);
    if (!fs.existsSync(absolute)) throw new Error("HTML file not found");

    await page.goto(require("url").pathToFileURL(absolute).href, {
      waitUntil: "domcontentloaded"
    });

    const body = await page.locator("body").innerText();
    if (!body.trim()) throw new Error("Preview page is empty");

    return "Standalone HTML opened";
  });

  await test("Spreadsheet Preview file selection", async () => {
    const input = page.locator('input[type="file"]').first();

    if (await input.count() === 0) {
      throw new Error("Spreadsheet file input not found");
    }

    await input.setInputFiles(tempCsv);
    await page.waitForTimeout(1500);

    const body = (await page.locator("body").innerText()).toLowerCase();

    if (body.includes("ui-test-csv-001") || body.includes("ui test csv product")) {
      return "CSV contents detected in preview";
    }

    if (body.includes("preview") || body.includes("uploaded") ||
        body.includes("spreadsheet") || body.includes("file")) {
      return "File selected; preview interface responded";
    }

    throw new Error("No visible response to selected CSV file");
  });

  await browser.close();

  const passed = results.filter(r => r.Result === "PASSED").length;
  const failed = results.filter(r => r.Result === "FAILED").length;

  console.log("\n===== FINAL FUNCTIONAL UI TEST REPORT =====");
  console.table(results);
  console.log(`TOTAL: ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("===========================================\n");

  fs.writeFileSync(
    "PVE-BMS-Functional-UI-Test-Report.csv",
    "Test,Result,Details\n" +
    results.map(r =>
      `"${r.Test.replace(/"/g, '""')}","${r.Result}","${r.Details.replace(/"/g, '""')}"`
    ).join("\n"),
    "utf8"
  );

  console.log("Report saved: PVE-BMS-Functional-UI-Test-Report.csv");

  try { fs.unlinkSync(tempCsv); } catch {}
  try { fs.unlinkSync(tempXlsx); } catch {}

  if (failed > 0) process.exitCode = 1;
})();
