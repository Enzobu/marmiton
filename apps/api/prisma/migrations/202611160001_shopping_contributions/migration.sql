CREATE TABLE `ShoppingContribution` (
    `id` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NOT NULL,
    `recipeId` CHAR(36) NULL,
    `recipeTitle` VARCHAR(200) NULL,
    `amount` DECIMAL(30, 12) NULL,

    INDEX `ShoppingContribution_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ShoppingContribution_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ShoppingItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
