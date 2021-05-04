import { Request, Response } from 'express';
import { classToClass } from 'class-transformer';

import { container } from 'tsyringe';

import CreateOrderService from '@modules/orders/services/CreateOrderService';
import FindOrderService from '@modules/orders/services/FindOrderService';

export default class OrdersController {
  public async show(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    console.log('id', id);
    const service = container.resolve(FindOrderService);
    const order = await service.execute({ id });
    console.log('order', order);
    return response.json(order);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const service = container.resolve(CreateOrderService);
    const order = await service.execute(request.body);
    return response.status(201).json(classToClass(order));
  }
}
