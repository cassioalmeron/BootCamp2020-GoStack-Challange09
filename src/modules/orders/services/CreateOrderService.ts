import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import { Key } from 'readline';
import Product from '@modules/products/infra/typeorm/entities/Product';
import { stringify } from 'querystring';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';
import ICreateOrderDTO from '../dtos/ICreateOrderDTO';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

interface IItem {
  id: string;
  quantity: number;
  index: number;
  product?: Product;
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) throw new AppError('The customer does not exists!');

    let items: IItem[] = products.map((product, index) => {
      return {
        id: product.id,
        quantity: product.quantity,
        index,
      };
    });

    const productsExists = await this.productsRepository.findAllById(items);

    items = items.map((item, index) => {
      const productIndex = productsExists.findIndex(x => x.id === item.id);

      let product: Product | null = null;
      if (productIndex >= 0) product = productsExists[productIndex];

      return { id: item.id, quantity: item.quantity, index, product } as IItem;
    }) as IItem[];

    const itemsDoesNotExists = items.filter(item => !item.product);
    if (itemsDoesNotExists.length > 0)
      throw new AppError(
        `Items ${itemsDoesNotExists
          .map(x => x.index + 1)
          .join(', ')}: product does not exists`,
      );

    const groupedItems: {
      [Key: string]: { product: Product; quantity: number };
    } = {};
    items.forEach(item => {
      if (!item.product) return;

      if (!groupedItems[item.product.id])
        groupedItems[item.product.id] = { product: item.product, quantity: 0 };
      else groupedItems[item.product.id].product = item.product;

      groupedItems[item.product.id].quantity += item.quantity;
    });

    const notEnoughtStockItems: any[] = [];

    for (const key in groupedItems) {
      const groupedItem = groupedItems[key];
      if (groupedItem.quantity > groupedItem.product.quantity)
        notEnoughtStockItems.push({
          product: groupedItem.product,
          quantity: groupedItem.quantity,
        });
    }

    if (notEnoughtStockItems.length > 0)
      throw new AppError(
        `Products ${notEnoughtStockItems
          .map(x => x.product.name + 1)
          .join(', ')}: not enought stock`,
      );

    const orderDto: ICreateOrderDTO = {
      customer,
      products: items.map(item => {
        return {
          product_id: item.id,
          price: Number(item.product?.price),
          quantity: item.quantity,
        };
      }),
    };

    const order = await this.ordersRepository.create(orderDto);
    const updateQuantity = items.map(item => {
      return {
        id: item.id,
        quantity: Number(item.product?.quantity) - item.quantity,
      };
    });
    await this.productsRepository.updateQuantity(updateQuantity);

    return order;
  }
}

export default CreateOrderService;
