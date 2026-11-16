-- CreateTable
CREATE TABLE `Recipe` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(30) NOT NULL,
    `difficulty` VARCHAR(10) NOT NULL,
    `budget` VARCHAR(20) NOT NULL,
    `servings` INTEGER NOT NULL,
    `prepMinutes` INTEGER NOT NULL,
    `cookMinutes` INTEGER NOT NULL,
    `restMinutes` INTEGER NOT NULL,
    `totalMinutes` INTEGER NOT NULL,
    `imagePath` VARCHAR(2048) NULL,
    `utensils` JSON NOT NULL,
    `rating` DOUBLE NOT NULL DEFAULT 0,
    `reviews` INTEGER NOT NULL DEFAULT 0,
    `badge` VARCHAR(50) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Recipe_isPublic_category_totalMinutes_idx`(`isPublic`, `category`, `totalMinutes`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecipeIngredient` (
    `recipeId` CHAR(36) NOT NULL,
    `position` INTEGER NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `quantity` DECIMAL(14, 6) NULL,
    `unit` VARCHAR(30) NULL,
    `icon` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`recipeId`, `position`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecipeStep` (
    `recipeId` CHAR(36) NOT NULL,
    `position` INTEGER NOT NULL,
    `content` TEXT NOT NULL,

    PRIMARY KEY (`recipeId`, `position`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RecipeIngredient` ADD CONSTRAINT `RecipeIngredient_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecipeStep` ADD CONSTRAINT `RecipeStep_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
