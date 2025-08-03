# A-1 Launchpad - Laboratory Inventory Management System

![LIMS Banner](https://i.imgur.com/lnKKpAv.png)

## Project Overview

A-1 Launchpad LIMS (Laboratory Inventory Management System) is a comprehensive web application designed specifically for electronics R&D and manufacturing labs to efficiently manage their component inventory. The system addresses the challenges of tracking a vast array of electronic components, from passive elements to complex integrated circuits, providing real-time insights, automated notifications, and comprehensive reporting.

This full-stack responsive application offers intuitive component management, stock movement tracking, powerful search functionality, role-based access control, and an insightful dashboard to help labs maintain optimal inventory levels and prevent project delays due to stockouts or obsolete components.

## Live Demo

- **Demo URL**: [https://a1-launchpad.example.com](https://a1-launchpad.example.com)
- **Test Credentials**: 
  - Admin: admin@example.com / admin123
  - User: user@example.com / user123

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [User Roles](#user-roles)
- [Key Functionality](#key-functionality)
- [Responsive Design](#responsive-design)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [License](#license)

## Features

### Core Features

- **Comprehensive Component Management**
  - Add, edit, and view detailed component information
  - Track component locations, datasheets, and categories
  - Monitor component quantities and set threshold alerts

- **Stock Movement Tracking**
  - Record inward (additions) and outward (deductions) movements
  - Track who moved stock, when, and for what purpose/project
  - Generate movement reports with filterable data

- **Powerful Search and Filter**
  - Search by component name, part number, description
  - Filter by category, location, quantity range, and stock status
  - Save favorite searches for quick access

- **Intelligent Notifications**
  - Low stock alerts based on configurable thresholds
  - Old stock alerts for components without movement for 3+ months
  - User-specific notification preferences

- **Interactive Dashboard**
  - Visual charts of inventory status and movements
  - Quick access to critical inventory metrics
  - Customizable dashboard widgets

### Advanced Features

- **QR Code Generation & Scanning**
  - Generate QR codes for easy component identification
  - Scan components using mobile device camera

- **Import/Export Functionality**
  - Bulk import components via CSV/Excel
  - Export inventory data in multiple formats

- **Waste Tracking System**
  - Record and analyze component waste
  - Identify patterns to reduce waste

- **Maintenance Tracking**
  - Schedule and record equipment maintenance
  - Receive maintenance due notifications

- **Approval Workflows**
  - Configurable approval processes for inventory actions
  - Multi-level approval chains

## Technology Stack

### Frontend

- **React**: Component-based UI library for building the user interface
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Chart.js**: Interactive charts and graphs for the dashboard
- **React Router**: Navigation and routing within the application
- **Context API**: State management across components
- **Axios**: HTTP client for API requests

### Backend

- **Node.js**: JavaScript runtime environment
- **Express**: Web application framework for Node.js
- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: MongoDB object modeling for Node.js
- **JWT**: JSON Web Tokens for authentication
- **Multer**: File upload handling
- **Nodemailer**: Email functionality for notifications

### DevOps & Tools

- **Vite**: Next-generation frontend tooling
- **ESLint**: Code linting for JavaScript
- **Jest**: Testing framework
- **Git**: Version control
- **PM2**: Process manager for Node.js applications in production

## Architecture

A-1 Launchpad follows a modern client-server architecture:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  React Frontend │◄────┤  Express API     │◄────┤  MongoDB        │
│  (Vite + React) │────►│  (Node.js)       │────►│  Database       │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

- **Frontend**: Single-page application (SPA) built with React and Vite
- **API Layer**: RESTful API endpoints built with Express.js
- **Database**: MongoDB collections with Mongoose schemas
- **Authentication**: JWT-based authentication with role-based access control
- **File Storage**: Local file system storage with Multer (cloud storage ready)

The application uses a context-based state management approach with React Context API, making it easy to share state between components without prop drilling.

## Installation

### Prerequisites

- Node.js v18+ and npm v9+
- MongoDB v6+
- Git

### Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/Harshit-Patle/A-1-Launchpad.git
cd A-1-Launchpad
```

2. **Set up the backend**

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB connection string and JWT secret
```

3. **Set up the frontend**

```bash
cd ../client
npm install
cp .env.example .env
# Edit .env with your API URL
```

4. **Seed the database (optional)**

```bash
cd ../server
npm run seed
# This will populate the database with sample data
```

5. **Start the development servers**

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

6. **Access the application**

Open your browser and navigate to [http://localhost:5173](http://localhost:5173)

### Production Deployment

1. **Build the frontend**

```bash
cd client
npm run build
```

2. **Configure server for production**

```bash
cd ../server
npm run build
```

3. **Run in production mode**

```bash
cd ../server
npm start
```

## User Roles

The application supports three user roles, each with different permissions:

### Admin

- **Full access to all features**
- Can manage users and assign roles
- Can configure system settings
- Can access all reports and dashboards
- Can approve workflows and manage components

**Test credentials**: admin@example.com / admin123

### Manager

- Can manage inventory and approve transactions
- Can access reports and dashboards
- Can manage component information
- Cannot manage users or system settings

**Test credentials**: manager@example.com / manager123

### User (Lab Technician)

- Can view inventory and search for components
- Can record inward and outward movements (pending approval)
- Can view limited reports
- Cannot edit component information or access admin features

**Test credentials**: user@example.com / user123

## Key Functionality

### Dashboard

![Dashboard Screenshot](https://i.imgur.com/example1.png)

The dashboard provides a comprehensive overview of inventory status with:
- Inward/outward movement charts
- Low stock alerts
- Component distribution by category
- Recent activity feed

### Inventory Management

![Inventory Screenshot](https://i.imgur.com/example2.png)

The inventory screen allows users to:
- View all components with filtering options
- Search for specific components
- Edit component details
- Generate QR codes for components

### Stock Movement

![Stock Movement Screenshot](https://i.imgur.com/example3.png)

The stock movement functionality enables:
- Recording of inward (additions) to inventory
- Recording of outward (deductions) from inventory
- Approval workflows for movements
- Historical tracking of all movements

### Notifications

![Notifications Screenshot](https://i.imgur.com/example4.png)

The notification system provides:
- Real-time alerts for low stock
- Old stock notifications
- Approval request notifications
- Customizable notification preferences

## Responsive Design

A-1 Launchpad is designed to work seamlessly across all devices:

### Desktop View
![Desktop Screenshot](https://i.imgur.com/example5.png)

### Tablet View
![Tablet Screenshot](https://i.imgur.com/example6.png)

### Mobile View
![Mobile Screenshot](https://i.imgur.com/example7.png)

The application features:
- Responsive layouts that adapt to screen size
- Touch-friendly controls for mobile devices
- Optimized tables with card views on small screens
- Collapsible sidebar for tablet and mobile navigation

## Known Limitations

- The application currently supports local file storage only, which may not be suitable for large-scale deployments
- The notification system relies on browser notifications and may not work when the application is closed
- CSV import has limitations with complex data structures
- Performance may degrade with very large inventory datasets (>100,000 components)
- The application requires JavaScript to be enabled in the browser

## Future Improvements

- **Cloud Storage Integration**: Add support for AWS S3 or similar services for file storage
- **Advanced Analytics**: Implement predictive analytics for inventory forecasting
- **Barcode Integration**: Add support for physical barcode scanners
- **Mobile App**: Develop native mobile applications for iOS and Android
- **Offline Mode**: Add support for offline functionality with synchronization
- **Multi-language Support**: Implement internationalization for global usage
- **Advanced Search**: Implement full-text search functionality
- **Automated Purchasing**: Integration with supplier APIs for automatic reordering
- **Data Visualization Enhancements**: More advanced and interactive charts

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

© 2025 A-1 Launchpad Team. All rights reserved.
