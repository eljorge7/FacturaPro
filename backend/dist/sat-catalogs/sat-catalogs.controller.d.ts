import { SatCatalogsService } from './sat-catalogs.service';
export declare class SatCatalogsController {
    private readonly satCatalogsService;
    constructor(satCatalogsService: SatCatalogsService);
    searchProducts(q: string): {
        value: string;
        label: string;
    }[];
}
