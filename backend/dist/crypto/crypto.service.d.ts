export declare class CryptoService {
    private readonly logger;
    private readonly algorithm;
    private readonly prefix;
    private get secretKey();
    encrypt(text: string | null | undefined): string | null;
    decrypt(text: string | null | undefined): string | null;
}
