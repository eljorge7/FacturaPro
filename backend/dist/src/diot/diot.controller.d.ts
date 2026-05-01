import { DiotService } from './diot.service';
export declare class DiotController {
    private readonly diotService;
    constructor(diotService: DiotService);
    getSummary(tenantId: string): Promise<{
        ivaCobrado: number;
        ivaPagado: number;
        totalAPagar: number;
        saldoAFavor: number;
    }>;
}
