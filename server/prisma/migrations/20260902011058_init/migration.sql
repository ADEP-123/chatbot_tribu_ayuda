-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxYear" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "uvtValue" DECIMAL(65,30) NOT NULL,
    "topePatrimonioUvt" DECIMAL(65,30) NOT NULL DEFAULT 4500,
    "topeIngresosUvt" DECIMAL(65,30) NOT NULL DEFAULT 1400,
    "topeConsumosUvt" DECIMAL(65,30) NOT NULL DEFAULT 1400,
    "topeComprasUvt" DECIMAL(65,30) NOT NULL DEFAULT 1400,
    "topeConsignacionesUvt" DECIMAL(65,30) NOT NULL DEFAULT 1400,
    "sancionMinimaUvt" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "declarationStart" TIMESTAMP(3) NOT NULL,
    "declarationEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeclarationDeadline" (
    "id" TEXT NOT NULL,
    "taxYearId" TEXT NOT NULL,
    "nitDigitFrom" INTEGER NOT NULL,
    "nitDigitTo" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeclarationDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxYearId" TEXT NOT NULL,
    "ingresosBrutos" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "patrimonioBruto" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "consumosTarjeta" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "comprasConsumos" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "consignaciones" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "esResponsableIva" BOOLEAN NOT NULL DEFAULT false,
    "ultimosDigitosNit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "extractedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxProfileId" TEXT NOT NULL,
    "debeDeclarar" BOOLEAN NOT NULL,
    "motivos" JSONB NOT NULL,
    "fechaLimite" TIMESTAMP(3),
    "montoEstimado" DECIMAL(65,30),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TaxYear_year_key" ON "TaxYear"("year");

-- AddForeignKey
ALTER TABLE "DeclarationDeadline" ADD CONSTRAINT "DeclarationDeadline_taxYearId_fkey" FOREIGN KEY ("taxYearId") REFERENCES "TaxYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxProfile" ADD CONSTRAINT "TaxProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxProfile" ADD CONSTRAINT "TaxProfile_taxYearId_fkey" FOREIGN KEY ("taxYearId") REFERENCES "TaxYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_taxProfileId_fkey" FOREIGN KEY ("taxProfileId") REFERENCES "TaxProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
