-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "originalCurrency" TEXT NOT NULL,
    "originalAmount" DECIMAL(14,2) NOT NULL,
    "exchangeRate" DECIMAL(14,6),
    "convertedAmountEur" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseSplit" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "shareEur" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "ExpenseSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseSplit_expenseId_memberId_key" ON "ExpenseSplit"("expenseId", "memberId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
