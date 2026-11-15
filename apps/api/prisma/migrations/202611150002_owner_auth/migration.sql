-- CreateTable
CREATE TABLE `Owner` (
    `id` INTEGER NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `firstName` VARCHAR(70) NOT NULL,
    `lastName` VARCHAR(70) NOT NULL,
    `passwordHash` VARCHAR(180) NOT NULL,
    `bio` VARCHAR(1000) NOT NULL DEFAULT '',
    `newsletter` BOOLEAN NOT NULL DEFAULT false,
    `publicRecipes` BOOLEAN NOT NULL DEFAULT true,
    `avatar` VARCHAR(255) NULL,

    UNIQUE INDEX `Owner_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `digest` CHAR(64) NOT NULL,
    `ownerId` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `Session_ownerId_expiresAt_idx`(`ownerId`, `expiresAt`),
    PRIMARY KEY (`digest`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordReset` (
    `digest` CHAR(64) NOT NULL,
    `ownerId` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `PasswordReset_ownerId_expiresAt_idx`(`ownerId`, `expiresAt`),
    PRIMARY KEY (`digest`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Owner`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasswordReset` ADD CONSTRAINT `PasswordReset_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Owner`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
