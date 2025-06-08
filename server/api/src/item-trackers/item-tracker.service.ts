import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ItemTracker, ItemTrackerDto } from './item-tracker.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from '../items/item.entity';

@Injectable()
export class ItemTrackerService {
  constructor(
    @InjectRepository(ItemTracker)
    private itemTrackerRepository: Repository<ItemTracker>,
  ) {}

  async create(itemTrackerDto: ItemTrackerDto, userId: number) {
    // Check if they have too many itemTrackers
    const count = await this.itemTrackerRepository.countBy({ userId });
    if (count > 500) {
      throw new BadRequestException();
    }

    // Create it
    const { itemId, wts, price, requirePrice } = itemTrackerDto;
    const { id } = await this.itemTrackerRepository.save({
      userId,
      itemId,
      wts,
      requirePrice,
      priceValue: price.value,
      priceOperator: price.operator,
    });

    const createdItemTracker = await this.itemTrackerRepository.findOne({
      where: { id },
      relations: { item: true },
    });

    // Return the created item tracker
    return this.mapToDto(createdItemTracker);
  }

  async update(id: number, userId: number, itemTrackerDto: ItemTrackerDto) {
    // Make sure we can update it
    const existsAndOwnedByUser = await this.itemTrackerRepository.exists({
      where: { id, userId },
    });
    if (!existsAndOwnedByUser) {
      throw new BadRequestException('Not found');
    }

    // Update it
    const { itemId, wts, price, requirePrice } = itemTrackerDto;
    await this.itemTrackerRepository.update(
      { id },
      {
        userId,
        itemId,
        wts,
        requirePrice,
        priceValue: price.value,
        priceOperator: price.operator,
      },
    );

    // Return the updated item tracker
    const updated = await this.itemTrackerRepository.findOne({
      where: { id },
      relations: { item: true },
    });
    return this.mapToDto(updated);
  }

  async getByUserId(userId: number) {
    const itemTrackers = await this.itemTrackerRepository.find({
      where: { userId },
      relations: { item: true },
    });
    return itemTrackers.map((itemTracker) => this.mapToDto(itemTracker));
  }

  async deleteById(id: number, userId: number) {
    const existsAndOwnedByUser = await this.itemTrackerRepository.exists({
      where: { id, userId },
    });
    if (!existsAndOwnedByUser) {
      throw new BadRequestException('Not found');
    }
    await this.itemTrackerRepository.delete({ id, userId });
  }

  mapToDto(itemTracker: ItemTracker): ItemTrackerDto {
    if (!itemTracker) {
      return null;
    }

    let item: Partial<Item> | undefined = undefined;
    if (itemTracker.item) {
      const { id, name, icon, itemtype } = itemTracker.item;
      item = { id, name, icon, itemtype };
    }

    return {
      id: itemTracker.id,
      itemId: itemTracker.itemId,
      wts: itemTracker.wts,
      requirePrice: itemTracker.requirePrice,
      price: {
        value: itemTracker.priceValue,
        operator: itemTracker.priceOperator,
      },
      item,
    };
  }
}
