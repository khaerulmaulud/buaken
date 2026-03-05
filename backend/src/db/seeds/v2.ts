import bcrypt from 'bcryptjs';
import { db } from '../index.js';
import { complaints } from '../schema/complaints.schema.js';
import { courierProfiles } from '../schema/couriers.schema.js';
import {
  categories,
  menuItems,
  merchants,
} from '../schema/merchants.schema.js';
import { orderItems, orders } from '../schema/orders.schema.js';
import { reviews } from '../schema/reviews.schema.js';
import { userAddresses, users } from '../schema/users.schema.js';

const firstNames = [
  'Budi',
  'Siti',
  'Agus',
  'Dewi',
  'Ahmad',
  'Rina',
  'Joko',
  'Ayu',
  'Rudi',
  'Putri',
  'Andi',
  'Nina',
  'Eko',
  'Sari',
  'Hendro',
  'Lestari',
  'Bambang',
  'Wati',
  'Surya',
  'Mega',
  'Tariq',
  'Fatima',
  'Reza',
  'Dina',
  'Iwan',
  'Ratna',
  'Yudi',
  'Lina',
  'Aris',
  'Maya',
];
const lastNames = [
  'Santoso',
  'Wijaya',
  'Kusuma',
  'Pratama',
  'Setiawan',
  'Nugroho',
  'Saputra',
  'Permana',
  'Hidayat',
  'Purnama',
  'Wibowo',
  'Susanto',
  'Gunawan',
  'Putra',
  'Siregar',
  'Pangestu',
  'Suharto',
  'Ramadhan',
  'Lubis',
  'Halim',
];
const streets = [
  'Sudirman',
  'Thamrin',
  'Gatot Subroto',
  'Kuningan',
  'Kemang',
  'Senayan',
  'Menteng',
  'Kebayoran',
  'Pondok Indah',
  'Kelapa Gading',
  'Pluit',
  'PIK',
  'BSD',
  'Bintaro',
  'Cibubur',
];
const cities = [
  'Jakarta Pusat',
  'Jakarta Selatan',
  'Jakarta Barat',
  'Jakarta Utara',
  'Jakarta Timur',
];
const storeAdjectives = [
  'Warung',
  'Kedai',
  'Restoran',
  'Depot',
  'Pondok',
  'Dapur',
  'Bistro',
  'Kafe',
  'Catering',
];
const storeNouns = [
  'Rasa',
  'Berkah',
  'Makmur',
  'Sederhana',
  'Nusantara',
  'Mantap',
  'Enak',
  'Lezat',
  'Nikmat',
  'Keluarga',
];
const foodNames = [
  'Nasi Goreng',
  'Mie Goreng',
  'Ayam Bakar',
  'Sate Ayam',
  'Soto Ayam',
  'Bakso',
  'Gado-Gado',
  'Rendang',
  'Nasi Padang',
  'Ayam Geprek',
  'Martabak',
  'Sate Kambing',
  'Es Teh',
  'Kopi Susu',
  'Jus Jeruk',
  'Es Campur',
  'Pizza',
  'Burger',
  'Spaghetti',
  'Sushi',
  'Dimsum',
];
const foodAdjectives = [
  'Spesial',
  'Pedas',
  'Manis',
  'Asin',
  'Gurih',
  'Extra',
  'Jumbo',
  'Biasa',
  'Super',
  'Original',
];

const foodImages = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1484723091791-0fee59ca0b28?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1543353071-087092ec393a?w=500&h=500&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&h=500&fit=crop',
];

const restaurantBanners = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1466978913421-bac2e5e75ebe?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1521017430058-1e711892be1e?w=1200&h=400&fit=crop',
];

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const generatePhone = () =>
  `+628${Math.floor(100000000 + Math.random() * 900000000).toString()}`;

export const resetDatabaseV2 = async () => {
  console.log('🗑️  Resetting database (V2 Massive Data)...');
  await db.delete(complaints);
  await db.delete(reviews);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(menuItems);
  await db.delete(merchants);
  await db.delete(courierProfiles);
  await db.delete(userAddresses);
  await db.delete(users);
  await db.delete(categories);
  console.log('✅ All tables cleared\n');
};

