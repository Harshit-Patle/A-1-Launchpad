const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Component = require('./models/Component');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Component.deleteMany({});
        console.log('Cleared existing data');

        // Create admin user
        const adminUser = new User({
            name: 'Administrator',
            email: 'admin@inventory.com',
            password: 'Admin123!',
            role: 'Admin',
            employeeId: 'ADM001',
            department: 'IT',
            isActive: true
        });

        await adminUser.save();
        console.log('Admin user created');

        // Create sample user
        const sampleUser = new User({
            name: 'John Doe',
            email: 'john@inventory.com',
            password: 'User123!',
            role: 'User',
            employeeId: 'USR001',
            department: 'Engineering',
            isActive: true
        });

        await sampleUser.save();
        console.log('Sample user created');

        // Create sample components
        const sampleComponents = [
            {
                name: 'Arduino Uno R3',
                category: 'Microcontrollers',
                partNumber: 'ARD-UNO-R3',
                description: 'Arduino Uno microcontroller board based on ATmega328P',
                manufacturer: 'Arduino',
                quantity: 25,
                location: 'Shelf A1',
                unitPrice: 23.50,
                criticalLow: 5,
                supplier: 'SparkFun Electronics',
                supplierPartNumber: 'DEV-11021',
                leadTime: 7,
                packageType: 'DIP',
                specifications: {
                    voltage: '5V',
                    current: '50mA',
                    power: '0.25W',
                    operatingTemp: '-40°C to +85°C'
                },
                tags: ['Arduino', 'Microcontroller', 'Development'],
                addedBy: adminUser._id,
                lastRestocked: new Date()
            },
            {
                name: 'Resistor 10K Ohm',
                category: 'Passive Components',
                partNumber: 'RES-10K-1/4W',
                description: '10K Ohm 1/4W Carbon Film Resistor',
                manufacturer: 'Yageo',
                quantity: 500,
                location: 'Drawer B2',
                unitPrice: 0.05,
                criticalLow: 50,
                supplier: 'Digikey',
                supplierPartNumber: 'CFR-25JB-52-10K',
                leadTime: 3,
                packageType: 'Axial',
                specifications: {
                    resistance: '10K Ohm',
                    power: '0.25W',
                    tolerance: '5%',
                    operatingTemp: '-55°C to +155°C'
                },
                tags: ['Resistor', 'Passive', '10K'],
                addedBy: adminUser._id,
                lastRestocked: new Date()
            },
            {
                name: 'Capacitor 100uF 25V',
                category: 'Passive Components',
                partNumber: 'CAP-100UF-25V',
                description: 'Electrolytic Capacitor 100uF 25V',
                manufacturer: 'Panasonic',
                quantity: 100,
                location: 'Drawer C1',
                unitPrice: 0.25,
                criticalLow: 20,
                supplier: 'Mouser',
                supplierPartNumber: 'ECA-1EM101',
                leadTime: 5,
                packageType: 'Radial',
                specifications: {
                    capacitance: '100uF',
                    voltage: '25V',
                    tolerance: '20%',
                    operatingTemp: '-40°C to +105°C'
                },
                tags: ['Capacitor', 'Electrolytic', '100uF'],
                addedBy: adminUser._id,
                lastRestocked: new Date()
            },
            {
                name: 'ESP32 Development Board',
                category: 'Microcontrollers',
                partNumber: 'ESP32-DEV',
                description: 'ESP32 WiFi & Bluetooth development board',
                manufacturer: 'Espressif',
                quantity: 15,
                location: 'Shelf A2',
                unitPrice: 12.99,
                criticalLow: 3,
                supplier: 'Adafruit',
                supplierPartNumber: 'ADA-3405',
                leadTime: 10,
                packageType: 'Module',
                specifications: {
                    voltage: '3.3V',
                    current: '240mA',
                    power: '0.8W',
                    operatingTemp: '-40°C to +85°C'
                },
                tags: ['ESP32', 'WiFi', 'Bluetooth', 'IoT'],
                addedBy: adminUser._id,
                lastRestocked: new Date()
            },
            {
                name: 'LED Red 5mm',
                category: 'LEDs',
                partNumber: 'LED-RED-5MM',
                description: 'Red LED 5mm through-hole',
                manufacturer: 'Kingbright',
                quantity: 200,
                location: 'Drawer D1',
                unitPrice: 0.10,
                criticalLow: 30,
                supplier: 'Newark',
                supplierPartNumber: 'WP7113ID',
                leadTime: 2,
                packageType: 'T-1 3/4',
                specifications: {
                    voltage: '2.0V',
                    current: '20mA',
                    wavelength: '660nm',
                    operatingTemp: '-40°C to +85°C'
                },
                tags: ['LED', 'Red', '5mm', 'Indicator'],
                addedBy: adminUser._id,
                lastRestocked: new Date()
            }
        ];

        await Component.insertMany(sampleComponents);
        console.log('Sample components created');

        console.log('\n🎉 Seed data created successfully!');
        console.log('\n📧 Admin Login:');
        console.log('Email: admin@inventory.com');
        console.log('Password: Admin123!');
        console.log('\n📧 User Login:');
        console.log('Email: john@inventory.com');
        console.log('Password: User123!');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
