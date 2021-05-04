import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findCustomer = await this.ormRepository.findOne({ name });

    return findCustomer;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findCustomer = await this.ormRepository.findByIds(products);

    return findCustomer;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsToUpdate = await this.ormRepository.findByIds(
      products.map(item => item.id),
    );

    for (const i in productsToUpdate) {
      const product = productsToUpdate[i];
      const item = products.find(x => x.id === product.id);
      if (item) {
        product.quantity = item?.quantity;
        await this.ormRepository.save(product);
      }
    }

    return productsToUpdate;
  }
}

export default ProductsRepository;
