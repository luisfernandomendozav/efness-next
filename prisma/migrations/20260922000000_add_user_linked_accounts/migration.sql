-- CreateTable
CREATE TABLE "user_linked_accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "linked_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "user_linked_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_linked_accounts_user_id_linked_user_id_key" ON "user_linked_accounts"("user_id", "linked_user_id");

-- CreateIndex
CREATE INDEX "user_linked_accounts_linked_user_id_idx" ON "user_linked_accounts"("linked_user_id");

-- AddForeignKey
ALTER TABLE "user_linked_accounts" ADD CONSTRAINT "user_linked_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_linked_accounts" ADD CONSTRAINT "user_linked_accounts_linked_user_id_fkey" FOREIGN KEY ("linked_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
