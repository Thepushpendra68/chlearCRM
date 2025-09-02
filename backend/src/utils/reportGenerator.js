const fs = require('fs');
const path = require('path');

/**
 * Generate CSV report
 */
const generateCSV = async (data, filename) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data provided for CSV generation');
    }

    // Get headers from first row
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvContent += values.join(',') + '\n';
    });

    const fullFilename = `${filename}.csv`;
    
    return {
      data: csvContent,
      filename: fullFilename,
      contentType: 'text/csv'
    };
  } catch (error) {
    throw new Error(`Failed to generate CSV: ${error.message}`);
  }
};

/**
 * Generate Excel report (simplified - would use xlsx library in production)
 */
const generateExcel = async (data, filename) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data provided for Excel generation');
    }

    // For now, return CSV format as Excel
    // In production, you would use a library like 'xlsx' to create actual Excel files
    const csvResult = await generateCSV(data, filename);
    
    return {
      data: csvResult.data,
      filename: `${filename}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  } catch (error) {
    throw new Error(`Failed to generate Excel: ${error.message}`);
  }
};

/**
 * Generate PDF report (simplified - would use PDF library in production)
 */
const generatePDF = async (data, reportType, filename) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data provided for PDF generation');
    }

    // For now, return HTML format as PDF
    // In production, you would use a library like 'puppeteer' or 'pdfkit' to create actual PDF files
    const htmlContent = generateHTMLReport(data, reportType);
    
    return {
      data: htmlContent,
      filename: `${filename}.pdf`,
      contentType: 'application/pdf'
    };
  } catch (error) {
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Generate HTML report (used for PDF generation)
 */
const generateHTMLReport = (data, reportType) => {
  const currentDate = new Date().toLocaleDateString();
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportType} Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .report-title { font-size: 24px; font-weight: bold; color: #333; }
        .report-date { color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .summary { margin-bottom: 20px; padding: 15px; background-color: #f0f8ff; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="report-title">${reportType} Report</div>
        <div class="report-date">Generated on ${currentDate}</div>
      </div>
  `;

  // Add summary if data has summary information
  if (data.summary) {
    html += '<div class="summary"><h3>Summary</h3>';
    Object.entries(data.summary).forEach(([key, value]) => {
      html += `<p><strong>${key}:</strong> ${value}</p>`;
    });
    html += '</div>';
  }

  // Add data table
  if (Array.isArray(data) && data.length > 0) {
    html += '<table>';
    
    // Table headers
    const headers = Object.keys(data[0]);
    html += '<thead><tr>';
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += '</tr></thead>';
    
    // Table body
    html += '<tbody>';
    data.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        html += `<td>${row[header] || ''}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';
    
    html += '</table>';
  }

  html += '</body></html>';
  
  return html;
};

/**
 * Format data for specific report types
 */
const formatReportData = (data, reportType) => {
  switch (reportType) {
    case 'lead-performance':
      return formatLeadPerformanceData(data);
    case 'team-performance':
      return formatTeamPerformanceData(data);
    case 'pipeline-health':
      return formatPipelineHealthData(data);
    case 'activity-summary':
      return formatActivitySummaryData(data);
    default:
      return data;
  }
};

/**
 * Format lead performance data for export
 */
const formatLeadPerformanceData = (data) => {
  const formatted = [];
  
  if (data.conversionData) {
    data.conversionData.forEach(stage => {
      formatted.push({
        'Stage Name': stage.stage_name,
        'Lead Count': stage.lead_count,
        'Average Probability': `${Math.round(stage.avg_probability || 0)}%`,
        'Total Value': `$${parseFloat(stage.total_value || 0).toLocaleString()}`
      });
    });
  }
  
  return formatted;
};

/**
 * Format team performance data for export
 */
const formatTeamPerformanceData = (data) => {
  const formatted = [];
  
  if (data.userPerformance) {
    data.userPerformance.forEach(user => {
      formatted.push({
        'User': `${user.first_name} ${user.last_name}`,
        'Email': user.email,
        'Total Leads': user.total_leads,
        'Won Leads': user.won_leads,
        'Lost Leads': user.lost_leads,
        'Win Rate': `${Math.round((user.won_leads / (user.won_leads + user.lost_leads)) * 100 || 0)}%`,
        'Average Deal Value': `$${parseFloat(user.avg_deal_value || 0).toLocaleString()}`,
        'Total Deal Value': `$${parseFloat(user.total_deal_value || 0).toLocaleString()}`,
        'Total Activities': user.total_activities,
        'Completed Activities': user.completed_activities
      });
    });
  }
  
  return formatted;
};

/**
 * Format pipeline health data for export
 */
const formatPipelineHealthData = (data) => {
  const formatted = [];
  
  if (data.stageHealth) {
    data.stageHealth.forEach(stage => {
      formatted.push({
        'Stage Name': stage.stage_name,
        'Lead Count': stage.lead_count,
        'Average Probability': `${Math.round(stage.avg_probability || 0)}%`,
        'Average Days in Stage': Math.round(stage.avg_days_in_stage || 0),
        'Stale Leads (>30 days)': stage.stale_leads
      });
    });
  }
  
  return formatted;
};

/**
 * Format activity summary data for export
 */
const formatActivitySummaryData = (data) => {
  const formatted = [];
  
  if (data.activitySummary) {
    data.activitySummary.forEach(activity => {
      formatted.push({
        'Activity Type': activity.activity_type,
        'Total Activities': activity.total_activities,
        'Completed Activities': activity.completed_activities,
        'Completion Rate': `${Math.round((activity.completed_activities / activity.total_activities) * 100 || 0)}%`,
        'Average Duration (minutes)': Math.round(activity.avg_duration_minutes || 0),
        'Unique Leads Contacted': activity.unique_leads_contacted,
        'Unique Users': activity.unique_users
      });
    });
  }
  
  return formatted;
};

/**
 * Generate report metadata
 */
const generateReportMetadata = (reportType, data, filters = {}) => {
  return {
    reportType,
    generatedAt: new Date().toISOString(),
    recordCount: Array.isArray(data) ? data.length : 0,
    filters: filters,
    version: '1.0'
  };
};

module.exports = {
  generateCSV,
  generateExcel,
  generatePDF,
  generateHTMLReport,
  formatReportData,
  formatLeadPerformanceData,
  formatTeamPerformanceData,
  formatPipelineHealthData,
  formatActivitySummaryData,
  generateReportMetadata
};
