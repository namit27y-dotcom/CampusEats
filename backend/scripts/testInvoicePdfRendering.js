import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { fileURLToPath } from "url";
import { formatINR } from "../src/controllers/invoiceController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function testPdfRendering() {
    console.log("\n==================================================");
    console.log("📄 CAMPUS EATS - PDF INVOICE & RUPEE RENDERING TEST");
    console.log("==================================================\n");

    // 1. Test Currency Formatter
    console.log(`${YELLOW}1. Testing formatINR helper with ₹ symbol & Indian formatting...${RESET}`);
    assert(formatINR(150) === "₹150.00", "Item price ₹150 formats to '₹150.00'");
    assert(formatINR(60) === "₹60.00", "Item price ₹60 formats to '₹60.00'");
    assert(formatINR(120) === "₹120.00", "Item price ₹120 formats to '₹120.00'");
    assert(formatINR(-15) === "-₹15.00", "Discount -₹15 formats to '-₹15.00'");
    assert(formatINR(1115) === "₹1,115.00", "Total Paid Amount ₹1,115 formats to '₹1,115.00'");

    // 2. Test Font Files Existence
    console.log(`\n${YELLOW}2. Verifying Unicode Noto Sans Font Files...${RESET}`);
    const fontRegularPath = path.resolve(__dirname, "../src/assets/fonts/NotoSans-Regular.ttf");
    const fontBoldPath = path.resolve(__dirname, "../src/assets/fonts/NotoSans-Bold.ttf");

    assert(fs.existsSync(fontRegularPath), `NotoSans-Regular.ttf exists (${fs.statSync(fontRegularPath).size} bytes)`);
    assert(fs.existsSync(fontBoldPath), `NotoSans-Bold.ttf exists (${fs.statSync(fontBoldPath).size} bytes)`);

    // 3. Generate Complete Test Invoice PDF with specific user values
    console.log(`\n${YELLOW}3. Generating Complete Test PDF Invoice (Token T286036)...${RESET}`);
    const testOrder = {
        id: 42,
        token_number: "T286036",
        student_name: "Test Student",
        student_email: "student@campuseats.com",
        canteen_name: "PCE Main Canteen",
        canteen_location: "Campus Main Ground Floor",
        payment_method: "wallet",
        payment_status: "paid",
        payment_transaction_id: "CW-WALLET-1789899286036",
        status: "ready",
        created_at: new Date().toISOString(),
        total_amount: 1115.00
    };

    const testItems = [
        { name: "Special Campus Thali", quantity: 3, price: 150.00, customization: "Extra Roti • Less Spicy" },
        { name: "Cold Coffee Shake", quantity: 5, price: 60.00, customization: null },
        { name: "Paneer Tikka Roll", quantity: 3, price: 120.00, customization: "Extra Green Chutney" },
        { name: "Snack Combo Pack", quantity: 2, price: 85.00, customization: null }
    ];

    const safeVerificationUrl = `https://campus-eats-ruby.vercel.app/verify?orderId=${testOrder.id}&token=${testOrder.token_number}`;
    const qrCodeBuffer = await QRCode.toBuffer(safeVerificationUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 100
    });

    const outputPath = path.resolve(__dirname, "test_output_invoice.pdf");
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    doc.registerFont("NotoSans", fontRegularPath);
    doc.registerFont("NotoSans-Bold", fontBoldPath);

    const fontRegular = "NotoSans";
    const fontBold = "NotoSans-Bold";

    // Header section: Official CampusEats Brand Logo (Squircle + Crossed Utensils + Wordmark)
    doc.save();
    // Squircle background
    doc.roundedRect(40, 36, 36, 36, 8).fill("#f97316");
    // UtensilsCrossed icon inside
    doc.save();
    doc.translate(46, 42).scale(1);
    doc.strokeColor("#ffffff").lineWidth(2).lineCap("round").lineJoin("round");
    doc.path("m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8").stroke();
    doc.path("M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7").stroke();
    doc.path("m2.1 21.8 6.4-6.3").stroke();
    doc.path("m19 5-7 7").stroke();
    doc.restore();
    doc.restore();

    // CampusEats Two-tone Wordmark & Subtitle
    doc.font(fontBold).fontSize(22);
    doc.fillColor("#18181b").text("Campus", 86, 38, { continued: true });
    doc.fillColor("#f97316").text("Eats");

    doc.font(fontRegular).fontSize(9.5).fillColor("#71717a");
    doc.text("Smart Campus Pre-Order & Digital Token System", 86, 62);
    doc.text(`Canteen: ${testOrder.canteen_name} (${testOrder.canteen_location || "Campus"})`, 40, 86);

    // QR Code in Top Right
    doc.image(qrCodeBuffer, 460, 35, { width: 85, height: 85 });
    doc.fillColor("#71717a").fontSize(8).font(fontRegular).text("Scan to Verify Token", 460, 125, { width: 85, align: "center" });

    // Divider
    doc.strokeColor("#e4e4e7").lineWidth(1).moveTo(40, 140).lineTo(555, 140).stroke();

    // Order & Customer Metadata Grid
    const formattedDate = new Date(testOrder.created_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    doc.fillColor("#18181b").fontSize(11).font(fontBold).text("DIGITAL TOKEN / INVOICE RECEIPT", 40, 155);

    doc.font(fontRegular).fontSize(9).fillColor("#52525b");
    doc.text(`Token Number:`, 40, 175);
    doc.font(fontBold).fillColor("#ea580c").fontSize(13).text(`${testOrder.token_number}`, 120, 172);

    doc.font(fontRegular).fontSize(9).fillColor("#52525b");
    doc.text(`Order ID: #${testOrder.id}`, 40, 192);
    doc.text(`Date & Time: ${formattedDate}`, 40, 206);
    doc.text(`Student: ${testOrder.student_name} (${testOrder.student_email})`, 40, 220);

    doc.text(`Payment Method: ${String(testOrder.payment_method).toUpperCase()}`, 320, 175);
    doc.text(`Payment Status: ${String(testOrder.payment_status).toUpperCase()}`, 320, 192);
    doc.text(`Txn Ref: ${testOrder.payment_transaction_id || "N/A"}`, 320, 206);
    doc.text(`Order Status: ${String(testOrder.status).toUpperCase()}`, 320, 220);

    // Table Header
    let yPos = 245;
    doc.rect(40, yPos, 515, 22).fill("#f4f4f5");
    doc.fillColor("#18181b").fontSize(9).font(fontBold);
    doc.text("ITEM DESCRIPTION", 50, yPos + 6);
    doc.text("QTY", 320, yPos + 6, { width: 40, align: "center" });
    doc.text("UNIT PRICE", 380, yPos + 6, { width: 60, align: "right" });
    doc.text("TOTAL", 460, yPos + 6, { width: 85, align: "right" });

    yPos += 26;

    // Items rows
    let subtotal = 0;
    doc.font(fontRegular).fontSize(9).fillColor("#27272a");

    for (const item of testItems) {
        const itemPrice = Number(item.price);
        const qty = Number(item.quantity);
        const lineTotal = itemPrice * qty;
        subtotal += lineTotal;

        doc.font(fontBold).text(item.name, 50, yPos);
        doc.font(fontRegular).text(String(qty), 320, yPos, { width: 40, align: "center" });
        doc.text(formatINR(itemPrice), 380, yPos, { width: 60, align: "right" });
        doc.font(fontBold).text(formatINR(lineTotal), 460, yPos, { width: 85, align: "right" });

        if (item.customization) {
            yPos += 13;
            doc.font(fontRegular).fontSize(8).fillColor("#71717a").text(`Customization: ${item.customization}`, 58, yPos);
            doc.font(fontRegular).fontSize(9).fillColor("#27272a");
        }

        yPos += 18;
        doc.strokeColor("#f4f4f5").lineWidth(0.5).moveTo(40, yPos).lineTo(555, yPos).stroke();
        yPos += 6;
    }

    // Summary Calculations
    const finalTotal = Number(testOrder.total_amount);
    const discount = Math.max(0, subtotal - finalTotal);
    const taxes = 0;

    yPos += 10;
    doc.strokeColor("#e4e4e7").lineWidth(1).moveTo(300, yPos).lineTo(555, yPos).stroke();
    yPos += 8;

    doc.font(fontRegular).fontSize(9).fillColor("#52525b");
    doc.text("Subtotal:", 320, yPos);
    doc.text(formatINR(subtotal), 460, yPos, { width: 85, align: "right" });

    if (discount > 0) {
        yPos += 15;
        doc.text("Special Discount:", 320, yPos);
        doc.fillColor("#16a34a").text(`-${formatINR(discount)}`, 460, yPos, { width: 85, align: "right" });
        doc.fillColor("#52525b");
    }

    yPos += 15;
    doc.text("Taxes & Fees:", 320, yPos);
    doc.text(formatINR(taxes), 460, yPos, { width: 85, align: "right" });

    yPos += 18;
    doc.rect(300, yPos - 4, 255, 24).fill("#fff7ed");
    doc.font(fontBold).fontSize(11).fillColor("#ea580c");
    doc.text("Total Paid Amount:", 310, yPos + 3);
    doc.text(formatINR(finalTotal), 460, yPos + 3, { width: 85, align: "right" });

    // Footer note
    doc.font(fontRegular).fontSize(8).fillColor("#a1a1aa");
    doc.text(
        "This is a computer-generated digital receipt and digital token issued by CampusEats.\nPresent your token number at the pickup counter once the kitchen marks your order ready.",
        40,
        720,
        { align: "center", width: 515 }
    );

    doc.end();

    await new Promise((resolve) => writeStream.on("finish", resolve));

    assert(fs.existsSync(outputPath), `PDF file created at ${outputPath}`);
    const pdfSize = fs.statSync(outputPath).size;
    assert(pdfSize > 10000, `PDF size is valid (${pdfSize} bytes)`);

    console.log("\n==================================================");
    console.log(`📊 PDF INVOICE TEST RESULTS: ${passCount} Passed, ${failCount} Failed`);
    console.log("==================================================\n");

    if (failCount > 0) {
        process.exit(1);
    }
}

testPdfRendering()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("PDF test error:", err);
        process.exit(1);
    });
