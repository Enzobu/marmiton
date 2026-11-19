-- Local food codes for manufacturer references outside Ciqual. See docs/nutrition.md.
INSERT INTO `NutritionFood` (`code`, `name`, `nameKey`, `kcal`, `protein`, `carbs`, `fat`) VALUES
    (900001, 'Whey banane (référence BioTechUSA)', 'whey banane reference biotechusa', 385.7, 75, 5, 6.43),
    (900002, 'Skyr nature (référence Danone)', 'skyr nature reference danone', 57, 10, 3.9, 0.2);

-- Keep associations already saved by the user.
INSERT IGNORE INTO `NutritionAlias` (`nameKey`, `foodCode`) VALUES
    ('whey banane', 900001),
    ('whey a la banane', 900001),
    ('whey saveur banane', 900001),
    ('skyr nature', 900002),
    ('levure chimique', 11046),
    ('poudre a lever', 11046);
