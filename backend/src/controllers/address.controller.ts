import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  type AddressService,
  addressService,
} from '../services/address.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { errorResponse, successResponse } from '../utils/response.util.js';

export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  getMyAddresses = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const addresses = await this.addressService.getUserAddresses(userId);
    return successResponse(res, addresses, 'Addresses retrieved successfully');
  });

  getAddressDetail = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Address ID',
        'ADDRESS_ID_INVALID',
      );
    }
    const userId = req.user?.id;
    const address = await this.addressService.getAddressById(
      parsedId.data,
      userId,
    );
    return successResponse(
      res,
      address,
      'Address details retrieved successfully',
    );
  });

  createAddress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const address = await this.addressService.createAddress(userId, req.body);
    return successResponse(res, address, 'Address created successfully', 201);
  });

  updateAddress = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Address ID',
        'ADDRESS_ID_INVALID',
      );
    }
    const userId = req.user?.id;
    const address = await this.addressService.updateAddress(
      parsedId.data,
      userId,
      req.body,
    );
    return successResponse(res, address, 'Address updated successfully');
  });

  setDefaultAddress = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Address ID',
        'ADDRESS_ID_INVALID',
      );
    }
    const userId = req.user?.id;
    const address = await this.addressService.setDefaultAddress(
      parsedId.data,
      userId,
    );
    return successResponse(res, address, 'Default address set successfully');
  });

  deleteAddress = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Address ID',
        'ADDRESS_ID_INVALID',
      );
    }
    const userId = req.user?.id;
    await this.addressService.deleteAddress(parsedId.data, userId);
    return successResponse(res, null, 'Address deleted successfully');
  });
}

export const addressController = new AddressController(addressService);
