import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionRepository = getRepository(Transaction);

    const incomeData = await transactionRepository.find({
      where: { type: 'income' },
      select: ['value'],
    });

    const outcomeData = await transactionRepository.find({
      where: { type: 'outcome' },
      select: ['value'],
    });

    const income = incomeData.reduce(
      (total, transaction) => total + Number(transaction.value),
      0,
    );

    const outcome = outcomeData.reduce(
      (total, transaction) => total + Number(transaction.value),
      0,
    );

    const status = {
      income,
      outcome,
      total: income - outcome,
    };

    return status;
  }
}

export default TransactionsRepository;
