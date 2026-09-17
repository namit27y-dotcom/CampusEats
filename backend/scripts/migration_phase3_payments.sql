-- ==========================================================
-- CampusEats - Phase 3A Payments & Razorpay Migration
-- Adds razorpay tracking columns to orders table safely
-- ==========================================================

SET @dbname = DATABASE();
SET @tablename = "orders";

-- Check and add razorpay_order_id
SET @columnname = "razorpay_order_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE orders ADD COLUMN razorpay_order_id VARCHAR(100) NULL AFTER payment_transaction_id;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add razorpay_payment_id
SET @columnname = "razorpay_payment_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE orders ADD COLUMN razorpay_payment_id VARCHAR(100) NULL AFTER razorpay_order_id;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add razorpay_signature
SET @columnname = "razorpay_signature";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE orders ADD COLUMN razorpay_signature VARCHAR(255) NULL AFTER razorpay_payment_id;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
