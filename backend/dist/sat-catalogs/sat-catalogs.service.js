"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SatCatalogsService = void 0;
const common_1 = require("@nestjs/common");
const PRODUCT_CATALOG = [
    { value: "01010101", label: "No existe en el catálogo" },
    { value: "81112101", label: "Proveedores de servicio de internet (WISP) / ISP" },
    { value: "81112105", label: "Servicios en la nube o Hosting" },
    { value: "43222609", label: "Antenas o equipos de red inalámbrica" },
    { value: "43222600", label: "Equipos de red y telecomunicaciones" },
    { value: "46171615", label: "Cámaras de seguridad o sistemas de vigilancia" },
    { value: "43211500", label: "Computadoras" },
    { value: "43222901", label: "Cables de red" },
    { value: "43191500", label: "Teléfonos móviles" },
    { value: "25172500", label: "Neumáticos y Llantas" },
    { value: "78181500", label: "Mantenimiento de vehículos" },
    { value: "84111506", label: "Servicios de facturación" },
    { value: "84111500", label: "Servicios de contabilidad" },
    { value: "80111600", label: "Servicios temporales de personal" },
    { value: "80121600", label: "Servicios de derecho corporativo" },
    { value: "80141605", label: "Relaciones públicas" },
    { value: "81111800", label: "Diseño y desarrollo de sitios web" },
    { value: "43231500", label: "Software de negocios / Software empresarial" },
    { value: "43231512", label: "Software de gestión de relaciones con los clientes (CRM)" },
    { value: "43231513", label: "Programa informático de contabilidad / ERP" },
    { value: "82101503", label: "Publicidad en internet" },
    { value: "81111508", label: "Desarrollo de software de aplicaciones / App Development" },
    { value: "83111502", label: "Servicios de banda ancha / Internet Residencial" }
];
let SatCatalogsService = class SatCatalogsService {
    searchProducts(query) {
        if (!query) {
            return PRODUCT_CATALOG.slice(0, 50);
        }
        const lowerQuery = query.toLowerCase();
        const results = PRODUCT_CATALOG.filter(item => item.value.includes(lowerQuery) ||
            item.label.toLowerCase().includes(lowerQuery));
        return results.slice(0, 50);
    }
};
exports.SatCatalogsService = SatCatalogsService;
exports.SatCatalogsService = SatCatalogsService = __decorate([
    (0, common_1.Injectable)()
], SatCatalogsService);
//# sourceMappingURL=sat-catalogs.service.js.map