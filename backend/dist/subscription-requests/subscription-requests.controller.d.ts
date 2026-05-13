import { SubscriptionRequestsService } from './subscription-requests.service';
export declare class SubscriptionRequestsController {
    private readonly subscriptionRequestsService;
    constructor(subscriptionRequestsService: SubscriptionRequestsService);
    getMyRequests(req: any): Promise<{
        id: string;
        tenantId: string;
        tier: string;
        amount: number;
        reference: string;
        isAnnual: boolean;
        phone: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createCheckoutSession(req: any, body: any): Promise<{
        id: string;
        tenantId: string;
        tier: string;
        amount: number;
        reference: string;
        isAnnual: boolean;
        phone: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
