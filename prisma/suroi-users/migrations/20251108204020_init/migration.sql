-- CreateEnum
CREATE TYPE "PunishmentType" AS ENUM ('WARN', 'BAN');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLAYER', 'TESTER', 'CONTRIBUTOR', 'DEVELOPER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthenticationMethod" AS ENUM ('DEFAULT', 'MEOW');

-- CreateTable
CREATE TABLE "CoreUser" (
    "id" UUID NOT NULL,
    "ip_addrs" INET[],

    CONSTRAINT "CoreUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "roles" "Role"[] DEFAULT ARRAY['PLAYER']::"Role"[],
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_auth_method" "AuthenticationMethod" NOT NULL,
    "salt" TEXT,
    "session_nonce" TEXT,
    "hash_or_rp" TEXT NOT NULL,
    "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_secret" TEXT,
    "creation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "token_hash" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "trusted" BOOLEAN NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("token_hash")
);

-- CreateTable
CREATE TABLE "Punishment" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "PunishmentType" NOT NULL,
    "message" TEXT NOT NULL,
    "issuer_id" UUID NOT NULL,
    "issued" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires" TIMESTAMP(3),

    CONSTRAINT "Punishment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_id_fkey" FOREIGN KEY ("id") REFERENCES "CoreUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Punishment" ADD CONSTRAINT "Punishment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "CoreUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Punishment" ADD CONSTRAINT "Punishment_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
