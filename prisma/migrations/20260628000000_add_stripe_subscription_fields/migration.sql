-- AlterTable
ALTER TABLE "User" ADD COLUMN     "planRenewsAt" TIMESTAMP(3),
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
