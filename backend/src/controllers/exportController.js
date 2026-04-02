const { Event, Schedule, ActivityCategory } = require('../models');
const { success, error } = require('../utils/responseHelper');
const { catchAsync } = require('../middlewares/errorMiddleware');
const { format } = require('date-fns');
const ExcelJS = require('exceljs');

// Generate CSV content
const generateCSV = (events) => {
    // Vietnamese headers for better readability
    const headers = [
        'Tieu de',
        'Danh muc',
        'Ngay bat dau',
        'Gio bat dau',
        'Ngay ket thuc',
        'Gio ket thuc',
        'Ca ngay',
        'Dia diem',
        'Mo ta',
        'Thoi gian bieu'
    ];

    const csvRows = [headers];

    events.forEach(event => {
        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);

        // Format data with proper Excel formatting
        csvRows.push([
            `"${(event.title || '').replace(/"/g, '""')}"`,
            `"${(event.category_name || 'Khong co danh muc').replace(/"/g, '""')}"`,
            `"${format(startDate, 'dd/MM/yyyy')}"`,
            event.all_day ? '""' : `"${format(startDate, 'HH:mm')}"`,
            `"${format(endDate, 'dd/MM/yyyy')}"`,
            event.all_day ? '""' : `"${format(endDate, 'HH:mm')}"`,
            event.all_day ? '"Co"' : '"Khong"',
            `"${(event.location || '').replace(/"/g, '""')}"`,
            `"${(event.description || '').replace(/"/g, '""')}"`,
            `"${(event.schedule_title || 'Lich mac dinh').replace(/"/g, '""')}"`
        ]);
    });

    // Add UTF-8 BOM for proper Vietnamese character display
    return '\uFEFF' + csvRows.map(row => row.join(',')).join('\r\n');
};

// Generate Excel (.xlsx) content
const generateExcel = async (events) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sach su kien');

    // Define columns with formatting
    worksheet.columns = [
        { header: 'Tiêu đề', key: 'title', width: 25 },
        { header: 'Danh mục', key: 'category', width: 15 },
        { header: 'Ngày bắt đầu', key: 'start_date', width: 15 },
        { header: 'Giờ bắt đầu', key: 'start_time', width: 12 },
        { header: 'Ngày kết thúc', key: 'end_date', width: 15 },
        { header: 'Giờ kết thúc', key: 'end_time', width: 12 },
        { header: 'Cả ngày', key: 'all_day', width: 10 },
        { header: 'Địa điểm', key: 'location', width: 20 },
        { header: 'Mô tả', key: 'description', width: 30 },
        { header: 'Thời gian biểu', key: 'schedule', width: 20 }
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add data rows
    events.forEach((event, index) => {
        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);

        const row = worksheet.addRow({
            title: event.title || '',
            category: event.category_name || 'Không có danh mục',
            start_date: format(startDate, 'dd/MM/yyyy'),
            start_time: event.all_day ? '' : format(startDate, 'HH:mm'),
            end_date: format(endDate, 'dd/MM/yyyy'),
            end_time: event.all_day ? '' : format(endDate, 'HH:mm'),
            all_day: event.all_day ? 'Có' : 'Không',
            location: event.location || '',
            description: event.description || '',
            schedule: event.schedule_title || 'Lịch mặc định'
        });

        // Alternate row colors for better readability
        if (index % 2 === 0) {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2F2F2' }
            };
        }

        // Add borders to all cells
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
        column.alignment = { wrapText: true, vertical: 'top' };
    });

    return workbook;
};

// Generate iCal content
const generateICal = (events, scheduleName = 'Lịch của tôi') => {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Schedule App//Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${scheduleName}`
    ];

    events.forEach(event => {
        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);
        const now = new Date();

        const formatDateTime = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const formatDate = (date) => {
            return date.toISOString().split('T')[0].replace(/-/g, '');
        };

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${event.id}@schedule-app.com`);
        lines.push(`DTSTAMP:${formatDateTime(now)}`);

        if (event.all_day) {
            lines.push(`DTSTART;VALUE=DATE:${formatDate(startDate)}`);
            lines.push(`DTEND;VALUE=DATE:${formatDate(new Date(endDate.getTime() + 86400000))}`); // Add 1 day for all-day events
        } else {
            lines.push(`DTSTART:${formatDateTime(startDate)}`);
            lines.push(`DTEND:${formatDateTime(endDate)}`);
        }

        lines.push(`SUMMARY:${event.title.replace(/[,;\\]/g, '\\$&')}`);

        if (event.description) {
            lines.push(`DESCRIPTION:${event.description.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n')}`);
        }

        if (event.location) {
            lines.push(`LOCATION:${event.location.replace(/[,;\\]/g, '\\$&')}`);
        }

        if (event.category_name) {
            lines.push(`CATEGORIES:${event.category_name}`);
        }

        lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
};

const exportEvents = catchAsync(async (req, res) => {
    const { format: exportFormat = 'csv', schedule_id, category_id } = req.query;

    // Build filters
    const filters = {};
    if (schedule_id) filters.scheduleId = parseInt(schedule_id);
    if (category_id) filters.categoryId = parseInt(category_id);

    console.log('Export request - userId:', req.user.userId, 'filters:', filters);

    // Get events - if no filters, get all events
    const events = await Event.findByUserId(req.user.userId, filters);

    console.log('Found events:', events?.length || 0);

    if (!events || events.length === 0) {
        return error(res, 'Khong co su kien de xuat', 400);
    }

    // Get schedule name if specified
    let scheduleName = 'Lịch của tôi';
    if (schedule_id) {
        const schedule = await Schedule.findById(schedule_id);
        if (schedule && schedule.user_id === req.user.userId) {
            scheduleName = schedule.title;
        }
    }

    const timestamp = format(new Date(), 'yyyy-MM-dd');

    if (exportFormat === 'csv') {
        const csvContent = generateCSV(events);

        // Set proper headers for Excel compatibility
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''Su_kien_${timestamp}.csv`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');
        res.send(csvContent);
    } else if (exportFormat === 'excel') {
        const workbook = await generateExcel(events);

        // Set headers for Excel file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''Danh_sach_su_kien_${timestamp}.xlsx`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');

        // Write Excel file to response
        await workbook.xlsx.write(res);
        res.end();
    } else if (exportFormat === 'ical') {
        const icalContent = generateICal(events, scheduleName);

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${scheduleName.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`);
        res.send(icalContent);
    } else {
        return error(res, 'Định dạng không hỗ trợ', 400);
    }
});

module.exports = {
    exportEvents
};
