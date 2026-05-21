export declare class MailService {
    private resend;
    private readonly logger;
    constructor();
    sendQuoteEmail(to: string, quoteNumber: string, proposalUrl: string, customerName: string): Promise<{
        success: boolean;
        messageId: string;
    }>;
}
