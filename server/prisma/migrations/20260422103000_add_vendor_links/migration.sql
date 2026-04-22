-- AlterTable
ALTER TABLE "daily_schedule_entries" ADD COLUMN     "vendorId" TEXT;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "vendorId" TEXT;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "vendorId" TEXT;

-- CreateIndex
CREATE INDEX "daily_schedule_entries_vendorId_idx" ON "daily_schedule_entries"("vendorId");

-- CreateIndex
CREATE INDEX "expenses_vendorId_idx" ON "expenses"("vendorId");

-- CreateIndex
CREATE INDEX "purchase_orders_vendorId_idx" ON "purchase_orders"("vendorId");

-- AddForeignKey
ALTER TABLE "daily_schedule_entries" ADD CONSTRAINT "daily_schedule_entries_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

