export interface Supplier {
  supplierId: string;
  name: string;
  isPlatformApproved: boolean;
  rating: number;
}

export interface WholesaleProduct {
  productId: string;
  supplierId: string;
  ingredientId: string;
  name: string;
  pricePerUnit: number;
  minimumOrderQuantity: number;
  unit: string;
}

export interface WholesaleOrder {
  orderId: string;
  restaurantId: string;
  supplierId: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  orderDate: Date;
  status: 'PENDING' | 'ACCEPTED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}

export class B2BMarketplaceEngine {
  private suppliers: Map<string, Supplier> = new Map();
  private products: WholesaleProduct[] = [];
  private orders: WholesaleOrder[] = [];

  /**
   * Registers a new platform-approved supplier.
   */
  public registerSupplier(supplier: Supplier): void {
    if (!supplier.isPlatformApproved) {
      throw new Error("Only platform-approved suppliers can be registered.");
    }
    this.suppliers.set(supplier.supplierId, supplier);
  }

  /**
   * Adds a product to the marketplace catalog.
   */
  public addProduct(product: WholesaleProduct): void {
    if (!this.suppliers.has(product.supplierId)) {
      throw new Error("Supplier is not registered or approved in the marketplace.");
    }
    this.products.push(product);
  }

  /**
   * Searches for products based on ingredient ID.
   */
  public searchProductsByIngredient(ingredientId: string): WholesaleProduct[] {
    return this.products.filter(p => p.ingredientId === ingredientId);
  }

  /**
   * Places a wholesale order directly with a supplier.
   */
  public placeOrder(
    restaurantId: string,
    productId: string,
    quantity: number
  ): WholesaleOrder {
    const product = this.products.find(p => p.productId === productId);
    if (!product) {
      throw new Error("Product not found in marketplace.");
    }

    if (quantity < product.minimumOrderQuantity) {
      throw new Error(`Quantity ${quantity} is below the minimum order quantity of ${product.minimumOrderQuantity}.`);
    }

    const supplier = this.suppliers.get(product.supplierId);
    if (!supplier || !supplier.isPlatformApproved) {
      throw new Error("Supplier is no longer approved on the platform.");
    }

    const totalPrice = product.pricePerUnit * quantity;

    const newOrder: WholesaleOrder = {
      orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      restaurantId,
      supplierId: product.supplierId,
      productId,
      quantity,
      totalPrice,
      orderDate: new Date(),
      status: 'PENDING'
    };

    this.orders.push(newOrder);
    return newOrder;
  }

  /**
   * Gets all orders for a specific restaurant.
   */
  public getRestaurantOrders(restaurantId: string): WholesaleOrder[] {
    return this.orders.filter(o => o.restaurantId === restaurantId);
  }
}
