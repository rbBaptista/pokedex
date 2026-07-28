/*
  Warnings:

  - Added the required column `geracaoNumero` to the `Pokemon` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Generation" (
    "numero" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "regiao" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pokemon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "altura" INTEGER NOT NULL,
    "peso" INTEGER NOT NULL,
    "hpBase" INTEGER NOT NULL,
    "ataqueBase" INTEGER NOT NULL,
    "defesaBase" INTEGER NOT NULL,
    "ataqueEspecialBase" INTEGER NOT NULL,
    "defesaEspecialBase" INTEGER NOT NULL,
    "velocidadeBase" INTEGER NOT NULL,
    "spriteUrl" TEXT NOT NULL,
    "geracaoNumero" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pokemon_geracaoNumero_fkey" FOREIGN KEY ("geracaoNumero") REFERENCES "Generation" ("numero") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pokemon" ("altura", "ataqueBase", "ataqueEspecialBase", "criadoEm", "defesaBase", "defesaEspecialBase", "hpBase", "id", "nome", "peso", "spriteUrl", "velocidadeBase") SELECT "altura", "ataqueBase", "ataqueEspecialBase", "criadoEm", "defesaBase", "defesaEspecialBase", "hpBase", "id", "nome", "peso", "spriteUrl", "velocidadeBase" FROM "Pokemon";
DROP TABLE "Pokemon";
ALTER TABLE "new_Pokemon" RENAME TO "Pokemon";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
