import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import pool from "../config/db.js";

/**
 * GET /api/orders/:id/invoice
 * Generates an itemized PDF invoice/receipt with safe verification QR
 */
export const getOrderInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // 1. Fetch order details
        const [orders] = await pool.query(
            `SELECT 
                o.id,
                o.user_id,
                u.name AS student_name,
                u.email AS student_email,
                o.canteen_id,
                c.name AS canteen_name,
                c.location AS canteen_location,
                o.total_amount,
                o.token_number,
                o.status,
                o.payment_method,
                o.payment_status,
                o.payment_transaction_id,
                o.created_at
             FROM orders o
             JOIN users u ON o.user_id = u.id
             JOIN canteens c ON o.canteen_id = c.id
             WHERE o.id = ?`,
            [id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orders[0];

        // 2. Authorization check: Student can only view own order; Staff/Admin can view
        const isOwner = Number(order.user_id) === Number(user.id);
        const isStaffOrAdmin = ["admin", "kitchen", "counter"].includes(String(user.role).toLowerCase());

        if (!isOwner && !isStaffOrAdmin) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You are not authorized to view this invoice."
            });
        }

        // 3. Fetch order items
        const [items] = await pool.query(
            `SELECT 
                oi.id,
                oi.menu_item_id,
                m.name,
                oi.quantity,
                oi.price,
                oi.customization,
                oi.extra_amount
             FROM order_items oi
             JOIN menu_items m ON oi.menu_item_id = m.id
             WHERE oi.order_id = ?`,
            [id]
        );

        // 4. Generate Safe QR Code (non-sensitive verification link)
        const safeVerificationUrl = `https://campus-eats-ruby.vercel.app/verify?orderId=${order.id}&token=${order.token_number}`;
        const qrCodeBuffer = await QRCode.toBuffer(safeVerificationUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 100
        });

        // 5. Create PDF Document
        const doc = new PDFDocument({ margin: 40, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename="CampusEats_Invoice_${order.token_number || order.id}.pdf"`
        );

        doc.pipe(res);

        // Header section
        doc.fillColor("#ea580c").fontSize(22).font("Helvetica-Bold").text("🍽️ CampusEats", 40, 40);
        doc.fillColor("#71717a").fontSize(10).font("Helvetica").text("Smart Campus Pre-Order & Digital Token System", 40, 68);
        doc.text(`Canteen: ${order.canteen_name} (${order.canteen_location || "Campus"})`, 40, 82);

        // QR Code in Top Right
        doc.image(qrCodeBuffer, 460, 35, { width: 85, height: 85 });
        doc.fillColor("#71717a").fontSize(8).text("Scan to Verify Token", 460, 125, { width: 85, align: "center" });

        // Divider
        doc.strokeColor("#e4e4e7").lineWidth(1).moveTo(40, 140).lineTo(555, 140).stroke();

        // Order & Customer Metadata Grid
        const formattedDate = new Date(order.created_at).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        doc.fillColor("#18181b").fontSize(11).font("Helvetica-Bold").text("DIGITAL TOKEN / INVOICE RECEIPT", 40, 155);

        doc.font("Helvetica").fontSize(9).fillColor("#52525b");
        doc.text(`Token Number:`, 40, 175);
        doc.font("Helvetica-Bold").fillColor("#ea580c").fontSize(13).text(`${order.token_number}`, 120, 172);

        doc.font("Helvetica").fontSize(9).fillColor("#52525b");
        doc.text(`Order ID: #${order.id}`, 40, 192);
        doc.text(`Date & Time: ${formattedDate}`, 40, 206);
        doc.text(`Student: ${order.student_name} (${order.student_email})`, 40, 220);

        doc.text(`Payment Method: ${String(order.payment_method).toUpperCase()}`, 320, 175);
        doc.text(`Payment Status: ${String(order.payment_status).toUpperCase()}`, 320, 192);
        doc.text(`Txn Ref: ${order.payment_transaction_id || "N/A"}`, 320, 206);
        doc.text(`Order Status: ${String(order.status).toUpperCase()}`, 320, 220);

        // Table Header
        let yPos = 245;
        doc.rect(40, yPos, 515, 22).fill("#f4f4f5");
        doc.fillColor("#18181b").fontSize(9).font("Helvetica-Bold");
        doc.text("ITEM DESCRIPTION", 50, yPos + 6);
        doc.text("QTY", 320, yPos + 6, { width: 40, align: "center" });
        doc.text("UNIT PRICE", 380, yPos + 6, { width: 60, align: "right" });
        doc.text("TOTAL", 460, yPos + 6, { width: 85, align: "right" });

        yPos += 26;

        // Items rows
        let subtotal = 0;
        doc.font("Helvetica").fontSize(9).fillColor("#27272a");

        for (const item of items) {
            const itemPrice = Number(item.price);
            const qty = Number(item.quantity);
            const lineTotal = itemPrice * qty;
            subtotal += lineTotal;

            doc.font("Helvetica-Bold").text(item.name, 50, yPos);
            doc.font("Helvetica").text(String(qty), 320, yPos, { width: 40, align: "center" });
            doc.text(`₹${itemPrice.toFixed(2)}`, 380, yPos, { width: 60, align: "right" });
            doc.font("Helvetica-Bold").text(`₹${lineTotal.toFixed(2)}`, 460, yPos, { width: 85, align: "right" });

            if (item.customization) {
                yPos += 13;
                doc.font("Helvetica-Oblique").fontSize(8).fillColor("#71717a").text(`Customization: ${item.customization}`, 58, yPos);
                doc.font("Helvetica").fontSize(9).fillColor("#27272a");
            }

            yPos += 18;
            doc.strokeColor("#f4f4f5").lineWidth(0.5).moveTo(40, yPos).lineTo(555, yPos).stroke();
            yPos += 6;
        }

        // Summary Calculations
        const finalTotal = Number(order.total_amount);
        const discount = Math.max(0, subtotal - finalTotal);
        const taxes = 0; // Display authentic 0 tax without fabricated rates

        yPos += 10;
        doc.strokeColor("#e4e4e7").lineWidth(1).moveTo(300, yPos).lineTo(555, yPos).stroke();
        yPos += 8;

        doc.font("Helvetica").fontSize(9).fillColor("#52525b");
        doc.text("Subtotal:", 320, yPos);
        doc.text(`₹${subtotal.toFixed(2)}`, 460, yPos, { width: 85, align: "right" });

        if (discount > 0) {
            yPos += 15;
            doc.text("Special Discount:", 320, yPos);
            doc.fillColor("#16a34a").text(`-₹${discount.toFixed(2)}`, 460, yPos, { width: 85, align: "right" });
            doc.fillColor("#52525b");
        }

        yPos += 15;
        doc.text("Taxes & Fees:", 320, yPos);
        doc.text(`₹${taxes.toFixed(2)}`, 460, yPos, { width: 85, align: "right" });

        yPos += 18;
        doc.rect(300, yPos - 4, 255, 24).fill("#fff7ed");
        doc.font("Helvetica-Bold").fontSize(11).fillColor("#ea580c");
        doc.text("Total Paid Amount:", 310, yPos + 3);
        doc.text(`₹${finalTotal.toFixed(2)}`, 460, yPos + 3, { width: 85, align: "right" });

        // Footer note
        doc.font("Helvetica").fontSize(8).fillColor("#a1a1aa");
        doc.text(
            "This is a computer-generated digital receipt and digital token issued by CampusEats.\nPresent your token number at the pickup counter once the kitchen marks your order ready.",
            40,
            720,
            { align: "center", width: 515 }
        );

        doc.end();

    } catch (error) {
        console.error("Generate order invoice error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate invoice receipt"
        });
    }
};
