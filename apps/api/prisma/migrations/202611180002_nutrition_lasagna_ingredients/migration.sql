-- Match explicitly dried pasta without guessing for fresh or cooked sheets.
INSERT IGNORE INTO `NutritionAlias` (`nameKey`, `foodCode`) VALUES
    ('citron', 13009),
    ('citrons', 13009),
    ('epinards surgeles en branches', 20083),
    ('epinards en branches surgeles', 20083),
    ('epinards surgeles', 20083),
    ('feuilles de lasagne seches', 9810),
    ('feuilles de lasagnes seches', 9810),
    ('lasagnes seches', 9810),
    ('muscade moulue', 11048);

-- Original workbook: <0.5 g fat for lemon, and only trace carbs for raw cod and olive oil.
UPDATE `NutritionFood` SET `fat` = 0.25 WHERE `code` = 13009 AND `fat` IS NULL;
UPDATE `NutritionFood` SET `carbs` = 0 WHERE `code` IN (26043, 17270) AND `carbs` IS NULL;
