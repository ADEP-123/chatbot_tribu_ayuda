-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "camposFaltantes" JSONB;

-- AlterTable
ALTER TABLE "TaxProfile" ALTER COLUMN "ingresosBrutos" DROP NOT NULL,
ALTER COLUMN "ingresosBrutos" DROP DEFAULT,
ALTER COLUMN "patrimonioBruto" DROP NOT NULL,
ALTER COLUMN "patrimonioBruto" DROP DEFAULT,
ALTER COLUMN "consumosTarjeta" DROP NOT NULL,
ALTER COLUMN "consumosTarjeta" DROP DEFAULT,
ALTER COLUMN "comprasConsumos" DROP NOT NULL,
ALTER COLUMN "comprasConsumos" DROP DEFAULT,
ALTER COLUMN "consignaciones" DROP NOT NULL,
ALTER COLUMN "consignaciones" DROP DEFAULT,
ALTER COLUMN "esResponsableIva" DROP NOT NULL,
ALTER COLUMN "esResponsableIva" DROP DEFAULT;
