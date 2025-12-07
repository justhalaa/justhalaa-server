import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Product } from '../typeORM/entities/product.entity';
import { ProductCategory } from '../typeORM/entities/product-category.entity';
import { User } from '../typeORM/entities/user.entity';
import { FileAttachments } from '../typeORM/entities/file_attachments.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ResponseService } from '../response-service/response-service.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductCategory)
    private categoryRepo: Repository<ProductCategory>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(FileAttachments)
    private fileRepo: Repository<FileAttachments>,
    private responseService: ResponseService,
  ) {}

  async create(userId: number, dto: CreateProductDto) {
    try {
      // Verify user exists and is a service provider
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return this.responseService.error('User not found', 404);
      }

      if (!user.is_service_provider) {
        return this.responseService.error(
          'Only service providers can create products',
          403,
        );
      }

      // Create product instance
      const product = this.productRepo.create({
        name: dto.name,
        description: dto.description,
        price: dto.price,
        isAvailable: dto.isAvailable ?? true,
        user: user,
      });

      // Attach category if provided
      if (dto.categoryId) {
        const category = await this.categoryRepo.findOne({
          where: { id: dto.categoryId },
        });
        if (!category) {
          return this.responseService.error('Category not found', 404);
        }
        product.category = category;
      }

      // Save product first to get the ID
      const savedProduct = await this.productRepo.save(product);

      // Attach images if provided
      if (dto.imageIds && dto.imageIds.length > 0) {
        for (const imageId of dto.imageIds) {
          const file = await this.fileRepo.findOne({ where: { id: imageId } });
          if (file) {
            file.product = savedProduct;
            await this.fileRepo.save(file);
          }
        }
      }

      // Fetch the complete product with relations
      const completeProduct = await this.productRepo.findOne({
        where: { id: savedProduct.id },
        relations: ['user', 'category', 'images'],
      });

      return this.responseService.success(
        'Product created successfully',
        completeProduct,
        201,
      );
    } catch (error) {
      return this.responseService.error(
        `Failed to create product: ${error.message}`,
        500,
      );
    }
  }

  async findAll(query: ProductQueryDto) {
    try {
      const {
        categoryId,
        minPrice,
        maxPrice,
        isAvailable,
        userId,
        search,
        page = 1,
        limit = 10,
      } = query;

      const queryBuilder = this.productRepo
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.user', 'user')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.images', 'images');

      // Apply filters
      if (categoryId) {
        queryBuilder.andWhere('product.categoryId = :categoryId', {
          categoryId,
        });
      }

      if (minPrice !== undefined) {
        queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
      }

      if (maxPrice !== undefined) {
        queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
      }

      if (isAvailable !== undefined) {
        queryBuilder.andWhere('product.isAvailable = :isAvailable', {
          isAvailable,
        });
      }

      if (userId) {
        queryBuilder.andWhere('product.userId = :userId', { userId });
      }

      if (search) {
        queryBuilder.andWhere(
          '(product.name ILIKE :search OR product.description ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Order by creation date (newest first)
      queryBuilder.orderBy('product.createdAt', 'DESC');

      const [products, total] = await queryBuilder.getManyAndCount();

      return this.responseService.success('Products retrieved successfully', {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return this.responseService.error(
        `Failed to retrieve products: ${error.message}`,
        500,
      );
    }
  }

  async findOne(id: number) {
    try {
      const product = await this.productRepo.findOne({
        where: { id },
        relations: ['user', 'category', 'images'],
      });

      if (!product) {
        return this.responseService.error('Product not found', 404);
      }

      return this.responseService.success(
        'Product retrieved successfully',
        product,
      );
    } catch (error) {
      return this.responseService.error(
        `Failed to retrieve product: ${error.message}`,
        500,
      );
    }
  }

  async findByUser(userId: number, query: ProductQueryDto) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return this.responseService.error('User not found', 404);
      }

      // Add userId to query
      const updatedQuery = { ...query, userId };
      return this.findAll(updatedQuery);
    } catch (error) {
      return this.responseService.error(
        `Failed to retrieve user products: ${error.message}`,
        500,
      );
    }
  }

  async update(id: number, userId: number, dto: UpdateProductDto) {
    try {
      const product = await this.productRepo.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!product) {
        return this.responseService.error('Product not found', 404);
      }

      // Verify ownership
      if (product.user.id !== userId) {
        return this.responseService.error(
          'You can only update your own products',
          403,
        );
      }

      // Update basic fields
      if (dto.name) product.name = dto.name;
      if (dto.description) product.description = dto.description;
      if (dto.price !== undefined) product.price = dto.price;
      if (dto.isAvailable !== undefined) product.isAvailable = dto.isAvailable;

      // Update category if provided
      if (dto.categoryId) {
        const category = await this.categoryRepo.findOne({
          where: { id: dto.categoryId },
        });
        if (!category) {
          return this.responseService.error('Category not found', 404);
        }
        product.category = category;
      }

      // Save updated product
      await this.productRepo.save(product);

      // Update images if provided
      if (dto.imageIds) {
        // Remove old image associations
        await this.fileRepo
          .createQueryBuilder()
          .update(FileAttachments)
          .set({ product: null })
          .where('productId = :productId', { productId: id })
          .execute();

        // Add new image associations
        for (const imageId of dto.imageIds) {
          const file = await this.fileRepo.findOne({ where: { id: imageId } });
          if (file) {
            file.product = product;
            await this.fileRepo.save(file);
          }
        }
      }

      // Fetch updated product with relations
      const updatedProduct = await this.productRepo.findOne({
        where: { id },
        relations: ['user', 'category', 'images'],
      });

      return this.responseService.success(
        'Product updated successfully',
        updatedProduct,
      );
    } catch (error) {
      return this.responseService.error(
        `Failed to update product: ${error.message}`,
        500,
      );
    }
  }

  async remove(id: number, userId: number) {
    try {
      const product = await this.productRepo.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!product) {
        return this.responseService.error('Product not found', 404);
      }

      // Verify ownership
      if (product.user.id !== userId) {
        return this.responseService.error(
          'You can only delete your own products',
          403,
        );
      }

      // Remove image associations
      await this.fileRepo
        .createQueryBuilder()
        .update(FileAttachments)
        .set({ product: null })
        .where('productId = :productId', { productId: id })
        .execute();

      // Delete product
      await this.productRepo.remove(product);

      return this.responseService.success('Product deleted successfully', null);
    } catch (error) {
      return this.responseService.error(
        `Failed to delete product: ${error.message}`,
        500,
      );
    }
  }

  // Category management methods
  async createCategory(dto: CreateCategoryDto) {
    try {
      const existingCategory = await this.categoryRepo.findOne({
        where: { name: dto.name },
      });

      if (existingCategory) {
        return this.responseService.error('Category already exists', 400);
      }

      const category = this.categoryRepo.create(dto);
      const savedCategory = await this.categoryRepo.save(category);

      return this.responseService.success(
        'Category created successfully',
        savedCategory,
        201,
      );
    } catch (error) {
      return this.responseService.error(
        `Failed to create category: ${error.message}`,
        500,
      );
    }
  }

  async findAllCategories() {
    try {
      const categories = await this.categoryRepo.find({
        relations: ['products'],
      });

      return this.responseService.success(
        'Categories retrieved successfully',
        categories,
      );
    } catch (error) {
      return this.responseService.error(
        `Failed to retrieve categories: ${error.message}`,
        500,
      );
    }
  }

  async findCategory(id: number) {
    try {
      const category = await this.categoryRepo.findOne({
        where: { id },
        relations: ['products'],
      });

      if (!category) {
        return this.responseService.error('Category not found', 404);
      }

      return this.responseService.success(
        'Category retrieved successfully',
        category,
      );
    } catch (error) {
      return this.responseService.error(
        `Failed to retrieve category: ${error.message}`,
        500,
      );
    }
  }
}
