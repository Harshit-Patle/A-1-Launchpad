const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const Component = require('../models/Component');
const Log = require('../models/Log');
const Maintenance = require('../models/Maintenance');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const WasteEntry = require('../models/WasteEntry');

// Helper function to get inventory overview data
exports.getInventoryOverviewData = async (query) => {
    const { category, location } = query;

    const filter = {};
    if (category) filter.category = category;
    if (location) filter.location = location;

    const components = await Component.find(filter).sort({ name: 1 });

    // Calculate statistics
    const totalComponents = components.length;
    const totalValue = components.reduce((sum, comp) => sum + (comp.price * comp.quantity), 0);
    const lowStockCount = components.filter(comp => comp.quantity <= comp.minThreshold).length;

    // Group by category
    const categoryStats = [];
    const categories = {};

    components.forEach(comp => {
        if (!categories[comp.category]) {
            categories[comp.category] = {
                _id: comp.category,
                count: 0,
                totalValue: 0
            };
            categoryStats.push(categories[comp.category]);
        }

        categories[comp.category].count++;
        categories[comp.category].totalValue += (comp.price * comp.quantity);
    });

    return {
        summary: {
            totalComponents,
            totalValue,
            lowStockCount,
            totalCategories: categoryStats.length
        },
        categoryStats,
        components
    };
};

// Helper function to get usage analytics data
exports.getUsageAnalyticsData = async (query) => {
    const { startDate, endDate } = query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Get usage logs
    const logs = await Log.find({
        action: { $in: ['stock_in', 'stock_out'] },
        ...(startDate || endDate ? { createdAt: dateFilter } : {})
    }).sort({ createdAt: 1 });

    // Process logs into daily usage data
    const usageByDate = {};
    logs.forEach(log => {
        const date = log.createdAt.toISOString().split('T')[0];
        if (!usageByDate[date]) {
            usageByDate[date] = { date, inward: 0, outward: 0 };
        }

        if (log.action === 'stock_in') {
            usageByDate[date].inward += log.quantity || 0;
        } else {
            usageByDate[date].outward += log.quantity || 0;
        }
    });

    const usageData = Object.values(usageByDate);

    // Get top used components
    const topUsedComponents = await Log.aggregate([
        {
            $match: {
                action: 'stock_out',
                ...(startDate || endDate ? { createdAt: dateFilter } : {})
            }
        },
        {
            $group: {
                _id: '$componentId',
                usageCount: { $sum: 1 },
                totalQuantity: { $sum: '$quantity' }
            }
        },
        { $sort: { usageCount: -1 } },
        { $limit: 10 }
    ]);

    // Get component details
    const componentIds = topUsedComponents.map(c => c._id);
    const componentDetails = await Component.find({ _id: { $in: componentIds } });

    // Merge component details with usage stats
    const topUsedWithDetails = topUsedComponents.map(usage => {
        const componentDetail = componentDetails.find(c => c._id.toString() === usage._id.toString());
        return {
            _id: usage._id,
            name: componentDetail ? componentDetail.name : 'Unknown',
            usageCount: usage.usageCount,
            totalQuantity: usage.totalQuantity,
            currentStock: componentDetail ? componentDetail.quantity : 0
        };
    });

    return {
        usageData,
        topUsedComponents: topUsedWithDetails
    };
};

// Other report data functions would follow the same pattern
exports.getStockMovementData = async (query) => {
    // Implementation for stock movement report
    return { movements: [] };
};

exports.getCostAnalysisData = async (query) => {
    // Implementation for cost analysis report
    return { costData: [] };
};

exports.getComplianceReportData = async (query) => {
    // Implementation for compliance report
    return { compliance: [] };
};

exports.getVendorAnalysisData = async (query) => {
    // Implementation for vendor analysis report
    return { vendors: [] };
};

exports.getWasteTrackingData = async (query) => {
    const { startDate, endDate } = query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const wasteEntries = await WasteEntry.find(
        startDate || endDate ? { date: dateFilter } : {}
    ).populate('componentId', 'name category');

    return { wasteEntries };
};

