import { ExpenseCategoriesService } from './expense-categories.service';
export declare class ExpenseCategoriesController {
    private readonly expenseCategoriesService;
    constructor(expenseCategoriesService: ExpenseCategoriesService);
    findAll(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
