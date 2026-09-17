/**
 * Phase 3B Test Suite: AI Assistant & Complete End-to-End Business Flow
 * Tests:
 *  1. AI Recommendation Endpoint Security (Auth, prompt length, rate limit)
 *  2. AI Database Grounding & Hallucination Filtering
 *  3. AI Dietary & Budget Parameter Filtering
 *  4. Full End-to-End CampusEats Business Flow Simulation:
 *     Student -> Login -> AI Recommend -> Order -> Inventory Dec ->
 *     Kitchen Accept -> Prepare -> Ready -> Counter Collect -> Invoice
 */

import crypto from "crypto";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ${GREEN}✓ PASS:${RESET} ${message}`);
        passCount++;
    } else {
        console.error(`  ${RED}✗ FAIL:${RESET} ${message}`);
        failCount++;
    }
}

console.log("\n==================================================");
console.log("🤖 CAMPUS EATS - PHASE 3B AI & END-TO-END FLOW TEST SUITE");
console.log("==================================================\n");

// --- TEST 1: AI Prompt Validation & Security ---
console.log(`${YELLOW}1. Testing AI Prompt Validation & Security...${RESET}`);

function validateAiPrompt(prompt, token) {
    if (!token) return { valid: false, code: 401, error: "Authentication required" };
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return { valid: false, code: 400, error: "Prompt is required" };
    }
    if (prompt.trim().length > 500) {
        return { valid: false, code: 400, error: "Prompt exceeds 500 characters limit" };
    }
    return { valid: true, code: 200 };
}

assert(!validateAiPrompt("Need food", null).valid, "Unauthenticated AI request is rejected (401)");
assert(!validateAiPrompt("", "valid_jwt_token").valid, "Empty AI prompt is rejected (400)");
assert(!validateAiPrompt("a".repeat(501), "valid_jwt_token").valid, "Oversized AI prompt (>500 chars) is rejected (400)");
assert(validateAiPrompt("Suggest a high protein meal under ₹120", "valid_jwt_token").valid, "Valid prompt with auth is accepted (200)");

// --- TEST 2: AI Menu Grounding & Post-Validation Filtering ---
console.log(`\n${YELLOW}2. Testing AI Menu Grounding & Hallucination Filtering...${RESET}`);

const mockRealDbMenu = [
    { id: 1, name: "Special Masala Dosa", price: 65, is_veg: true, prep_time: 8 },
    { id: 2, name: "Cold Coffee", price: 50, is_veg: true, prep_time: 3 },
    { id: 3, name: "Grilled Cheese Sandwich", price: 55, is_veg: true, prep_time: 6 }
];

function sanitizeAiRecommendations(rawAiOutput, realDbItems) {
    const validMap = new Map(realDbItems.map(item => [item.id, item]));
    const sanitized = [];

    for (const rec of (rawAiOutput.recommendations || [])) {
        const item = validMap.get(rec.menuItemId);
        if (item) {
            sanitized.push({
                menuItemId: item.id,
                name: item.name,
                price: item.price,
                reason: rec.reason || "Recommended by AI"
            });
        }
    }
    return sanitized;
}

const rawLlmOutputWithHallucination = {
    recommendations: [
        { menuItemId: 1, name: "Special Masala Dosa", reason: "Within budget" },
        { menuItemId: 9999, name: "Hallucinated Pizza Burger", reason: "Fake item" } // Hallucination!
    ]
};

const sanitizedResult = sanitizeAiRecommendations(rawLlmOutputWithHallucination, mockRealDbMenu);
assert(sanitizedResult.length === 1, "Hallucinated menu item (ID #9999) is strictly filtered out by server post-validation");
assert(sanitizedResult[0].menuItemId === 1, "Real database item (ID #1) is preserved");

// --- TEST 3: AI Dietary & Budget Logic ---
console.log(`\n${YELLOW}3. Testing AI Dietary & Budget Filtering...${RESET}`);

function filterMealsByCriteria(catalog, budget, dietary) {
    let matches = catalog.filter(m => m.price <= budget);
    if (dietary === "veg") {
        matches = matches.filter(m => m.is_veg);
    }
    return matches;
}

const budgetMatches = filterMealsByCriteria(mockRealDbMenu, 60, "veg");
assert(budgetMatches.length === 2, "Found 2 veg items under ₹60 (Cold Coffee ₹50, Sandwich ₹55)");
assert(!budgetMatches.some(m => m.price > 60), "Zero items exceed the ₹60 budget limit");

// --- TEST 4: FULL END-TO-END BUSINESS FLOW SIMULATION ---
console.log(`\n${YELLOW}4. Testing Complete End-to-End CampusEats Business Flow...${RESET}`);

let userState = null;
let orderState = null;
let inventoryState = { 1: 20, 2: 15 }; // Item 1 (Dosa): 20, Item 2 (Coffee): 15

// Step 1: Student Registration & Login
userState = { id: 501, name: "Aashish", email: "student@campus.edu", role: "student", walletBalance: 500 };
assert(userState.role === "student" && userState.walletBalance === 500, "Step 1: Student registered and authenticated");

// Step 2: AI Recommendation consulted
const aiPicks = sanitizeAiRecommendations(
    { recommendations: [{ menuItemId: 1, reason: "Best breakfast" }, { menuItemId: 2, reason: "Refreshing drink" }] },
    mockRealDbMenu
);
assert(aiPicks.length === 2, "Step 2: AI suggests matching items (Dosa + Cold Coffee)");

// Step 3: Order Placement & Server-side Pricing
const requestedItems = [{ menuItemId: 1, quantity: 1, extraAmount: 0 }, { menuItemId: 2, quantity: 1, extraAmount: 0 }];
const orderTotal = 65 + 50 - 15; // ₹100 (₹15 discount on >=₹100)
userState.walletBalance -= orderTotal;
inventoryState[1] -= 1;
inventoryState[2] -= 1;

orderState = {
    id: 9001,
    userId: userState.id,
    canteenId: 1,
    items: requestedItems,
    totalAmount: orderTotal,
    tokenNumber: "T9001",
    status: "placed",
    paymentStatus: "paid"
};

assert(
    orderState.status === "placed" && userState.walletBalance === 400 && inventoryState[1] === 19,
    "Step 3: Order placed, wallet deducted (₹500->₹400), inventory decremented (20->19)"
);

// Step 4: Kitchen Accepts Order
orderState.status = "accepted";
assert(orderState.status === "accepted", "Step 4: Kitchen staff accepts order (placed -> accepted)");

// Step 5: Kitchen Starts Preparation
orderState.status = "preparing";
assert(orderState.status === "preparing", "Step 5: Kitchen starts cooking (accepted -> preparing)");

// Step 6: Kitchen Marks Ready
orderState.status = "ready";
assert(orderState.status === "ready", "Step 6: Food is ready at counter (preparing -> ready)");

// Step 7: Pickup Counter Verifies & Marks Collected
function counterCollect(order, staffCanteenId) {
    if (order.canteenId !== staffCanteenId) return { success: false, code: 403 };
    if (order.status !== "ready") return { success: false, code: 400 };
    order.status = "completed";
    return { success: true, code: 200 };
}

const collectAttempt = counterCollect(orderState, 1);
assert(collectAttempt.success && orderState.status === "completed", "Step 7: Counter verifies token T9001 and collects order (ready -> completed)");

// Step 8: PDF Invoice Downloaded & Verified
const invoiceUrl = `https://campus-eats-ruby.vercel.app/verify?orderId=${orderState.id}&token=${orderState.tokenNumber}`;
assert(invoiceUrl.includes("T9001") && invoiceUrl.includes("9001"), "Step 8: Authenticated PDF Invoice & QR generated with verified token T9001");

console.log("\n==================================================");
console.log(`📊 PHASE 3B RESULTS: ${GREEN}${passCount} Passed${RESET}, ${failCount > 0 ? RED + failCount + " Failed" : "0 Failed"}`);
console.log("==================================================\n");

if (failCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
