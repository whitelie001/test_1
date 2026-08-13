/*
  Warnings:

  - You are about to drop the column `schedule_text` on the `meetups` table. All the data in the column will be lost.
  - Added the required column `schedule` to the `meetups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "meetup_members" ADD COLUMN     "join_message" TEXT;

-- AlterTable
ALTER TABLE "meetups" DROP COLUMN "schedule_text",
ADD COLUMN     "schedule" JSONB NOT NULL;
