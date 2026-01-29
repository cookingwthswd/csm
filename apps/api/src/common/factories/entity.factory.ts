/**
 * EntityFactory - Abstract Factory for Entity Creation
 *
 * Base class cho các factory tạo entities (Orders, Shipments, Batches, etc.)
 * Cung cấp common functionality như code generation.
 *
 * USAGE:
 * ```typescript
 * @Injectable()
 * export class OrderFactory extends EntityFactory<Order, CreateOrderDto> {
 *   constructor(
 *     private supabase: SupabaseService,
 *     private codeGenerator: CodeGeneratorService,
 *   ) {
 *     super();
 *   }
 *
 *   async create(dto: CreateOrderDto, ctx: EntityContext): Promise<Order> {
 *     const orderCode = this.codeGenerator.generate('ORD');
 *     // ... insert logic
 *   }
 * }
 * ```
 */

/**
 * Context passed to factory methods
 * Contains user info for audit trails and data isolation
 */
export interface EntityContext {
  /** User ID from JWT */
  userId: string;
  /** Store ID for data isolation (optional) */
  storeId?: number | null;
  /** User role for permission checks */
  role?: string;
}

/**
 * Abstract base class for entity factories
 *
 * @template TEntity - The entity type being created
 * @template TCreateDto - The DTO type for creation
 */
export abstract class EntityFactory<TEntity, TCreateDto> {
  /**
   * Create a new entity from DTO
   * Must be implemented by subclasses
   *
   * @param dto - Creation data
   * @param ctx - User context (userId, chainId, role)
   * @returns Created entity
   */
  abstract create(dto: TCreateDto, ctx: EntityContext): Promise<TEntity>;

  /**
   * Optional: Update an existing entity
   * Override in subclass if needed
   */
  async update?(
    id: number,
    dto: Partial<TCreateDto>,
    ctx: EntityContext,
  ): Promise<TEntity>;

  /**
   * Optional: Delete/deactivate an entity
   * Override in subclass if needed
   */
  async delete?(id: number, ctx: EntityContext): Promise<void>;
}