exports.getReservationReportData = async (query) => {
    const { startDate, endDate, status } = query;

    const filter = {};
    if (status) filter.status = status;

    if (startDate || endDate) {
        filter.startDate = {};
        if (startDate) filter.startDate.$gte = new Date(startDate);
        if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const reservations = await Reservation.find(filter)
        .populate('userId', 'name email')
        .populate('componentId', 'name category');

    return { reservations };
};

// Export a report in PDF or Excel format
exports.exportReport = async (req, res) => {
    const { reportType } = req.params;
    const { format, startDate, endDate } = req.query;

    if (!['pdf', 'xlsx'].includes(format)) {
        return res.status(400).json({ msg: 'Invalid export format. Use pdf or xlsx.' });
    }

    try {
        let reportData;

        // Get the appropriate report data based on the type
        switch (reportType) {
            case 'inventory-overview':
                reportData = await this.getInventoryOverviewData(req.query);
                break;
            case 'usage-analytics':
                reportData = await this.getUsageAnalyticsData(req.query);
                break;
            case 'cost-analysis':
                reportData = await this.getCostAnalysisData(req.query);
                break;
            case 'stock-movement':
                reportData = await this.getStockMovementData(req.query);
                break;
            case 'compliance-report':
                reportData = await this.getComplianceReportData(req.query);
                break;
            case 'vendor-analysis':
                reportData = await this.getVendorAnalysisData(req.query);
                break;
            case 'waste-tracking':
                reportData = await this.getWasteTrackingData(req.query);
                break;
            case 'reservation-report':
                reportData = await this.getReservationReportData(req.query);
                break;
            default:
                return res.status(400).json({ msg: 'Invalid report type' });
        }

        if (format === 'xlsx') {
            // Generate Excel file
            const workbook = XLSX.utils.book_new();

            // Add relevant worksheets based on the report type
            Object.keys(reportData).forEach(key => {
                if (Array.isArray(reportData[key])) {
                    const worksheet = XLSX.utils.json_to_sheet(reportData[key]);
                    XLSX.utils.book_append_sheet(workbook, worksheet, key);
                }
            });

            // Convert workbook to buffer
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            // Set response headers
            res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${new Date().toISOString().split('T')[0]}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            // Send buffer
            return res.send(buffer);
        } else {
            // Generate PDF file using PDFKit
            const doc = new PDFDocument({
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                },
                size: 'A4',
                info: {
                    Title: `${reportType.replace(/-/g, ' ')} Report`,
                    Author: 'A-1 Launchpad System',
                    Subject: `${reportType.replace(/-/g, ' ')} Report Data`,
                    Keywords: 'report, inventory, analytics'
                }
            });

            const buffers = [];

            // Collect PDF data in buffers
            doc.on('data', buffers.push.bind(buffers));

            // Add a watermark/header
            doc.save()
                .translate(doc.page.width / 2, 40)
                .fontSize(30)
                .fillOpacity(0.1)
                .fillColor('#3b82f6')
                .text('A-1 LAUNCHPAD', 0, 0, {
                    align: 'center',
                    width: 400,
                    height: 100
                })
                .restore();

            // Set up PDF file with header
            doc.fontSize(24).text(`${reportType.replace(/-/g, ' ').toUpperCase()} REPORT`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
            doc.moveDown();
            doc.text(`Date Range: ${startDate || 'All time'} to ${endDate || 'Present'}`, { align: 'center' });

            // Add a horizontal line with gradient-like effect
            const y = doc.y + 20;
            const lineWidth = doc.page.width - 100;
            const segments = 20;
            const segmentWidth = lineWidth / segments;

            for (let i = 0; i < segments; i++) {
                const opacity = 0.3 + (0.7 * (i / segments));
                doc.moveTo(50 + (i * segmentWidth), y)
                    .lineTo(50 + ((i + 1) * segmentWidth), y)
                    .lineWidth(i % 2 === 0 ? 2 : 1)
                    .opacity(opacity)
                    .stroke('#3b82f6');
            }

            doc.opacity(1).moveDown(2);            // Add data to PDF based on the report type
            Object.keys(reportData).forEach(key => {
                // Create a nice section header
                const createSectionHeader = (title) => {
                    // Draw a colored background for section headers
                    const y = doc.y;
                    doc.rect(50, y, doc.page.width - 100, 30)
                        .fillAndStroke('#f0f7ff', '#3b82f6');

                    // Add section title text
                    doc.fontSize(16)
                        .fillColor('#1e40af')
                        .text(title, 60, y + 8, { width: doc.page.width - 120 });

                    doc.fillColor('#333333').moveDown(1.5);
                };

                if (Array.isArray(reportData[key]) && reportData[key].length > 0) {
                    // Format the section title nicely
                    const sectionTitle = key.replace(/([A-Z])/g, ' $1')
                        .replace(/(^|\s)\w/g, m => m.toUpperCase())
                        .replace(/Id$|Id\s/, 'ID ');

                    createSectionHeader(sectionTitle);
                    doc.moveDown();

                    reportData[key].forEach((item, index) => {
                        doc.fontSize(14).fillColor('#0066cc').text(`Item ${index + 1}:`);
                        doc.fillColor('#333333').fontSize(12);

                        Object.keys(item).forEach(prop => {
                            if (prop !== '_id' && prop !== 'id' && prop !== '__v') {
                                let value = item[prop];
                                // Format date values
                                if (value instanceof Date) {
                                    value = value.toLocaleDateString();
                                }
                                // Format currency values
                                else if (typeof value === 'number' &&
                                    (prop.toLowerCase().includes('price') ||
                                        prop.toLowerCase().includes('value') ||
                                        prop.toLowerCase().includes('cost'))) {
                                    value = `$${value.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}`;
                                }
                                // Handle nested objects
                                else if (value && typeof value === 'object' && value !== null) {
                                    if (value._id) {
                                        value = value.name || value._id;
                                    } else {
                                        value = JSON.stringify(value);
                                    }
                                }

                                const formattedProp = prop.replace(/([A-Z])/g, ' $1')
                                    .replace(/(^|\s)\w/g, m => m.toUpperCase())
                                    .replace(/Id$|Id\s/, 'ID ');

                                doc.fillColor('#666666')
                                    .text(`${formattedProp}: `, {
                                        continued: true,
                                    })
                                    .fillColor('#333333')
                                    .text(`${value}`);
                            }
                        });
                        doc.moveDown();
                    });

                    doc.moveDown();
                } else if (key === 'summary' && reportData[key]) {
                    // Handle summary data
                    doc.fontSize(18).fillColor('#333333').text('Summary', { underline: true });
                    doc.moveDown();

                    Object.keys(reportData[key]).forEach(prop => {
                        let value = reportData[key][prop];

                        // Format currency values
                        if (prop.toLowerCase().includes('value') || prop.toLowerCase().includes('cost')) {
                            value = `$${parseFloat(value).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}`;
                        }
                        // Format counts as integers
                        else if (typeof value === 'number') {
                            value = value.toLocaleString();
                        }

                        const formattedProp = prop.replace(/([A-Z])/g, ' $1')
                            .replace(/(^|\s)\w/g, m => m.toUpperCase());

                        doc.fontSize(12)
                            .fillColor('#666666')
                            .text(`${formattedProp}: `, {
                                continued: true
                            })
                            .fillColor('#0066cc')
                            .text(`${value}`)
                            .fillColor('#333333');
                    });

                    doc.moveDown(2);
                }
            });

            // Add page numbering functionality via events
            let pageCount = 0;

            // Count pages
            doc.on('pageAdded', () => {
                pageCount++;
            });

            // Use an event handler to add page numbers after all pages are created
            doc.on('beforeEnd', () => {
                // Add page numbers and footer to each page
                for (let i = 0; i < pageCount; i++) {
                    try {
                        doc.switchToPage(i);

                        // Add page number at the bottom center
                        doc.fontSize(10)
                            .fillColor('#888888')
                            .text(
                                `Page ${i + 1} of ${pageCount}`,
                                0,
                                doc.page.height - 50,
                                { align: 'center' }
                            );

                        // Add footer with company name and timestamp
                        doc.fontSize(8)
                            .fillColor('#888888')
                            .text(
                                `A-1 Launchpad Inventory Management | Generated: ${new Date().toLocaleString()}`,
                                50,
                                doc.page.height - 30,
                                { align: 'center', width: doc.page.width - 100 }
                            );
                    } catch (err) {
                        console.warn(`Could not add page number to page ${i}:`, err.message);
                    }
                }
            });

            // End the document
            doc.end();

            // When PDF is completed
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);

                // Set response headers
                res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${new Date().toISOString().split('T')[0]}.pdf"`);
                res.setHeader('Content-Type', 'application/pdf');

                console.log(`PDF report generated: ${reportType}.pdf, size: ${pdfData.length} bytes`);

                // Send PDF data
                res.send(pdfData);
            });
        }
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ msg: 'Error generating report export', error: error.message });
    }
};
