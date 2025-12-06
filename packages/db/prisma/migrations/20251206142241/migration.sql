-- CreateTable
CREATE TABLE "summarized_text" (
    "_id" TEXT NOT NULL,
    "parts" JSONB[],
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "meetingId" TEXT NOT NULL,

    CONSTRAINT "summarized_text_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "summarized_text_meetingId_key" ON "summarized_text"("meetingId");

-- AddForeignKey
ALTER TABLE "summarized_text" ADD CONSTRAINT "summarized_text_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
