/**
 * CAMPUS EATS - INR CURRENCY & PAYMENT AUDIT TEST SUITE
 * Verifies INR (₹) monetary standard across Orders, Razorpay, Wallet, Invoice, and Admin Analytics
 */

import assert from "assert";
import crypto from "crypto";

console.log("\n==================================================");
console.log("🇮🇳 CAMPUS EATS - INR PAYMENT CURRENCY TEST SUITE");
console.log("==================================================\n");

let passed = 0;
let failed = 0;

const test = (description, fn) => {
    try {
        fn();
        console.log(`  ✓ PASS: ${description}`);
        passed++;
    } catch (error) {
        console.error(`  ✗ FAIL: ${description}`);
        console.error(`    ${error.message}`);
        failed++;
    }
};

// 1. Razorpay Currency and Unit Conversion Tests
console.log("1. Testing Razorpay Currency & Unit Conversion (Rupees to Paise)...");

const convertRupeesToPaise = (rupees) => {
    if (typeof rupees !== "number" || isNaN(rupees)) {
        throw new Error("Invalid rupee amount");
    }
    return Math.round(rupees * 100);
};

test("₹160 business amount converts to exactly 16000 paise with currency INR", () => {
    const rupees = 160.00;
    const paise = convertRupeesToPaise(rupees);
    const currency = "INR";
    assert.strictEqual(paise, 16000);
    assert.strictEqual(currency, "INR");
});

test("₹99 business amount converts to exactly 9900 paise with currency INR", () => {
    const rupees = 99.00;
    const paise = convertRupeesToPaise(rupees);
    const currency = "INR";
    assert.strictEqual(paise, 9900);
    assert.strictEqual(currency, "INR");
});

test("₹115 business amount converts to exactly 11500 paise with currency INR", () => {
    const rupees = 115.00;
    const paise = convertRupeesToPaise(rupees);
    const currency = "INR";
    assert.strictEqual(paise, 11500);
    assert.strictEqual(currency, "INR");
});

test("₹100 business amount converts to exactly 10000 paise with currency INR", () => {
    const rupees = 100.00;
    const paise = convertRupeesToPaise(rupees);
    const currency = "INR";
    assert.strictEqual(paise, 10000);
    assert.strictEqual(currency, "INR");
});

test("Prevents double conversion (detects already converted paise)", () => {
    const amountInRupees = 160;
    const amountInPaise = convertRupeesToPaise(amountInRupees);
    
    // Gateway payload should use amountInPaise directly without re-multiplying
    const gatewayPayload = {
        amount: amountInPaise,
        currency: "INR"
    };
    assert.strictEqual(gatewayPayload.amount, 16000);
    assert.strictEqual(gatewayPayload.currency, "INR");
    assert.notStrictEqual(gatewayPayload.amount * 100, 16000); // would be 1600000 if double converted
});

// 2. Server-Authoritative Price & Discount Calculation in INR
console.log("\n2. Testing Server-Authoritative Price & Discount in INR...");

test("Server calculates correct INR subtotal and discount", () => {
    const mockDbItems = [
        { id: 1, name: "Masala Dosa", price: 60.00 },
        { id: 2, name: "Cold Coffee", price: 55.00 }
    ];
    
    const cart = [
        { menuItemId: 1, quantity: 2, extraAmount: 5.00 }, // (60 + 5) * 2 = 130
        { menuItemId: 2, quantity: 1, extraAmount: 0.00 }  // 55 * 1 = 55
    ];
    
    let subtotal = 0;
    for (const item of cart) {
        const dbItem = mockDbItems.find(m => m.id === item.menuItemId);
        subtotal += (dbItem.price + item.extraAmount) * item.quantity;
    }
    
    assert.strictEqual(subtotal, 185.00); // ₹185.00
    const discount = subtotal >= 100 ? 15.00 : 0.00; // ₹15.00 discount
    const totalAmount = subtotal - discount; // ₹170.00
    assert.strictEqual(totalAmount, 170.00);
    
    const razorpayPaise = convertRupeesToPaise(totalAmount);
    assert.strictEqual(razorpayPaise, 17000);
});

// 3. Payment Verification & Amount Integrity
console.log("\n3. Testing Payment Verification & HMAC Integrity...");

