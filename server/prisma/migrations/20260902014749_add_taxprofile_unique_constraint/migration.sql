/*
  Warnings:

  - A unique constraint covering the columns `[userId,taxYearId]` on the table `TaxProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TaxProfile_userId_taxYearId_key" ON "TaxProfile"("userId", "taxYearId");
