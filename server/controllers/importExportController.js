const XLSX = require('xlsx');
const Component = require('../models/Component');
const Log = require('../models/Log');

// Export components to Excel
exports.exportComponents = async (req, res) => {
    try {
        console.log('Exporting components to Excel...');
        const components = await Component.find().sort({ name: 1 });
        console.log(`Found ${components.length} components to export`);

        if (components.length === 0) {
            return res.status(200).json({ msg: 'No components to export' });
        }

        // Prepare data for Excel - safely handle null values and ensure proper formatting
        const excelData = components.map(component => ({
            'Component Name': component.name || '',
            'Part Number': component.partNumber || '',
            'Category': component.category || '',
            'Description': component.description || '',
            'Quantity': component.quantity || 0,
            'Unit': component.unit || '',
            'Unit Price': component.unitPrice || 0,
            'Total Value': component.totalValue || 0,
            'Location': component.location || '',
            'Minimum Stock': component.minStock || 0,
            'Critical Low': component.criticalLow || 0,
            'Manufacturer': component.manufacturer || '',
            'Datasheet Link': component.datasheetLink || '',
            'Created Date': component.createdAt ? component.createdAt.toISOString().split('T')[0] : '',
            'Last Updated': component.updatedAt ? component.updatedAt.toISOString().split('T')[0] : ''
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Components');

        try {
            // Generate buffer
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            // Set headers for download
            res.setHeader('Content-Disposition', `attachment; filename="components-export-${Date.now()}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            return res.send(buffer);
        } catch (xlsxError) {
            console.error('Error generating Excel file:', xlsxError);
            return res.status(500).json({ msg: 'Error generating Excel file' });
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ msg: 'Server error during export' });
    }
};

// Import components from Excel
exports.importComponents = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        // Read the uploaded file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const results = {
            successful: 0,
            failed: 0,
            errors: []
        };

        for (const row of data) {
            try {
                // Map Excel columns to database fields
                const componentData = {
                    name: row['Component Name'] || row.name,
                    partNumber: row['Part Number'] || row.partNumber,
                    category: row['Category'] || row.category,
                    description: row['Description'] || row.description,
                    quantity: parseInt(row['Quantity'] || row.quantity) || 0,
                    unit: row['Unit'] || row.unit || 'pcs',
                    unitPrice: parseFloat(row['Unit Price'] || row.unitPrice) || 0,
                    location: row['Location'] || row.location,
                    minStock: parseInt(row['Minimum Stock'] || row.minStock) || 0,
                    criticalLow: parseInt(row['Critical Low'] || row.criticalLow) || 0,
                    manufacturer: row['Manufacturer'] || row.manufacturer,
                    datasheetLink: row['Datasheet Link'] || row.datasheetLink
                };

                // Validate required fields
                if (!componentData.name || !componentData.partNumber || !componentData.category) {
                    results.failed++;
                    results.errors.push(`Row missing required fields: ${componentData.name || 'Unknown'}`);
                    continue;
                }

                // Check if component already exists
                const existingComponent = await Component.findOne({ partNumber: componentData.partNumber });

                if (existingComponent) {
                    // Update existing component
                    Object.assign(existingComponent, componentData);
                    await existingComponent.save();

                    // Log the update
                    await new Log({
                        component: existingComponent._id,
                        componentName: existingComponent.name,
                        componentPartNumber: existingComponent.partNumber,
                        type: 'adjustment',
                        quantity: existingComponent.quantity,
                        user: req.user.id,
                        userName: req.user.name,
                        reason: 'Bulk import update',
                        metadata: { source: 'excel_import' }
                    }).save();
                } else {
                    // Create new component
                    const newComponent = new Component(componentData);
                    await newComponent.save();

                    // Log the creation
                    await new Log({
                        component: newComponent._id,
                        componentName: newComponent.name,
                        componentPartNumber: newComponent.partNumber,
                        type: 'inward',
                        quantity: newComponent.quantity,
                        user: req.user.id,
                        userName: req.user.name,
                        reason: 'Bulk import creation',
                        metadata: { source: 'excel_import' }
                    }).save();
                }

                results.successful++;
            } catch (error) {
                results.failed++;
                results.errors.push(`Error processing row: ${error.message}`);
            }
        }

        res.json({
            msg: 'Import completed',
            results
        });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ msg: 'Server error during import' });
    }
};

// Export activity logs to Excel
exports.exportLogs = async (req, res) => {
    try {
        console.log('Exporting activity logs to Excel...');
        const { startDate, endDate, type, componentId } = req.query;

        let query = {};
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (type) query.type = type;
        if (componentId) query.componentId = componentId;

        const logs = await Log.find(query)
            .populate('componentId', 'name partNumber category')
            .populate('userId', 'name email')
            .sort({ date: -1 });

        console.log(`Found ${logs.length} logs to export`);

        if (logs.length === 0) {
            return res.status(200).json({ msg: 'No logs to export' });
        }

        // Prepare data for Excel with safe handling of potentially null values
        const excelData = logs.map(log => ({
            'Date': log.date ? log.date.toISOString() : new Date().toISOString(),
            'Type': (log.type || '').toUpperCase(),
            'Component Name': log.componentName || '',
            'Quantity': log.quantity || 0,
            'Remaining Quantity': log.remainingQuantity || 0,
            'User': log.userName || '',
            'Reason': log.reason || '',
            'Notes': log.notes || '',
            'Location': log.location || '',
            'Batch Number': log.batchNumber || '',
            'Supplier': log.supplier || '',
            'Project': log.project || '',
            'Invoice Number': log.invoiceNumber || '',
            'Cost': log.cost || 0,
            'Date Added': log.date ? log.date.toISOString().split('T')[0] : ''
        }));

        try {
            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs');

            // Generate buffer
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            // Set headers for download
            res.setHeader('Content-Disposition', `attachment; filename="activity-logs-export-${Date.now()}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            return res.send(buffer);
        } catch (xlsxError) {
            console.error('Error generating Excel file:', xlsxError);
            return res.status(500).json({ msg: 'Error generating Excel file' });
        }
    } catch (error) {
        console.error('Export logs error:', error);
        res.status(500).json({ msg: 'Server error during logs export' });
    }
};

// Generate component template for import
exports.generateTemplate = (req, res) => {
    try {
        const templateData = [
            {
                'Component Name': 'Sodium Chloride',
                'Part Number': 'CHM-001',
                'Category': 'Chemical',
                'Description': 'High purity sodium chloride for laboratory use',
                'Quantity': 100,
                'Unit': 'g',
                'Unit Price': 25.50,
                'Location': 'Cabinet A-1',
                'Minimum Stock': 10,
                'Critical Low': 5,
                'Manufacturer': 'Sigma-Aldrich',
                'Datasheet Link': 'https://example.com/datasheet'
            }
        ];

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(templateData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Components Template');

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for download
        res.setHeader('Content-Disposition', 'attachment; filename="components-import-template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buffer);
    } catch (error) {
        console.error('Template generation error:', error);
        res.status(500).json({ msg: 'Server error during template generation' });
    }
};
