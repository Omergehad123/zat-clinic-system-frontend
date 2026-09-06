import ExcelJS from 'exceljs';

export async function exportStyledExcel({ filename, sheets = [] }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Clinic Management System';
  workbook.created = new Date();

  sheets.forEach(({ name, title, subtitle, columns = [], rows = [], summaryRow }) => {
    const sheet = workbook.addWorksheet(name);
    sheet.views = [{ rtl: true, showGridLines: true }];

    let currentRow = 1;

    // Title Banner
    if (title) {
      sheet.mergeCells(currentRow, 1, currentRow, Math.max(columns.length, 1));
      const titleCell = sheet.getCell(currentRow, 1);
      titleCell.value = title;
      titleCell.font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Dark Navy
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(currentRow).height = 36;
      currentRow++;
    }

    // Subtitle Banner
    if (subtitle) {
      sheet.mergeCells(currentRow, 1, currentRow, Math.max(columns.length, 1));
      const subCell = sheet.getCell(currentRow, 1);
      subCell.value = subtitle;
      subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
      subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(currentRow).height = 24;
      currentRow++;

      // Spacing row
      sheet.getRow(currentRow).height = 8;
      currentRow++;
    }

    // Headers
    const headerRowIndex = currentRow;
    columns.forEach((col, colIdx) => {
      const cell = sheet.getCell(headerRowIndex, colIdx + 1);
      cell.value = col.header;
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: col.headerColor || 'FF1E293B' } };
      cell.alignment = { horizontal: col.align || 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } }
      };
    });
    sheet.getRow(headerRowIndex).height = 28;
    currentRow++;

    // Data Rows
    rows.forEach((rowData, rIdx) => {
      const row = sheet.getRow(currentRow);
      const isEven = rIdx % 2 === 0;
      const bg = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Zebra striping

      columns.forEach((col, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        let val = rowData[col.key];

        if (col.type === 'currency') {
          cell.value = typeof val === 'number' ? val : (parseFloat(val) || 0);
          cell.numFmt = '#,##0 "ج.م"';
        } else if (col.type === 'number') {
          cell.value = typeof val === 'number' ? val : (parseInt(val) || 0);
          cell.numFmt = '#,##0';
        } else {
          cell.value = val !== undefined && val !== null ? String(val) : '-';
        }

        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = { 
          horizontal: col.align || (col.type === 'currency' || col.type === 'number' ? 'center' : 'right'), 
          vertical: 'middle' 
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
      row.height = 24;
      currentRow++;
    });

    // Summary Row
    if (summaryRow) {
      const row = sheet.getRow(currentRow);
      columns.forEach((col, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        let val = summaryRow[col.key];

        if (col.type === 'currency') {
          cell.value = typeof val === 'number' ? val : (parseFloat(val) || 0);
          cell.numFmt = '#,##0 "ج.م"';
        } else if (col.type === 'number') {
          cell.value = typeof val === 'number' ? val : (parseInt(val) || 0);
          cell.numFmt = '#,##0';
        } else {
          cell.value = val !== undefined && val !== null ? String(val) : '';
        }

        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Soft amber summary
        cell.alignment = { 
          horizontal: col.align || (col.type === 'currency' || col.type === 'number' ? 'center' : 'right'), 
          vertical: 'middle' 
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF0F172A' } },
          bottom: { style: 'double', color: { argb: 'FF0F172A' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
      });
      row.height = 26;
    }

    // Auto Column Widths
    columns.forEach((col, colIdx) => {
      let maxLen = (col.header || '').length;
      rows.forEach(r => {
        const v = r[col.key];
        if (v) {
          const len = String(v).length;
          if (len > maxLen) maxLen = len;
        }
      });
      const colObj = sheet.getColumn(colIdx + 1);
      colObj.width = Math.max(col.width || 20, Math.min(maxLen + 8, 48));
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
