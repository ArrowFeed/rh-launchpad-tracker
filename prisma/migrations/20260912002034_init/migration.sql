-- CreateEnum
CREATE TYPE "Launchpad" AS ENUM ('PONS', 'POOLS_TRADE', 'HOOD_FUN');

-- CreateEnum
CREATE TYPE "GraduationStatus" AS ENUM ('BONDING', 'GRADUATED');

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "launchpad" "Launchpad" NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "creatorAddress" TEXT NOT NULL,
    "launchTxHash" TEXT NOT NULL,
    "launchedAt" TIMESTAMP(3) NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "graduationStatus" "GraduationStatus" NOT NULL DEFAULT 'BONDING',
    "graduatedAt" TIMESTAMP(3),
    "imageUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "traderAddress" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "amountToken" TEXT NOT NULL,
    "amountQuote" TEXT NOT NULL,
    "priceUsd" DOUBLE PRECISION,
    "blockTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_contractAddress_key" ON "Token"("contractAddress");

-- CreateIndex
CREATE INDEX "Token_launchpad_idx" ON "Token"("launchpad");

-- CreateIndex
CREATE INDEX "Token_graduationStatus_idx" ON "Token"("graduationStatus");

-- CreateIndex
CREATE INDEX "Token_launchedAt_idx" ON "Token"("launchedAt");

-- CreateIndex
CREATE INDEX "Trade_tokenId_blockTime_idx" ON "Trade"("tokenId", "blockTime");

-- CreateIndex
CREATE INDEX "Trade_blockTime_idx" ON "Trade"("blockTime");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
