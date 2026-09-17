-- ==========================================================
-- CampusEats - Phase 2 Inventory Migration
-- Adds stock_quantity and is_tracked to menu_items safely
-- ==========================================================

-- Check and add stock_quantity if not present
SET @dbname = DATABASE();
SET @tablename = "menu_items";
SET @columnname = "stock_quantity";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE menu_items ADD COLUMN stock_quantity INT NOT NULL DEFAULT 100;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add is_tracked if not present
SET @columnname = "is_tracked";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE menu_items ADD COLUMN is_tracked TINYINT(1) NOT NULL DEFAULT 0;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ensure all existing menu items have sensible stock
UPDATE menu_items SET stock_quantity = 100 WHERE stock_quantity IS NULL;
UPDATE menu_items SET is_tracked = 0 WHERE is_tracked IS NULL;
