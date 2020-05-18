import { getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import multerConfig from '../config/multerConfig';

interface TransactionData {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const pathFile = path.join(multerConfig.directory, filename);
    const transactions: TransactionData[] = [];
    const categories: string[] = [];

    const transactionsRepository = getRepository(Transaction);
    const categoriesRepository = getRepository(Category);

    const parseCsv = csvParse({
      from_line: 2,
    });

    const read = fs.createReadStream(pathFile);

    const parsedCsv = read.pipe(parseCsv);

    parsedCsv.on('data', async data => {
      const [title, type, value, category] = data.map((cel: string) =>
        cel.trim(),
      );

      if (!title || !type || !value || !category) return;

      if (!categories.includes(category)) {
        categories.push(category);
      }

      transactions.push({
        title,
        type,
        value,
        category,
      });
    });

    await new Promise(resolve => parsedCsv.on('end', resolve));

    const categoriesCreated = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const existedCategories = categoriesCreated.map(category => category.title);

    const needToBeCreated = categories.filter(
      category => !existedCategories.includes(category),
    );

    const createCategories = categoriesRepository.create(
      needToBeCreated.map(category => ({
        title: category,
      })),
    );

    await categoriesRepository.save(createCategories);

    const allCategories = Object.assign(createCategories, categoriesCreated);

    const createTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    const transactionsFinal = await transactionsRepository.save(
      createTransactions,
    );

    return transactionsFinal;
  }
}

export default ImportTransactionsService;
