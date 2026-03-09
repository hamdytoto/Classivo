ALTER TABLE "Session"
RENAME COLUMN "refreshToken" TO "refreshTokenHash";

ALTER INDEX "Session_refreshToken_key"
RENAME TO "Session_refreshTokenHash_key";
