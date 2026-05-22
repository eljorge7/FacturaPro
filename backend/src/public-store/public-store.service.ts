import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicStoreService {
  private readonly logger = new Logger(PublicStoreService.name);
  // Cache Syscom tokens per Tenant ID
  private syscomTokens: Map<string, { token: string, expiresAt: number }> = new Map();
  // Simple in-memory cache for product details
  private productsCache: Map<string, { data: any, expiresAt: number }> = new Map();

  constructor(
    private prisma: PrismaService
  ) {}

  private async getSyscomToken(tenant: any): Promise<string | null> {
    if (!tenant.syscomClientId || !tenant.syscomClientSecret) return null;

    const cached = this.syscomTokens.get(tenant.id);
    const now = Date.now();
    
    if (cached && cached.expiresAt > now) {
      return cached.token;
    }

    this.logger.log(`Solicitando nuevo token a Syscom para Tenant: ${tenant.id}...`);
    try {
      const response = await axios.post('https://developers.syscom.mx/oauth/token', new URLSearchParams({
        client_id: tenant.syscomClientId,
        client_secret: tenant.syscomClientSecret,
        grant_type: 'client_credentials'
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const token = response.data.access_token;
      // Syscom tokens usually last 365 days, but we cache for 24h just in case
      const expiresAt = now + (24 * 60 * 60 * 1000); 
      
      this.syscomTokens.set(tenant.id, { token, expiresAt });
      return token;
    } catch (error) {
      this.logger.error(`Error obteniendo token de Syscom para Tenant ${tenant.id}`, error);
      return null;
    }
  }

  async getCombinedCatalog(slug: string, page: number = 1) {
    const tenant = await this.prisma.tenant.findFirst({ 
      where: { storeEnabled: true, hasStoreAccess: true, OR: [{ storeSlug: slug }, { storeCustomDomain: slug }] } 
    });
    if (!tenant) {
      throw new NotFoundException('Store not found or disabled');
    }

    // 1. Fetch Local Store Products
    const localProductsRaw = await this.prisma.storeProduct.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' } // Just all of them for now
    });
    
    const localProducts = localProductsRaw.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      stock: p.stock,
      brand: p.brand || 'Local',
      imageUrl: p.imageUrl,
      category: p.category,
      source: 'local'
    }));

    // 2. Fetch Syscom Products if configured
    let syscomProducts: any[] = [];
    const token = await this.getSyscomToken(tenant);

    if (token) {
      try {
        const res = await axios.get(`https://developers.syscom.mx/api/v1/productos?pagina=${page}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data && res.data.productos) {
          syscomProducts = res.data.productos.map((p: any) => ({
            id: p.producto_id,
            title: p.titulo,
            price: parseFloat(p.precios?.precio_descuento || p.precios?.precio_lista || '0'),
            stock: parseInt(p.existencia?.nuevo || '0', 10),
            brand: p.marca,
            imageUrl: p.img_portada,
            category: p.categorias?.[0]?.nombre || 'General',
            source: 'syscom'
          }));
        }
      } catch (e) {
        this.logger.error("Error fetching syscom products", e);
      }
    }

    return {
      products: [...localProducts, ...syscomProducts],
      page
    };
  }

  async getProductDetails(slug: string, id: string) {
    const tenant = await this.prisma.tenant.findFirst({ 
      where: { storeEnabled: true, hasStoreAccess: true, OR: [{ storeSlug: slug }, { storeCustomDomain: slug }] } 
    });
    if (!tenant) throw new NotFoundException('Store not found');

    const cacheKey = `${tenant.id}_${id}`;
    const cached = this.productsCache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    // Try local
    const localP = await this.prisma.storeProduct.findFirst({
      where: { id, tenantId: tenant.id }
    });

    if (localP) {
      const data = {
        id: localP.id,
        title: localP.title,
        description: localP.description,
        price: localP.price,
        stock: localP.stock,
        brand: localP.brand || 'Local',
        imageUrl: localP.imageUrl,
        category: localP.category,
        source: 'local'
      };
      this.productsCache.set(cacheKey, { data, expiresAt: now + 5 * 60 * 1000 });
      return data;
    }

    // Try Syscom
    const token = await this.getSyscomToken(tenant);
    if (!token) throw new NotFoundException('Product not found or syscom not configured');

    try {
      const res = await axios.get(`https://developers.syscom.mx/api/v1/productos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const p = res.data;
      const data = {
        id: p.producto_id,
        title: p.titulo,
        description: p.descripcion,
        price: parseFloat(p.precios?.precio_descuento || p.precios?.precio_lista || '0'),
        stock: parseInt(p.existencia?.nuevo || '0', 10),
        brand: p.marca,
        imageUrl: p.img_portada,
        images: p.imagenes,
        category: p.categorias?.[0]?.nombre || 'General',
        features: p.caracteristicas,
        resources: p.recursos,
        source: 'syscom'
      };
      this.productsCache.set(cacheKey, { data, expiresAt: now + 5 * 60 * 1000 });
      return data;
    } catch (e) {
      throw new NotFoundException('Product not found in Syscom');
    }
  }

  async createOrder(slug: string, data: any) {
    const tenant = await this.prisma.tenant.findFirst({ 
      where: { storeEnabled: true, hasStoreAccess: true, OR: [{ storeSlug: slug }, { storeCustomDomain: slug }] } 
    });
    if (!tenant) throw new NotFoundException('Store not found');

    const { 
      customerId, customerName, customerPhone,
      street, exteriorNum, neighborhood, zipCode, city, state, references,
      billingRfc, billingName,
      totalAmount, items 
    } = data;
    
    const order = await this.prisma.storeOrder.create({
      data: {
        tenantId: tenant.id,
        customerId,
        customerName,
        customerPhone,
        street,
        exteriorNum,
        neighborhood,
        zipCode,
        city,
        state,
        references,
        billingRfc,
        billingName,
        totalAmount,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            syscomId: item.syscomId,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            satKey: item.satKey || '43222609'
          }))
        }
      },
      include: { items: true, tenant: true }
    });

    try {
      // Create MercadoPago checkout link using tenant's credentials
      if (tenant.mercadopagoAccessToken) {
        const url = await this.createPreference(tenant, order);
        return { order, checkoutUrl: url };
      }
      return { order, checkoutUrl: null };
    } catch (e) {
      this.logger.error("Error creating MercadoPago preference for StoreOrder", e);
      return { order, checkoutUrl: null };
    }
  }

  async generatePaymentLink(slug: string, id: string) {
    const tenant = await this.prisma.tenant.findFirst({ 
      where: { storeEnabled: true, hasStoreAccess: true, OR: [{ storeSlug: slug }, { storeCustomDomain: slug }] } 
    });
    if (!tenant) throw new NotFoundException('Store not found');

    const order = await this.prisma.storeOrder.findFirst({
      where: { id, tenantId: tenant.id },
      include: { items: true, tenant: true }
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PENDING') throw new BadRequestException('Order is already paid or processed');

    try {
      const url = await this.createPreference(tenant, order);
      return { checkoutUrl: url };
    } catch (e) {
      this.logger.error("Error generating MercadoPago link", e);
      throw new BadRequestException('No se pudo generar el link de pago');
    }
  }

  private async createPreference(tenant: any, order: any): Promise<string> {
    const domain = process.env.FRONTEND_URL || 'http://localhost:3000';
    const storeUrl = tenant.storeCustomDomain ? `https://${tenant.storeCustomDomain}` : `${domain}/store/${tenant.storeSlug}`;

    const items = order.items.map((item: any) => ({
      id: String(item.productId || item.syscomId || item.id).substring(0, 250),
      title: String(item.title).substring(0, 250),
      description: `Compra en Tienda: ${String(item.title).substring(0, 230)}`,
      quantity: Number(item.quantity),
      unit_price: Number(item.price),
      currency_id: 'MXN',
    }));

    const body = {
      items,
      back_urls: {
        success: `${storeUrl}/success`,
        failure: storeUrl,
        pending: storeUrl
      },
      auto_return: 'approved',
      external_reference: `STORE_${order.id}`,
    };

    const res = await axios.post('https://api.mercadopago.com/checkout/preferences', body, {
      headers: {
        Authorization: `Bearer ${tenant.mercadopagoAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return res.data.init_point;
  }

  async registerCustomer(slug: string, data: any) {
    const tenant = await this.prisma.tenant.findFirst({ 
      where: { storeEnabled: true, hasStoreAccess: true, OR: [{ storeSlug: slug }, { storeCustomDomain: slug }] } 
    });
    if (!tenant) throw new NotFoundException('Store not found');

    const { email, password, name, phone, companyName, rfc, street, exteriorNum, neighborhood, zipCode, city, state } = data;

    // Ensure email doesn't exist for this tenant
    const existing = await this.prisma.user.findFirst({
      where: { email, tenantId: tenant.id }
    });
    if (existing) throw new BadRequestException('El correo ya está registrado en esta tienda');

    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        companyName,
        rfc,
        street,
        exteriorNum,
        neighborhood,
        zipCode,
        city,
        state,
        role: 'CUSTOMER',
        tenantId: tenant.id
      }
    });

    return { success: true, userId: user.id };
  }

  async getMyOrders(slug: string, userId: string) {
    const tenant = await this.prisma.tenant.findFirst({ 
      where: { storeEnabled: true, hasStoreAccess: true, OR: [{ storeSlug: slug }, { storeCustomDomain: slug }] } 
    });
    if (!tenant) throw new NotFoundException('Store not found');

    return this.prisma.storeOrder.findMany({
      where: { tenantId: tenant.id, customerId: userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}
