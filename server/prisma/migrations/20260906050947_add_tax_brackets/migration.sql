-- CreateTable
CREATE TABLE "TaxBracket" (
    "id" TEXT NOT NULL,
    "taxYearId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "rangoDesdeUvt" DECIMAL(65,30) NOT NULL,
    "rangoHastaUvt" DECIMAL(65,30),
    "tarifaMarginal" DECIMAL(65,30) NOT NULL,
    "impuestoBaseUvt" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "TaxBracket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxBracket_taxYearId_orden_key" ON "TaxBracket"("taxYearId", "orden");

-- AddForeignKey
ALTER TABLE "TaxBracket" ADD CONSTRAINT "TaxBracket_taxYearId_fkey" FOREIGN KEY ("taxYearId") REFERENCES "TaxYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
