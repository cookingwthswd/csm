import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { UpdateRecipeDto } from './dto/recipe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth';

@ApiTags('recipes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private service: RecipesService) {}

  @Get()
  @Roles('admin', 'manager', 'ck_staff')
  @ApiOperation({ summary: 'List products with recipes' })
  async getRecipes() {
    return this.service.findAll();
  }

  @Get(':productId')
  @Roles('admin', 'manager', 'ck_staff')
  @ApiOperation({ summary: 'Get recipe for a product' })
  async getRecipe(@Param('productId', ParseIntPipe) productId: number) {
    return this.service.findByProductId(productId);
  }

  @Post()
  @Roles('admin', 'manager', 'ck_staff')
  @ApiOperation({ summary: 'Create or update recipe for a product' })
  async saveRecipe(@Body() dto: UpdateRecipeDto) {
    return this.service.saveRecipe(dto);
  }

  @Delete('detail/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Delete a single recipe line item' })
  async deleteRecipeDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteRecipeDetail(id);
  }
}
