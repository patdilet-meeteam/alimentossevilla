-- CreateEnum
CREATE TYPE "IngredientCategory" AS ENUM ('CARNE', 'MATERIA_SECA', 'EMPAQUE', 'ADITIVO', 'OTRO');

-- CreateEnum
CREATE TYPE "NutrientSource" AS ENUM ('BANCO_ALIMENTOS', 'LAB_PROVEEDOR', 'LITERATURA');

-- CreateEnum
CREATE TYPE "NutrientUnit" AS ENUM ('G', 'MG', 'MCG', 'KCAL', 'KJ');

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "siesaCode" TEXT NOT NULL,
    "category" "IngredientCategory" NOT NULL,
    "isAllergen" BOOLEAN NOT NULL DEFAULT false,
    "allergenTags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutritional_profiles" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "source" "NutrientSource" NOT NULL,
    "sourceDetail" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceBase" TEXT NOT NULL DEFAULT '100g',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "nutritional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrients" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "unit" "NutrientUnit" NOT NULL,
    "displayName" TEXT NOT NULL,
    "isRequiredOnLabel" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nutrients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrient_values" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "nutrientId" TEXT NOT NULL,
    "value" DECIMAL(12,4) NOT NULL,
    "method" TEXT,

    CONSTRAINT "nutrient_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_siesaCode_key" ON "ingredients"("siesaCode");

-- CreateIndex
CREATE INDEX "ingredients_siesaCode_idx" ON "ingredients"("siesaCode");

-- CreateIndex
CREATE INDEX "ingredients_category_idx" ON "ingredients"("category");

-- CreateIndex
CREATE INDEX "ingredients_isActive_idx" ON "ingredients"("isActive");

-- CreateIndex
CREATE INDEX "nutritional_profiles_ingredientId_idx" ON "nutritional_profiles"("ingredientId");

-- CreateIndex
CREATE INDEX "nutritional_profiles_isActive_idx" ON "nutritional_profiles"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "nutrients_key_key" ON "nutrients"("key");

-- CreateIndex
CREATE INDEX "nutrients_key_idx" ON "nutrients"("key");

-- CreateIndex
CREATE INDEX "nutrient_values_nutrientId_idx" ON "nutrient_values"("nutrientId");

-- CreateIndex
CREATE UNIQUE INDEX "nutrient_values_profileId_nutrientId_key" ON "nutrient_values"("profileId", "nutrientId");

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutritional_profiles" ADD CONSTRAINT "nutritional_profiles_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutritional_profiles" ADD CONSTRAINT "nutritional_profiles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrient_values" ADD CONSTRAINT "nutrient_values_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "nutritional_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrient_values" ADD CONSTRAINT "nutrient_values_nutrientId_fkey" FOREIGN KEY ("nutrientId") REFERENCES "nutrients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
