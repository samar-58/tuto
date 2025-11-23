-- AlterTable
ALTER TABLE "meeting" ADD COLUMN     "hasEgress" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Egress" (
    "_id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Egress_pkey" PRIMARY KEY ("_id")
);

-- AddForeignKey
ALTER TABLE "Egress" ADD CONSTRAINT "Egress_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
