import type { NewUserAddress } from "../db/schema/users.schema.js";
// Removed for DI
import { NotFoundError } from "../utils/error.util.js";

export class AddressService {
  constructor(
    private readonly addressRepository: typeof import("../repositories/address.repository.js").addressRepository,
  ) {}

  async getUserAddresses(userId: string) {
    return await this.addressRepository.findByUserId(userId);
  }

  async getAddressById(id: string, userId: string) {
    const address = await this.addressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new NotFoundError("Address");
    }
    return address;
  }

  async createAddress(userId: string, data: Omit<NewUserAddress, "userId">) {
    const address = await this.addressRepository.createAddress({
      ...data,
      userId,
    });
    if (!address) {
      throw new Error("Failed to create address");
    }
    // If this is the user's first address or marked as default, set it as default
    if (data.isDefault) {
      await this.addressRepository.setAsDefault(address.id, userId);
    }

    return address;
  }

  async updateAddress(
    id: string,
    userId: string,
    data: Partial<NewUserAddress>,
  ) {
    const address = await this.addressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new NotFoundError("Address");
    }

    const updatedAddress = await this.addressRepository.updateAddress(id, data);

    // If setting as default, update other addresses
    if (data.isDefault) {
      await this.addressRepository.setAsDefault(id, userId);
    }

    return updatedAddress;
  }

  async setDefaultAddress(id: string, userId: string) {
    const address = await this.addressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new NotFoundError("Address");
    }

    return await this.addressRepository.setAsDefault(id, userId);
  }

  async deleteAddress(id: string, userId: string) {
    const address = await this.addressRepository.findByIdAndUserId(id, userId);
    if (!address) {
      throw new NotFoundError("Address");
    }

    const deletedAddress = await this.addressRepository.deleteAddress(
      id,
      userId,
    );
    return deletedAddress;
  }
}

import { addressRepository } from "../repositories/address.repository.js";
export const addressService = new AddressService(addressRepository);
