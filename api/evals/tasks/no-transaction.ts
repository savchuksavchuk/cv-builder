import type { TransactionService } from '../../src/modules/shared/services/transaction.service';

export const runWithoutTransaction = {
  run: (work: () => Promise<void>) => work(),
} as unknown as TransactionService;
