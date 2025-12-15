const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Component = require('./models/Component');

dotenv.config({ path: './.env' });

const seedData = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        // Clear existing users only (preserve components)
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Create admin user (according to README)
        const adminUser = new User({
            name: 'Administrator',
            email: 'admin@lims.com',
            password: 'admin123',
            role: 'Admin',
            employeeId: 'ADM001',
            department: 'IT',
            isActive: true,
            permissions: {
                view_inventory: true,
                edit_inventory: true,
                delete_inventory: true,
                manage_users: true,
                view_reports: true,
                export_data: true,
                manage_reservations: true,
                manage_maintenance: true,
                approve_requests: true,
                system_settings: true
            },
            lastLogin: new Date()
        });

        await adminUser.save();
        console.log('Admin user created: admin@lims.com / admin123');

        // Create manager user (according to README)
        const managerUser = new User({
            name: 'Lab Manager',
            email: 'manager@lims.com',
            password: 'manager123',
            role: 'Manager',
            employeeId: 'MGR001',
            department: 'Laboratory',
            isActive: true,
            permissions: {
                view_inventory: true,
                edit_inventory: true,
                delete_inventory: false,
                manage_users: false,
                view_reports: true,
                export_data: true,
                manage_reservations: true,
                manage_maintenance: true,
                approve_requests: true,
                system_settings: false
            },
            lastLogin: new Date()
        });

        await managerUser.save();
        console.log('Manager user created: manager@lims.com / manager123');

        // Create regular user/technician (according to README)
        const regularUser = new User({
            name: 'Lab Technician',
            email: 'technician@lims.com',
            password: 'technician123',
            role: 'Technician',
            employeeId: 'TECH001',
            department: 'Laboratory',
            isActive: true,
            permissions: {
                view_inventory: true,
                edit_inventory: false,
                delete_inventory: false,
                manage_users: false,
                view_reports: true,
                export_data: false,
                manage_reservations: true,
                manage_maintenance: false,
                approve_requests: false,
                system_settings: false
            },
            lastLogin: new Date()
        });

        await regularUser.save();
        console.log('User account created: technician@lims.com / technician123');

        // Check if components exist, only create if none exist
        const componentCount = await Component.countDocuments();
        if (componentCount === 0) {
            console.log('No components found. Creating sample components...');

            // Create sample components
            const sampleComponents = [
                {
                    name: 'Resistor (100 Ohm, 1/4W)',
                    category: 'Resistors',
                    partNumber: 'R100_1/4W',
                    description: 'Carbon Film, 5% Tolerance',
                    quantity: 500,
                    location: 'R-Shelf-A1',
                    unitPrice: 0.50,
                    criticalLow: 100,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Resistor (1k Ohm, 1/4W)',
                    category: 'Resistors',
                    partNumber: 'R1K_1/4W',
                    description: 'Carbon Film, 5% Tolerance',
                    quantity: 500,
                    location: 'R-Shelf-A1',
                    unitPrice: 0.50,
                    criticalLow: 100,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Resistor (10k Ohm, 1/4W)',
                    category: 'Resistors',
                    partNumber: 'R10K_1/4W',
                    description: 'Carbon Film, 5% Tolerance',
                    quantity: 500,
                    location: 'R-Shelf-A1',
                    unitPrice: 0.50,
                    criticalLow: 100,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Resistor (4.7 Ohm, 1W)',
                    category: 'Resistors',
                    partNumber: 'R4.7_1W',
                    description: 'Metal Film, 1% Tolerance',
                    quantity: 150,
                    location: 'R-Shelf-A2',
                    unitPrice: 1.20,
                    criticalLow: 30,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Ceramic Cap (0.1uF, 50V)',
                    category: 'Capacitors',
                    partNumber: 'C0.1UF_50V_CER',
                    description: 'Ceramic Disc Capacitor',
                    quantity: 800,
                    location: 'C-Bin-B1',
                    unitPrice: 0.80,
                    criticalLow: 200,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Electrolytic Cap (100uF, 25V)',
                    category: 'Capacitors',
                    partNumber: 'C100UF_25V_EL',
                    description: 'Radial Electrolytic Capacitor',
                    quantity: 200,
                    location: 'C-Bin-B2',
                    unitPrice: 2.50,
                    criticalLow: 50,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Tantalum Cap (10uF, 16V)',
                    category: 'Capacitors',
                    partNumber: 'T491A106K016AT',
                    description: 'SMD Tantalum Capacitor',
                    quantity: 100,
                    location: 'C-Bin-B3',
                    unitPrice: 5.00,
                    criticalLow: 20,
                    manufacturer: 'KEMET',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Inductor (10uH)',
                    category: 'Inductors',
                    partNumber: 'L10UH',
                    description: 'Radial Lead Inductor',
                    quantity: 100,
                    location: 'L-Bin-C1',
                    unitPrice: 3.00,
                    criticalLow: 25,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: '1N4007 Diode',
                    category: 'Diodes',
                    partNumber: '1N4007',
                    description: 'Rectifier Diode, 1A, 1000V',
                    quantity: 300,
                    location: 'D-Bin-D1',
                    unitPrice: 1.00,
                    criticalLow: 75,
                    manufacturer: 'Fairchild',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Zener Diode (5.1V, 0.5W)',
                    category: 'Diodes',
                    partNumber: '1N5231B',
                    description: 'Zener Diode',
                    quantity: 150,
                    location: 'D-Bin-D2',
                    unitPrice: 1.50,
                    criticalLow: 30,
                    manufacturer: 'ON Semiconductor',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'NPN Transistor (BC547)',
                    category: 'Transistors',
                    partNumber: 'BC547B',
                    description: 'NPN BJT, General Purpose',
                    quantity: 200,
                    location: 'T-Tray-E1',
                    unitPrice: 1.20,
                    criticalLow: 50,
                    manufacturer: 'NXP',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'MOSFET (IRF540N)',
                    category: 'Transistors',
                    partNumber: 'IRF540N',
                    description: 'N-Channel Power MOSFET',
                    quantity: 50,
                    location: 'T-Tray-E2',
                    unitPrice: 25.00,
                    criticalLow: 10,
                    manufacturer: 'Infineon',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'NE555 Timer IC',
                    category: 'Integrated Circuits (ICs)',
                    partNumber: 'NE555P',
                    description: 'Precision Timer IC',
                    quantity: 80,
                    location: 'IC-Box-F1',
                    unitPrice: 8.00,
                    criticalLow: 20,
                    manufacturer: 'Texas Instruments',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'LM358 Op-Amp',
                    category: 'Integrated Circuits (ICs)',
                    partNumber: 'LM358N',
                    description: 'Dual Op-Amp',
                    quantity: 100,
                    location: 'IC-Box-F2',
                    unitPrice: 6.00,
                    criticalLow: 25,
                    manufacturer: 'STMicroelectronics',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'ATmega328P (DIP)',
                    category: 'Integrated Circuits (ICs)',
                    partNumber: 'ATMEGA328P-PU',
                    description: 'Microcontroller, 8-bit',
                    quantity: 30,
                    location: 'IC-Box-F3',
                    unitPrice: 150.00,
                    criticalLow: 5,
                    manufacturer: 'Microchip',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'ESP32-WROOM-32U',
                    category: 'Integrated Circuits (ICs)',
                    partNumber: 'ESP32-WROOM-32U',
                    description: 'Wi-Fi & Bluetooth Module',
                    quantity: 20,
                    location: 'IC-Box-F4',
                    unitPrice: 200.00,
                    criticalLow: 3,
                    manufacturer: 'Espressif',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Male Header (2.54mm, 40-pin)',
                    category: 'Connectors',
                    partNumber: 'HDR-M-2.54-40',
                    description: 'Single Row Pin Header',
                    quantity: 100,
                    location: 'Conn-Drawer-G1',
                    unitPrice: 3.50,
                    criticalLow: 20,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'JST-XH Connector (2-pin)',
                    category: 'Connectors',
                    partNumber: 'B2B-XH-A(LF)(SN)',
                    description: 'Through-hole, 2-pin',
                    quantity: 50,
                    location: 'Conn-Drawer-G2',
                    unitPrice: 4.00,
                    criticalLow: 10,
                    manufacturer: 'JST',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'DHT11 Temperature/Humidity',
                    category: 'Sensors',
                    partNumber: 'DHT11',
                    description: 'Digital Temperature & Humidity Sensor',
                    quantity: 15,
                    location: 'Sensor-Bin-H1',
                    unitPrice: 50.00,
                    criticalLow: 3,
                    manufacturer: 'Aosong',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Photoresistor (LDR)',
                    category: 'Sensors',
                    partNumber: 'GL5516',
                    description: 'Light Dependent Resistor',
                    quantity: 30,
                    location: 'Sensor-Bin-H2',
                    unitPrice: 7.00,
                    criticalLow: 5,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Arduino Uno R3',
                    category: 'Microcontrollers/Dev Boards',
                    partNumber: 'A000066',
                    description: 'Development Board',
                    quantity: 5,
                    location: 'DevBoard-Rack-11',
                    unitPrice: 800.00,
                    criticalLow: 1,
                    manufacturer: 'Arduino',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Raspberry Pi Zero W',
                    category: 'Microcontrollers/Dev Boards',
                    partNumber: 'RPI0W',
                    description: 'Single-board Computer',
                    quantity: 3,
                    location: 'DevBoard-Rack-12',
                    unitPrice: 1200.00,
                    criticalLow: 1,
                    manufacturer: 'Raspberry Pi Found.',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Tactile Push Button (6x6mm)',
                    category: 'Switches/Buttons',
                    partNumber: 'BTN-TACT-6X6',
                    description: 'Momentary Tactile Switch',
                    quantity: 100,
                    location: 'Switch-Box-J1',
                    unitPrice: 1.00,
                    criticalLow: 25,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'SPDT Slide Switch',
                    category: 'Switches/Buttons',
                    partNumber: 'SW-SPDT-SLIDE',
                    description: 'Single Pole Double Throw Slide Switch',
                    quantity: 40,
                    location: 'Switch-Box-J2',
                    unitPrice: 3.00,
                    criticalLow: 10,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Red LED (5mm)',
                    category: 'LEDs/Displays',
                    partNumber: 'LED-RED-5MM',
                    description: 'Standard Red LED',
                    quantity: 200,
                    location: 'LED-Tray-K1',
                    unitPrice: 0.80,
                    criticalLow: 50,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: '16x2 LCD Display',
                    category: 'LEDs/Displays',
                    partNumber: 'LCD1602',
                    description: 'Character LCD Module',
                    quantity: 10,
                    location: 'LCD-Box-K2',
                    unitPrice: 150.00,
                    criticalLow: 2,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Jumper Wires (M-M, 40pc)',
                    category: 'Cables/Wires',
                    partNumber: 'JMP-MM40',
                    description: 'Male-to-Male Jumper Wires, assorted',
                    quantity: 10,
                    location: 'Cable-Bag-L1',
                    unitPrice: 80.00,
                    criticalLow: 2,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Hook-up Wire (22AWG, Red)',
                    category: 'Cables/Wires',
                    partNumber: 'WIRE-22AWG-RED',
                    description: 'Solid Core Hook-up Wire, 10m roll',
                    quantity: 5,
                    location: 'Cable-Bag-L2',
                    unitPrice: 150.00,
                    criticalLow: 1,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'M3 Screws (10mm)',
                    category: 'Mechanical Parts/Hardware',
                    partNumber: 'SCR-M3-10MM',
                    description: 'Phillips Head, Steel',
                    quantity: 200,
                    location: 'Mech-Bin-M1',
                    unitPrice: 0.50,
                    criticalLow: 50,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Brass Standoffs (M3, 10mm)',
                    category: 'Mechanical Parts/Hardware',
                    partNumber: 'STDOFF-M3-10MM',
                    description: 'Male-Female Standoff',
                    quantity: 100,
                    location: 'Mech-Bin-M2',
                    unitPrice: 2.00,
                    criticalLow: 20,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Solder Wire (0.8mm)',
                    category: 'Miscellaneous Lab Supplies',
                    partNumber: 'SOLDER-0.8MM',
                    description: 'Lead-free Solder, 100g roll',
                    quantity: 5,
                    location: 'Misc-Shelf-N1',
                    unitPrice: 300.00,
                    criticalLow: 1,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                },
                {
                    name: 'Breadboard (Full Size)',
                    category: 'Miscellaneous Lab Supplies',
                    partNumber: 'BRDBRD-FULL',
                    description: '830 Tie Points',
                    quantity: 10,
                    location: 'Misc-Shelf-N2',
                    unitPrice: 70.00,
                    criticalLow: 2,
                    manufacturer: 'Generic',
                    addedBy: adminUser._id,
                    lastRestocked: new Date()
                }
            ];

            await Component.insertMany(sampleComponents);
            console.log('Sample components created');
        } else {
            console.log(`Found ${componentCount} existing components. Skipping component creation.`);
        }

        console.log('\n🎉 Seed data created successfully!');
        console.log('\n📧 Login credentials (from README.md):');
        console.log('Admin: admin@lims.com / admin123');
        console.log('Manager: manager@lims.com / manager123');
        console.log('User: technician@lims.com / technician123');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
