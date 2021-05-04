import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    const nameAlreadyExists = await this.productsRepository.findByName(name);
    if (nameAlreadyExists) throw new AppError('E-mail already exists!');

    const customer = await this.productsRepository.create({
      name,
      price,
      quantity,
    });

    return customer;
  }
}

export default CreateProductService;
