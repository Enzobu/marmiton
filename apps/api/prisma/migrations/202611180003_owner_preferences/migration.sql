ALTER TABLE `Owner`
  ADD COLUMN `developerMode` BOOLEAN NULL,
  ADD COLUMN `theme` ENUM('light', 'dark', 'system') NULL;
