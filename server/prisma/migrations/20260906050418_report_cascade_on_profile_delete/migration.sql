-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_taxProfileId_fkey";

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_taxProfileId_fkey" FOREIGN KEY ("taxProfileId") REFERENCES "TaxProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
