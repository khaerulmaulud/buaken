// import { db } from "./index.js";
// import { complaints } from "./schema/complaints.schema.js";
// import { courierProfiles } from "./schema/couriers.schema.js";
// import { categories, menuItems, merchants } from "./schema/merchants.schema.js";
// import { orderItems, orders } from "./schema/orders.schema.js";
// import { reviews } from "./schema/reviews.schema.js";
// import { userAddresses, users } from "./schema/users.schema.js";

import { seedDatabaseV2 } from './seeds/v2.js';

/**
 * Database Seeding Script
 * Drops all data and populates with initial test data
 */

// const resetDatabase = async () => {
//   console.log('🗑️  Resetting database...');

//   // Delete in order respecting foreign keys
//   await db.delete(complaints);
//   await db.delete(reviews);
//   await db.delete(orderItems);
//   await db.delete(orders);
//   await db.delete(menuItems);
//   await db.delete(merchants);
//   await db.delete(courierProfiles);
//   await db.delete(userAddresses);
//   await db.delete(users);
//   await db.delete(categories);

//   console.log('✅ All tables cleared\n');
// };

/* --- OLD SEED V1 ---
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Reset database first
    await resetDatabase();

    // 1. Seed Categories
    console.log('📁 Seeding categories...');
    const categoryData = [
      {
        name: 'Indonesian',
        slug: 'indonesian',
        iconUrl: 'https://img.icons8.com/fluency/48/indonesia-flag.png',
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
      .values(categoryData)
      .returning();
    console.log(`✅ Inserted ${insertedCategories.length} categories\n`);

    // 2. Seed Users (2 per role)
    console.log('👥 Seeding users...');
    const hashedPassword = await bcrypt.hash('Password123', 10);

    const userData = [
      // Admin
      {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        phone: '+628000000000',
        role: 'admin' as const,
        isVerified: true,
        isActive: true,
      },
      // Customers
      {
        email: 'customer@example.com',
        password: hashedPassword,
        name: 'John Customer',
        phone: '+628123456789',
        role: 'customer' as const,
        isVerified: true,
        isActive: true,
      },
      {
        email: 'customer2@example.com',
        password: hashedPassword,
        name: 'Jane Customer',
        phone: '+628123456790',
        role: 'customer' as const,
        isVerified: true,
        isActive: true,
      },
      // Merchants
      {
        email: 'merchant1@example.com',
        password: hashedPassword,
        name: 'Budi Merchant',
        phone: '+622112345678',
        role: 'merchant' as const,
        isVerified: true,
        isActive: true,
      },
      {
        email: 'merchant2@example.com',
        password: hashedPassword,
        name: 'Siti Merchant',
        phone: '+622112345679',
        role: 'merchant' as const,
        isVerified: true,
        isActive: true,
      },
      // Couriers
      {
        email: 'courier1@example.com',
        password: hashedPassword,
        name: 'Agus Courier',
        phone: '+628987654321',
        role: 'courier' as const,
        isVerified: true,
        isActive: true,
      },
      {
        email: 'courier2@example.com',
        password: hashedPassword,
        name: 'Dewi Courier',
        phone: '+628987654322',
        role: 'courier' as const,
        isVerified: true,
        isActive: true,
      },
    ];

    const insertedUsers = await db.insert(users).values(userData).returning();
    console.log(`✅ Inserted ${insertedUsers.length} users\n`);

    // Get users by role
    const merchantUser1 = insertedUsers.find(
      (u) => u.email === 'merchant1@example.com',
    )!;
    const merchantUser2 = insertedUsers.find(
      (u) => u.email === 'merchant2@example.com',
    )!;
    const customerUser1 = insertedUsers.find(
      (u) => u.email === 'customer@example.com',
    )!;
    const customerUser2 = insertedUsers.find(
      (u) => u.email === 'customer2@example.com',
    )!;
    const courierUser1 = insertedUsers.find(
      (u) => u.email === 'courier1@example.com',
    )!;
    const courierUser2 = insertedUsers.find(
      (u) => u.email === 'courier2@example.com',
    )!;

    // 3. Seed Courier Profiles
    console.log('🏍️  Seeding courier profiles...');
    const courierProfileData = [
      {
        userId: courierUser1.id,
        vehicleType: 'motorcycle' as const,
        vehicleNumber: 'B 1234 ABC',
        isOnline: true,
        currentLatitude: '-6.2146', // Near GBK
        currentLongitude: '106.8026',
        totalDeliveries: 150,
        rating: '4.80',
      },
      {
        userId: courierUser2.id,
        vehicleType: 'bicycle' as const,
        vehicleNumber: 'N/A',
        isOnline: false,
        currentLatitude: '-6.1924', // Near Bundaran HI
        currentLongitude: '106.8229',
        totalDeliveries: 75,
        rating: '4.65',
      },
    ];

    const insertedCouriers = await db
      .insert(courierProfiles)
      .values(courierProfileData)
      .returning();
    console.log(`✅ Inserted ${insertedCouriers.length} courier profiles\n`);

    // 4. Seed Customer Addresses
    console.log('📍 Seeding customer addresses...');
    const addressData = [
      {
        userId: customerUser1.id,
        label: 'Home',
        addressLine: 'Jl. Sudirman No. 123, Tanah Abang',
        latitude: '-6.2088', // SCBD
        longitude: '106.8456',
        city: 'Jakarta Pusat',
        postalCode: '10270',
        notes: 'Ring the doorbell twice',
        isDefault: true,
      },
      {
        userId: customerUser1.id,
        label: 'Office',
        addressLine: 'Jl. Thamrin No. 456, Menteng',
        latitude: '-6.1944', // Menteng
        longitude: '106.8229',
        city: 'Jakarta Pusat',
        postalCode: '10340',
        notes: 'Building A, Floor 5',
        isDefault: false,
      },
      {
        userId: customerUser2.id,
        label: 'Home',
        addressLine: 'Jl. Gatot Subroto No. 88',
        latitude: '-6.2350', // Kuningan
        longitude: '106.8200',
        city: 'Jakarta Selatan',
        postalCode: '12930',
        notes: 'Apartment Tower B',
        isDefault: true,
      },
    ];

    const insertedAddresses = await db
      .insert(userAddresses)
      .values(addressData)
      .returning();
    console.log(`✅ Inserted ${insertedAddresses.length} addresses\n`);

    // 5. Seed Merchants
    console.log('🏪 Seeding merchants...');
    const merchantData = [
      {
        userId: merchantUser1.id,
        storeName: 'Warung Padang Sederhana',
        description:
          'Authentic Padang cuisine with rich flavors and traditional recipes. Famous for our rendang and gulai.',
        logoUrl:
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
        bannerUrl:
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        addressLine: 'Jl. Merdeka No. 100, Gambir',
        latitude: '-6.1754', // Monas area
        longitude: '106.8272',
        city: 'Jakarta Pusat',
        phone: '+622112345678',
        isOpen: true,
        openingTime: '08:00',
        closingTime: '22:00',
        deliveryFee: '10000',
        minOrder: '25000',
        estimatedDeliveryTime: 30,
      },
      {
        userId: merchantUser2.id,
        storeName: 'Sate Ayam Madura Pak Slamet',
        description:
          'Best chicken satay in town! Grilled to perfection with our special peanut sauce.',
        logoUrl:
          'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=200',
        bannerUrl:
          'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        addressLine: 'Jl. Kebayoran Baru No. 50',
        latitude: '-6.2425', // Blok M area
        longitude: '106.7991',
        city: 'Jakarta Selatan',
        phone: '+622112345680',
        isOpen: true,
        openingTime: '10:00',
        closingTime: '23:00',
        deliveryFee: '12000',
        minOrder: '30000',
        estimatedDeliveryTime: 35,
      },
    ];

    const insertedMerchants = await db
      .insert(merchants)
      .values(merchantData)
      .returning();
    console.log(`✅ Inserted ${insertedMerchants.length} merchants\n`);

    // 6. Seed Menu Items
    console.log('🍽️  Seeding menu items...');
    const merchant1 = insertedMerchants[0]!;
    const merchant2 = insertedMerchants[1]!;
    const indonesianCat = insertedCategories.find(
      (c) => c.slug === 'indonesian',
    )!;
    const beveragesCat = insertedCategories.find(
      (c) => c.slug === 'beverages',
    )!;
    const dessertsCat = insertedCategories.find((c) => c.slug === 'desserts')!;

    const menuItemsData = [
      // Warung Padang
      {
        merchantId: merchant1.id,
        categoryId: indonesianCat.id,
        name: 'Nasi Rendang',
        description:
          'Steamed rice with tender beef rendang in rich coconut sauce',
        price: '35000',
        imageUrl:
          'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400',
        isAvailable: true,
        stock: 50,
        preparationTime: 15,
      },
      {
        merchantId: merchant1.id,
        categoryId: indonesianCat.id,
        name: 'Nasi Gulai Ayam',
        description: 'Rice with chicken curry in aromatic spices',
        price: '32000',
        imageUrl:
          'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400',
        isAvailable: true,
        stock: 45,
        preparationTime: 15,
      },
      {
        merchantId: merchant1.id,
        categoryId: indonesianCat.id,
        name: 'Nasi Ayam Pop',
        description: 'Rice with crispy fried chicken, Padang style',
        price: '30000',
        imageUrl:
          'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=400',
        isAvailable: true,
        stock: 40,
        preparationTime: 12,
      },
      {
        merchantId: merchant1.id,
        categoryId: indonesianCat.id,
        name: 'Nasi Dendeng Balado',
        description: 'Rice with spicy beef jerky',
        price: '38000',
        imageUrl:
          'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400',
        isAvailable: true,
        stock: 35,
        preparationTime: 15,
      },
      {
        merchantId: merchant1.id,
        categoryId: beveragesCat.id,
        name: 'Es Teh Manis',
        description: 'Sweet iced tea',
        price: '8000',
        imageUrl:
          'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
        isAvailable: true,
        stock: 100,
        preparationTime: 5,
      },
      {
        merchantId: merchant1.id,
        categoryId: beveragesCat.id,
        name: 'Es Jeruk',
        description: 'Fresh orange juice',
        price: '12000',
        imageUrl:
          'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400',
        isAvailable: true,
        stock: 50,
        preparationTime: 5,
      },

      // Sate Madura
      {
        merchantId: merchant2.id,
        categoryId: indonesianCat.id,
        name: 'Sate Ayam 10 Tusuk',
        description: '10 skewers of grilled chicken satay with peanut sauce',
        price: '40000',
        imageUrl:
          'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
        isAvailable: true,
        stock: 60,
        preparationTime: 20,
      },
      {
        merchantId: merchant2.id,
        categoryId: indonesianCat.id,
        name: 'Sate Ayam 20 Tusuk',
        description: '20 skewers of grilled chicken satay with peanut sauce',
        price: '75000',
        imageUrl:
          'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
        isAvailable: true,
        stock: 40,
        preparationTime: 25,
      },
      {
        merchantId: merchant2.id,
        categoryId: indonesianCat.id,
        name: 'Nasi Sate Komplit',
        description:
          'Rice with chicken satay, lontong, and complete condiments',
        price: '45000',
        imageUrl:
          'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
        isAvailable: true,
        stock: 35,
        preparationTime: 20,
      },
      {
        merchantId: merchant2.id,
        categoryId: indonesianCat.id,
        name: 'Sate Kambing 10 Tusuk',
        description: '10 skewers of grilled mutton satay',
        price: '55000',
        imageUrl:
          'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
        isAvailable: true,
        stock: 25,
        preparationTime: 25,
      },
      {
        merchantId: merchant2.id,
        categoryId: beveragesCat.id,
        name: 'Es Kelapa Muda',
        description: 'Young coconut ice',
        price: '15000',
        imageUrl:
          'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400',
        isAvailable: true,
        stock: 30,
        preparationTime: 8,
      },
      {
        merchantId: merchant2.id,
        categoryId: dessertsCat.id,
        name: 'Es Campur',
        description: 'Mixed ice dessert with fruits and jellies',
        price: '18000',
        imageUrl:
          'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
        isAvailable: true,
        stock: 25,
        preparationTime: 10,
      },
    ];

    const insertedMenuItems = await db
      .insert(menuItems)
      .values(menuItemsData)
      .returning();
    console.log(`✅ Inserted ${insertedMenuItems.length} menu items\n`);

    // 7. Seed Complaints
    console.log('📢 Seeding complaints...');
    const complaintData = [
      {
        reporterId: customerUser1.id,
        category: 'order_not_received' as const,
        subject: 'Order not arrived yet',
        description: 'I have been waiting for 2 hours.',
        status: 'pending' as const,
      },
      {
        reporterId: customerUser2.id,
        category: 'quality_issue' as const,
        subject: 'Food was cold',
        description: 'The pizza arrived cold and soggy.',
        status: 'resolved' as const,
        resolution: 'Refunded 50%',
        assignedAdminId: insertedUsers.find((u) => u.role === 'admin')?.id,
        created_at: new Date(Date.now() - 86400000), // 1 day ago
      },
    ];

    const insertedComplaints = await db
      .insert(complaints)
      .values(complaintData)
      .returning();
    console.log(`✅ Inserted ${insertedComplaints.length} complaints\n`);

    // Print summary
    console.log('✨ Database seeding completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - Categories: ${insertedCategories.length} items`);
    console.log(
      `   - Users: ${insertedUsers.length} (2 customers, 2 merchants, 2 couriers)`,
    );
    console.log(`   - Courier Profiles: ${insertedCouriers.length}`);
    console.log(
      `   - Addresses: ${insertedAddresses.length} customer addresses`,
    );
    console.log(`   - Merchants: ${insertedMerchants.length} restaurants`);
    console.log(
      `   - Menu Items: ${insertedMenuItems.length} food & beverage items`,
    );
    console.log('\n🔐 Test Credentials (password: Password123):');
    console.log('   Admin:    admin@example.com');
    console.log('   Customer: customer@example.com, customer2@example.com');
    console.log('   Merchant: merchant1@example.com, merchant2@example.com');
    console.log('   Courier:  courier1@example.com, courier2@example.com');
    console.log('\n🚀 API Docs: http://localhost:3000/api-docs');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};
*/

// Run seeding
seedDatabaseV2()
  .then(() => {
    console.log('\n✅ Seed V2 script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed V2 script failed:', error);
    process.exit(1);
  });

/*
// Run seeding
seedDatabase()
  .then(() => {
    console.log('\n✅ Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });
*/