export const seedDatabaseV2 = async () => {
  try {
    console.log('🌱 Starting database seeding (V2 Production Simulation)...\n');
    await resetDatabaseV2();

    // 1. Categories
    console.log('📦 Seeding Categories...');
    const categoryDataInputs = [
      {
        name: 'Indonesian',
        slug: 'indonesian',
        iconUrl:
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRx7T7ja9kKi-LYpOw7tMUnaPpLYP_YPl6fIg&s',
      },
      {
        name: 'Western',
        slug: 'western',
        iconUrl: 'https://img.icons8.com/fluency/48/hamburger.png',
      },
      {
        name: 'Japanese',
        slug: 'japanese',
        iconUrl: 'https://img.icons8.com/fluency/48/sushi.png',
      },
      {
        name: 'Chinese',
        slug: 'chinese',
        iconUrl: 'https://img.icons8.com/fluency/48/dim-sum.png',
      },
      {
        name: 'Italian',
        slug: 'italian',
        iconUrl: 'https://img.icons8.com/fluency/48/pizza.png',
      },
      {
        name: 'Fast Food',
        slug: 'fast-food',
        iconUrl: 'https://img.icons8.com/fluency/48/french-fries.png',
      },
      {
        name: 'Beverages',
        slug: 'beverages',
        iconUrl: 'https://img.icons8.com/fluency/48/iced-coffee.png',
      },
      {
        name: 'Desserts',
        slug: 'desserts',
        iconUrl: 'https://img.icons8.com/fluency/48/cake.png',
      },
      {
        name: 'Healthy',
        slug: 'healthy',
        iconUrl: 'https://img.icons8.com/fluency/48/salad.png',
      },
      {
        name: 'Seafood',
        slug: 'seafood',
        iconUrl: 'https://img.icons8.com/fluency/48/crab.png',
      },
    ];
    const insertedCategories = await db
      .insert(categories)
      .values(categoryDataInputs)
      .returning();

    // 2. Users (350+ Users)
    console.log('👥 Seeding Users (350+ users)...');
    const hashedPassword = await bcrypt.hash('Password123', 10);
    const usersBatch: any[] = [];

    // Core users
    usersBatch.push({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin Super',
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=Admin&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`,
      phone: '+628000000000',
      role: 'admin' as const,
      isVerified: true,
      isActive: true,
    });
    usersBatch.push({
      email: 'customer@example.com',
      password: hashedPassword,
      name: 'John Customer',
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=John&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`,
      phone: '+628123456789',
      role: 'customer' as const,
      isVerified: true,
      isActive: true,
    });
    usersBatch.push({
      email: 'merchant1@example.com',
      password: hashedPassword,
      name: 'Budi (Padang)',
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=Budi&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`,
      phone: '+622112340001',
      role: 'merchant' as const,
      isVerified: true,
      isActive: true,
    });
    usersBatch.push({
      email: 'courier1@example.com',
      password: hashedPassword,
      name: 'Agus Courier',
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=Agus&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`,
      phone: '+628987654001',
      role: 'courier' as const,
      isVerified: true,
      isActive: true,
    });

    // Generate 200 Customers
    for (let i = 0; i < 200; i++) {
      const name = `${getRandom(firstNames)} ${getRandom(lastNames)}`;
      usersBatch.push({
        email: `customer_${i}@example.com`,
        password: hashedPassword,
        name: name,
        avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${name.replace(' ', '')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
        phone: generatePhone(),
        role: 'customer' as const,
        isVerified: true,
        isActive: true,
      });
    }

    // Generate 50 Merchants
    for (let i = 0; i < 50; i++) {
      const name = `${getRandom(firstNames)} ${getRandom(lastNames)}`;
      usersBatch.push({
        email: `merchant_${i}@example.com`,
        password: hashedPassword,
        name: name,
        avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${name.replace(' ', '')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
        phone: generatePhone(),
        role: 'merchant' as const,
        isVerified: true,
        isActive: true,
      });
    }

    // Generate 100 Couriers
    for (let i = 0; i < 100; i++) {
      const name = `${getRandom(firstNames)} ${getRandom(lastNames)}`;
      usersBatch.push({
        email: `courier_${i}@example.com`,
        password: hashedPassword,
        name: name,
        avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${name.replace(' ', '')}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
        phone: generatePhone(),
        role: 'courier' as const,
        isVerified: true,
        isActive: true,
      });
    }

    // Batch insert users to avoid parameter limits (Postgres limit is 65535 parameters)
    // 350 rows * 7 params = 2450 params, well within limits.
    const insertedUsers = await db.insert(users).values(usersBatch).returning();
    const customers = insertedUsers.filter((u) => u.role === 'customer');
    const merchantsArr = insertedUsers.filter((u) => u.role === 'merchant');
    const couriersArr = insertedUsers.filter((u) => u.role === 'courier');

    // 3. Courier Profiles
    console.log('🏍️  Seeding Courier Profiles...');
    const courierProfilesBatch = couriersArr.map((c) => ({
      userId: c.id,
      vehicleType: getRandom(['motorcycle', 'bicycle', 'car']) as any,
      vehicleNumber: `B ${randomInt(1000, 9999)} ${getRandom(['ABC', 'XYZ', 'DEF'])}`,
      isOnline: Math.random() > 0.3,
      rating: (randomInt(40, 50) / 10).toString(),
      totalDeliveries: randomInt(10, 1500),
      currentLatitude: `-${(6.1 + Math.random() * 0.2).toFixed(4)}`, // Random around Jakarta
      currentLongitude: `106.${(75 + Math.random() * 15).toFixed(2).replace('.', '')}`,
    }));
    await db.insert(courierProfiles).values(courierProfilesBatch);

    // 4. Customer Addresses
    console.log('🏠 Seeding Customer Addresses...');
    const addressBatch = customers.map((c) => ({
      userId: c.id,
      label: getRandom(['Home', 'Office', 'Apartment']),
      addressLine: `Jl. ${getRandom(streets)} No. ${randomInt(1, 200)}`,
      latitude: `-${(6.1 + Math.random() * 0.2).toFixed(4)}`,
      longitude: `106.${(75 + Math.random() * 15).toFixed(2).replace('.', '')}`,
      city: getRandom(cities),
      postalCode: `10${randomInt(100, 900)}`,
      isDefault: true,
    }));
    const insertedAddresses = await db
      .insert(userAddresses)
      .values(addressBatch)
      .returning();

    // 5. Merchant Profiles
    console.log('🏪 Seeding Merchants...');
    const merchantProfilesBatch = merchantsArr.map((m) => ({
      userId: m.id,
      storeName: `${getRandom(storeAdjectives)} ${getRandom(storeNouns)}`,
      description:
        'Makanan berkualitas dengan rasa yang autentik dan harga terjangkau.',
      addressLine: `Jl. ${getRandom(streets)} No. ${randomInt(1, 200)}`,
      city: getRandom(cities),
      phone: m.phone,
      isOpen: Math.random() > 0.1,
      openingTime: '08:00',
      closingTime: '22:00',
      estimatedDeliveryTime: randomInt(15, 60),
      deliveryFee: (randomInt(5, 25) * 1000).toString(),
      minOrder: (randomInt(2, 5) * 10000).toString(),
      latitude: `-${(6.1 + Math.random() * 0.2).toFixed(4)}`,
      longitude: `106.${(75 + Math.random() * 15).toFixed(2).replace('.', '')}`,
      logoUrl: getRandom(foodImages),
      bannerUrl: getRandom(restaurantBanners),
    }));
    const insertedStoreProfiles = await db
      .insert(merchants)
      .values(merchantProfilesBatch)
      .returning();

    // 6. Menu Items
    console.log('🍔 Seeding Menu Items...');
    const menuItemsBatch: any[] = [];
    insertedStoreProfiles.forEach((m) => {
      const totalItems = randomInt(5, 15);
      for (let i = 0; i < totalItems; i++) {
        menuItemsBatch.push({
          merchantId: m.id,
          categoryId: getRandom(insertedCategories).id,
          name: `${getRandom(foodNames)} ${getRandom(foodAdjectives)}`,
          description: 'Lezat dan nikmat dengan porsi pas.',
          price: (randomInt(15, 150) * 1000).toString(),
          imageUrl: getRandom(foodImages),
          isAvailable: Math.random() > 0.1,
          preparationTime: randomInt(5, 30),
          stock: randomInt(10, 100),
        });
      }
    });

    const chunkSize = 100;
    const insertedMenuItemsArray: any[] = [];
    for (let i = 0; i < menuItemsBatch.length; i += chunkSize) {
      const chunk = menuItemsBatch.slice(i, i + chunkSize);
      const res = await db.insert(menuItems).values(chunk).returning();
      insertedMenuItemsArray.push(...res);
    }

    // 7. Orders & Order Items
    console.log('📦 Seeding Orders (~1000 orders) & 🍕 Order Items...');
    const ordersBatch: any[] = [];
    const orderItemsBatch: any[] = [];
    const statuses = [
      'delivered',
      'delivered',
      'delivered',
      'delivered',
      'cancelled',
      'cancelled',
      'on_delivery',
      'preparing',
      'pending',
    ];
    const paymentMethods = [
      'digital_wallet',
      'digital_wallet',
      'cash',
      'bank_transfer',
    ];

    // Pre-calculate orders with items to ensure totals match
    for (let i = 0; i < 1000; i++) {
      const customerAddress = getRandom(insertedAddresses);
      const merchant = getRandom(insertedStoreProfiles);
      const status = getRandom(statuses);
      const merchantItems = insertedMenuItemsArray.filter(
        (m) => m.merchantId === merchant.id,
      );

      let subtotal = 0;
      const selectedItems: any[] = [];

      if (merchantItems.length > 0) {
        const numItems = randomInt(1, 4);
        for (let j = 0; j < numItems; j++) {
          const item = getRandom(merchantItems);
          const qty = randomInt(1, 3);
          subtotal += parseFloat(item.price) * qty;
          selectedItems.push({ item, qty });
        }
      }

      const deliveryFee = parseFloat(merchant.deliveryFee || '10000');
      const serviceFee = 2000;
      const totalAmount = subtotal + deliveryFee + serviceFee;
      const orderId = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36); // Hacky UUID gen

      ordersBatch.push({
        id: orderId,
        orderNumber: Math.random().toString(36).substring(2, 12).toUpperCase(),
        customerId: customerAddress.userId,
        merchantId: merchant.id,
        courierId:
          status === 'delivered' || status === 'on_delivery'
            ? getRandom(couriersArr).id
            : null,
        deliveryAddressId: customerAddress.id,
        subtotal: subtotal.toString(),
        deliveryFee: deliveryFee.toString(),
        serviceFee: serviceFee.toString(),
        totalAmount: totalAmount.toString(),
        status: status as any,
        paymentMethod: getRandom(paymentMethods) as any,
        paymentStatus:
          status === 'cancelled' || status === 'pending'
            ? 'pending'
            : ('paid' as any),
        createdAt: new Date(Date.now() - randomInt(100000, 10000000000)),
      });

      // Queue order items
      selectedItems.forEach((si) => {
        orderItemsBatch.push({
          orderId: orderId,
          menuItemId: si.item.id,
          quantity: si.qty,
          price: si.item.price,
        });
      });
    }

    const insertedOrders: any[] = [];
    for (let i = 0; i < ordersBatch.length; i += chunkSize) {
      const chunk = ordersBatch.slice(i, i + chunkSize);
      const res = await db.insert(orders).values(chunk).returning();
      insertedOrders.push(...res);
    }

    for (let i = 0; i < orderItemsBatch.length; i += chunkSize) {
      const chunk = orderItemsBatch.slice(i, i + chunkSize);
      await db.insert(orderItems).values(chunk);
    }

    // 9. Reviews
    console.log('⭐ Seeding Reviews...');
    const deliveredOrders = insertedOrders.filter(
      (o) => o.status === 'delivered',
    );
    const reviewsBatch: any[] = [];
    const comments = [
      'Enak banget!',
      'Pengiriman cepat.',
      'Porsinya pas.',
      'Agak dingin tapi masih enak.',
      'Luar biasa rasanya',
      'Pasti pesen lagi.',
      'Standar aja.',
      'Wah gila sih ini mantap.',
    ];

    // Create reviews for about 70% of delivered orders
    deliveredOrders
      .slice(0, Math.floor(deliveredOrders.length * 0.7))
      .forEach((o) => {
        const rating = randomInt(3, 5);
        reviewsBatch.push({
          orderId: o.id,
          customerId: o.customerId,
          merchantId: o.merchantId,
          rating: rating,
          comment: rating >= 4 ? getRandom(comments) : 'Kurang memuaskan.',
          createdAt: new Date(
            o.createdAt.getTime() + randomInt(3600000, 86400000),
          ),
        });
      });

    for (let i = 0; i < reviewsBatch.length; i += chunkSize) {
      const chunk = reviewsBatch.slice(i, i + chunkSize);
      await db.insert(reviews).values(chunk);
    }

    // 10. Complaints
    console.log('📢 Seeding Complaints...');
    const complaintsBatch: any[] = [];
    for (let i = 0; i < 50; i++) {
      const order = getRandom(insertedOrders);
      complaintsBatch.push({
        reporterId: order.customerId,
        category: getRandom([
          'order_not_received',
          'quality_issue',
          'payment_problem',
          'other',
        ]) as any,
        subject: `Masalah pesanan ${order.orderNumber}`,
        description: 'Ada bagian yang kurang atau tidak sesuai.',
        status: getRandom(['pending', 'in_review', 'resolved']) as any,
      });
    }
    await db.insert(complaints).values(complaintsBatch);

    console.log('✨ Seed V2 executed successfully!\n');
    console.log(`📊 PRODUCTION SIMULATION SUMMARY:`);
    console.log(
      `- Users: ${usersBatch.length} (Admin: 1, Customers: 201, Merchants: 51, Couriers: 101)`,
    );
    console.log(`- Addresses: ${addressBatch.length}`);
    console.log(`- Stores: ${merchantProfilesBatch.length}`);
    console.log(`- Menu Items: ${insertedMenuItemsArray.length}`);
    console.log(`- Orders: ${ordersBatch.length}`);
    console.log(`- Order Items: ${orderItemsBatch.length}`);
    console.log(`- Reviews: ${reviewsBatch.length}`);
    console.log(`- Complaints: ${complaintsBatch.length}`);
  } catch (err) {
    console.error('❌ V2 Seed Error:', err);
    throw err;
  }
};