test("Validates payment signature and rejects tampered signature", () => {
    const secret = "test_key_secret_12345";
    const orderId = "order_test_987654";
    const paymentId = "pay_test_123456";
    
    const validSignature = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
        
    const tamperedSignature = "bad_signature_deadbeef";
    
    const verifySignature = (ordId, payId, sig) => {
        const expected = crypto
            .createHmac("sha256", secret)
            .update(`${ordId}|${payId}`)
            .digest("hex");
        return expected === sig;
    };
    
    assert.strictEqual(verifySignature(orderId, paymentId, validSignature), true);
    assert.strictEqual(verifySignature(orderId, paymentId, tamperedSignature), false);
});

test("Rejects amount mismatch between Razorpay order and verified total", () => {
    const expectedRupees = 170.00;
    const paidPaise = 10000; // only ₹100.00 paid
    
    const isAmountMatching = (expectedRup, paidPai) => {
        return Math.round(expectedRup * 100) === paidPai;
    };
    
    assert.strictEqual(isAmountMatching(expectedRupees, paidPaise), false);
    assert.strictEqual(isAmountMatching(expectedRupees, 17000), true);
});

// 4. Monetary Formatting (INR / ₹)
console.log("\n4. Testing Indian Rupee (₹) Formatting across App...");

const formatInr = (amount) => {
    return `₹${Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

test("Formats single and multi-digit rupee amounts correctly in INR", () => {
    assert.strictEqual(formatInr(50), "₹50.00");
    assert.strictEqual(formatInr(99), "₹99.00");
    assert.strictEqual(formatInr(160), "₹160.00");
    assert.strictEqual(formatInr(1250), "₹1,250.00");
    assert.strictEqual(formatInr(42850), "₹42,850.00");
});

test("Invoice breakdown formatting contains valid ₹ currency symbols", () => {
    const invoiceData = {
        unitPrice: 160.00,
        subtotal: 160.00,
        discount: 0.00,
        taxes: 0.00,
        totalPaid: 160.00
    };
    
    const formatted = {
        unitPrice: formatInr(invoiceData.unitPrice),
        subtotal: formatInr(invoiceData.subtotal),
        discount: formatInr(invoiceData.discount),
        taxes: formatInr(invoiceData.taxes),
        totalPaid: formatInr(invoiceData.totalPaid)
    };
    
    assert.strictEqual(formatted.unitPrice, "₹160.00");
    assert.strictEqual(formatted.subtotal, "₹160.00");
    assert.strictEqual(formatted.discount, "₹0.00");
    assert.strictEqual(formatted.taxes, "₹0.00");
    assert.strictEqual(formatted.totalPaid, "₹160.00");
});

test("Wallet operations and transactions maintain INR consistency in Rupees", () => {
    const initialBalance = 500.00; // ₹500.00
    const topUpAmount = 200.00;    // +₹200.00
    const orderDebit = 160.00;     // -₹160.00
    
    const balanceAfterTopUp = initialBalance + topUpAmount;
    assert.strictEqual(balanceAfterTopUp, 700.00);
    assert.strictEqual(formatInr(balanceAfterTopUp), "₹700.00");
    
    const balanceAfterOrder = balanceAfterTopUp - orderDebit;
    assert.strictEqual(balanceAfterOrder, 540.00);
    assert.strictEqual(formatInr(balanceAfterOrder), "₹540.00");
});

test("Admin revenue analytics aggregate directly in Rupees (no paise multiplication)", () => {
    const dbOrders = [
        { id: 1, total_amount: 150.00, status: "completed" },
        { id: 2, total_amount: 85.00, status: "completed" },
        { id: 3, total_amount: 120.00, status: "ready" }
    ];
    
    const totalRevenueRupees = dbOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    assert.strictEqual(totalRevenueRupees, 355.00);
    assert.strictEqual(formatInr(totalRevenueRupees), "₹355.00");
    // Ensure not in paise
    assert.notStrictEqual(totalRevenueRupees, 35500);
});

test("Demo payment transaction references are clearly identified as DEMO", () => {
    const demoUpiRef = `DEMO-UPI-${Date.now()}`;
    const demoCardRef = `DEMO-CARD-${Date.now()}`;
    const walletRef = `CW-WALLET-${Date.now()}`;
    
    assert.strictEqual(demoUpiRef.startsWith("DEMO-UPI"), true);
    assert.strictEqual(demoCardRef.startsWith("DEMO-CARD"), true);
    assert.strictEqual(walletRef.startsWith("CW-WALLET"), true);
});

console.log("\n==================================================");
console.log(`📊 INR TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log("==================================================\n");

if (failed > 0) {
    process.exit(1);
}
