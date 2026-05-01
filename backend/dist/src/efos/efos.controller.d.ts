import { EfosService } from './efos.service';
export declare class EfosController {
    private readonly efosService;
    constructor(efosService: EfosService);
    syncEfos(): Promise<unknown>;
}
