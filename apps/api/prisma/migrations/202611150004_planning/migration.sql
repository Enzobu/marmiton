-- CreateTable
CREATE TABLE `ShoppingItem` (
    `id` CHAR(36) NOT NULL,
    `ownerId` INTEGER NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `unit` VARCHAR(30) NULL,
    `amount` DECIMAL(30, 12) NULL,
    `checked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ShoppingItem_ownerId_createdAt_idx`(`ownerId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlannedMeal` (
    `id` CHAR(36) NOT NULL,
    `ownerId` INTEGER NOT NULL,
    `recipeId` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `servings` INTEGER NOT NULL,

    INDEX `PlannedMeal_ownerId_date_idx`(`ownerId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecipeNote` (
    `ownerId` INTEGER NOT NULL,
    `recipeId` CHAR(36) NOT NULL,
    `note` TEXT NOT NULL,

    PRIMARY KEY (`ownerId`, `recipeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ShoppingItem` ADD CONSTRAINT `ShoppingItem_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Owner`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlannedMeal` ADD CONSTRAINT `PlannedMeal_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Owner`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlannedMeal` ADD CONSTRAINT `PlannedMeal_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecipeNote` ADD CONSTRAINT `RecipeNote_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Owner`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecipeNote` ADD CONSTRAINT `RecipeNote_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
