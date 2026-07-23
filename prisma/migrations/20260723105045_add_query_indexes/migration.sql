-- CreateIndex
CREATE INDEX "Expense_householdId_idx" ON "Expense"("householdId");

-- CreateIndex
CREATE INDEX "Expense_payerId_idx" ON "Expense"("payerId");

-- CreateIndex
CREATE INDEX "ExpenseSplit_memberId_idx" ON "ExpenseSplit"("memberId");

-- CreateIndex
CREATE INDEX "Invite_householdId_idx" ON "Invite"("householdId");

-- CreateIndex
CREATE INDEX "Settlement_householdId_idx" ON "Settlement"("householdId");

-- CreateIndex
CREATE INDEX "Settlement_fromMemberId_idx" ON "Settlement"("fromMemberId");

-- CreateIndex
CREATE INDEX "Settlement_toMemberId_idx" ON "Settlement"("toMemberId");
