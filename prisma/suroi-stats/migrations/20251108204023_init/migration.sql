-- CreateEnum
CREATE TYPE "Region" AS ENUM ('NA', 'SA', 'EU', 'AS', 'EA', 'OC');

-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('NORMAL', 'FALL', 'HALLOWEEN', 'INFECTION', 'HUNTED', 'WINTER', 'FIFTY_VS_FIFTY', 'DESERT', 'OTHER');

-- CreateEnum
CREATE TYPE "TeamMode" AS ENUM ('SOLO', 'DUO', 'SQUAD');

-- CreateTable
CREATE TABLE "UserStat" (
    "user_id" UUID NOT NULL,
    "currency" INTEGER NOT NULL,
    "friends" UUID[],

    CONSTRAINT "UserStat_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Kill" (
    "weapon" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "match_id" UUID NOT NULL,
    "killer_id" UUID NOT NULL,
    "killer_count" SMALLINT NOT NULL,
    "killed_id" UUID NOT NULL,
    "killed_count" SMALLINT NOT NULL,

    CONSTRAINT "Kill_pkey" PRIMARY KEY ("match_id","killed_id","killed_count")
);

-- CreateTable
CREATE TABLE "Revive" (
    "timestamp" TIMESTAMP(3) NOT NULL,
    "match_id" UUID NOT NULL,
    "reviver_id" UUID NOT NULL,
    "reviver_count" SMALLINT NOT NULL,
    "revived_id" UUID NOT NULL,
    "revived_count" SMALLINT NOT NULL,

    CONSTRAINT "Revive_pkey" PRIMARY KEY ("match_id","reviver_id","reviver_count","timestamp")
);

-- CreateTable
CREATE TABLE "Assist" (
    "match_id" UUID NOT NULL,
    "assister_id" UUID NOT NULL,
    "assister_count" SMALLINT NOT NULL,
    "killed_id" UUID NOT NULL,
    "killed_count" SMALLINT NOT NULL,

    CONSTRAINT "Assist_pkey" PRIMARY KEY ("match_id","killed_id","killed_count")
);

-- CreateTable
CREATE TABLE "Damage" (
    "match_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "count" SMALLINT NOT NULL,
    "amount" INTEGER NOT NULL,
    "weapon" TEXT NOT NULL,

    CONSTRAINT "Damage_pkey" PRIMARY KEY ("match_id","user_id","count","weapon")
);

-- CreateTable
CREATE TABLE "Match" (
    "match_id" UUID NOT NULL,
    "region" "Region" NOT NULL,
    "mode_id" "GameMode" NOT NULL,
    "team_mode" "TeamMode" NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("match_id")
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "match_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "count" SMALLSERIAL NOT NULL,
    "shots" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "damage_taken" INTEGER NOT NULL,
    "won" BOOLEAN NOT NULL,
    "time_survived__s" INTEGER NOT NULL,

    CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("match_id","user_id","count")
);

-- CreateTable
CREATE TABLE "_MatchToUserStat" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_MatchToUserStat_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MatchToUserStat_B_index" ON "_MatchToUserStat"("B");

-- AddForeignKey
ALTER TABLE "Kill" ADD CONSTRAINT "Kill_match_id_killer_id_killer_count_fkey" FOREIGN KEY ("match_id", "killer_id", "killer_count") REFERENCES "MatchPlayer"("match_id", "user_id", "count") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kill" ADD CONSTRAINT "Kill_match_id_killed_id_killed_count_fkey" FOREIGN KEY ("match_id", "killed_id", "killed_count") REFERENCES "MatchPlayer"("match_id", "user_id", "count") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revive" ADD CONSTRAINT "Revive_match_id_reviver_id_reviver_count_fkey" FOREIGN KEY ("match_id", "reviver_id", "reviver_count") REFERENCES "MatchPlayer"("match_id", "user_id", "count") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revive" ADD CONSTRAINT "Revive_match_id_revived_id_revived_count_fkey" FOREIGN KEY ("match_id", "revived_id", "revived_count") REFERENCES "MatchPlayer"("match_id", "user_id", "count") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assist" ADD CONSTRAINT "Assist_match_id_assister_id_assister_count_fkey" FOREIGN KEY ("match_id", "assister_id", "assister_count") REFERENCES "MatchPlayer"("match_id", "user_id", "count") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assist" ADD CONSTRAINT "Assist_match_id_killed_id_killed_count_fkey" FOREIGN KEY ("match_id", "killed_id", "killed_count") REFERENCES "Kill"("match_id", "killed_id", "killed_count") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Damage" ADD CONSTRAINT "Damage_match_id_user_id_count_fkey" FOREIGN KEY ("match_id", "user_id", "count") REFERENCES "MatchPlayer"("match_id", "user_id", "count") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match"("match_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserStat"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MatchToUserStat" ADD CONSTRAINT "_MatchToUserStat_A_fkey" FOREIGN KEY ("A") REFERENCES "Match"("match_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MatchToUserStat" ADD CONSTRAINT "_MatchToUserStat_B_fkey" FOREIGN KEY ("B") REFERENCES "UserStat"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
