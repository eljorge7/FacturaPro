import { PrismaService } from '../prisma/prisma.service';
export declare class PurchasesService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllPurchases(tenantId: string): Promise<({
        supplier: {
            id: string;
            tenantId: string;
            legalName: string;
            rfc: string | null;
            email: string | null;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            product: {
                id: string;
                tenantId: string;
                sku: string | null;
                barcode: string | null;
                name: string;
                description: string | null;
                price: number;
                costPrice: number | null;
                type: string;
                stock: number;
                minStock: number;
                maxStock: number | null;
                trackInventory: boolean;
                hasSerials: boolean;
                supplierSku: string | null;
                locationShelf: string | null;
                imageUrl: string | null;
                currency: string;
                satProductCode: string | null;
                satUnitCode: string | null;
                taxIncluded: boolean;
                taxRate: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            purchaseOrderId: string;
            productId: string;
            quantity: number;
            receivedQuantity: number;
            unitCost: number;
            total: number;
        })[];
        serialNumbers: {
            id: string;
            serial: string;
            productId: string;
            purchaseOrderId: string | null;
            status: string;
            soldAt: Date | null;
            invoiceItemId: string | null;
            createdAt: Date;
        }[];
        supplierPayments: {
            id: string;
            purchaseOrderId: string;
            amount: number;
            paymentDate: Date;
            paymentMethod: string;
            reference: string | null;
            notes: string | null;
            createdAt: Date;
        }[];
    } & {
        id: string;
        tenantId: string;
        supplierId: string;
        orderDate: Date;
        expectedDate: Date | null;
        status: string;
        invoiceRef: string | null;
        total: number;
        amountPaid: number;
        paymentStatus: string;
        currency: string;
        exchangeRate: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    createPurchase(tenantId: string, payload: any): Promise<{
        id: string;
        tenantId: string;
        supplierId: string;
        orderDate: Date;
        expectedDate: Date | null;
        status: string;
        invoiceRef: string | null;
        total: number;
        amountPaid: number;
        paymentStatus: string;
        currency: string;
        exchangeRate: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePurchase(tenantId: string, orderId: string): Promise<{
        id: string;
        tenantId: string;
        supplierId: string;
        orderDate: Date;
        expectedDate: Date | null;
        status: string;
        invoiceRef: string | null;
        total: number;
        amountPaid: number;
        paymentStatus: string;
        currency: string;
        exchangeRate: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePurchase(tenantId: string, orderId: string, payload: any): Promise<{
        id: string;
        tenantId: string;
        supplierId: string;
        orderDate: Date;
        expectedDate: Date | null;
        status: string;
        invoiceRef: string | null;
        total: number;
        amountPaid: number;
        paymentStatus: string;
        currency: string;
        exchangeRate: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    receivePurchase(tenantId: string, orderId: string, providedItems: {
        itemId: string;
        receivedNow: number;
        serials: string[];
    }[]): Promise<{
        success: boolean;
        status: string;
    }>;
    addPayment(tenantId: string, orderId: string, payload: {
        amount: number;
        paymentMethod?: string;
        reference?: string;
        notes?: string;
    }): Promise<{
        id: string;
        purchaseOrderId: string;
        amount: number;
        paymentDate: Date;
        paymentMethod: string;
        reference: string | null;
        notes: string | null;
        createdAt: Date;
    }>;
    getApReport(tenantId: string): Promise<{
        payments: ({
            purchaseOrder: {
                supplier: {
                    id: string;
                    tenantId: string;
                    legalName: string;
                    rfc: string | null;
                    email: string | null;
                    phone: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                tenantId: string;
                supplierId: string;
                orderDate: Date;
                expectedDate: Date | null;
                status: string;
                invoiceRef: string | null;
                total: number;
                amountPaid: number;
                paymentStatus: string;
                currency: string;
                exchangeRate: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            purchaseOrderId: string;
            amount: number;
            paymentDate: Date;
            paymentMethod: string;
            reference: string | null;
            notes: string | null;
            createdAt: Date;
        })[];
        pendingOrders: ({
            supplier: {
                id: string;
                tenantId: string;
                legalName: string;
                rfc: string | null;
                email: string | null;
                phone: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            tenantId: string;
            supplierId: string;
            orderDate: Date;
            expectedDate: Date | null;
            status: string;
            invoiceRef: string | null;
            total: number;
            amountPaid: number;
            paymentStatus: string;
            currency: string;
            exchangeRate: number;
            createdAt: Date;
            updatedAt: Date;
        })[];
        totalDebt: number;
    }>;
}
