import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CheckoutResult } from '../types';

export function downloadCheckoutReceipt(result: CheckoutResult, libraryName = 'Lexicon Central Library') {
  const doc = new jsPDF();
  const date = new Date(result.checkoutDate).toLocaleString('zh-CN');

  doc.setFontSize(18);
  doc.text(libraryName, 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text('借书收据', 105, 30, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`日期: ${date}`, 20, 45);
  doc.text(`读者: ${result.reader.name}`, 20, 53);
  doc.text(`读者 ID: ${result.reader.readerId}`, 20, 61);
  doc.text(`应还日期: ${result.dueDate}`, 20, 69);

  autoTable(doc, {
    startY: 78,
    head: [['#', '书名', 'ISBN']],
    body: result.items.map((item, i) => [String(i + 1), item.bookTitle, item.isbn || '-']),
    theme: 'striped',
    headStyles: { fillColor: [26, 43, 68] },
  });

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 120;
  doc.setFontSize(9);
  doc.text('请妥善保管此收据。逾期将产生罚金。', 20, finalY + 15);
  doc.text('感谢您的使用！', 20, finalY + 23);

  doc.save(`receipt-${result.reader.readerId}-${Date.now()}.pdf`);
}

export async function downloadReportPdf(days: number) {
  const { api } = await import('../api/client');
  const blob = await api.reports.exportPdf(days);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lexis-report-${days}days.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportReportClientPdf(data: {
  libraryName: string;
  days: number;
  overview: { totalBorrowings: number; activeReaders: number; collectionGrowth: number; turnoverRate: number };
  trends: { date: string; borrowed: number; returned: number }[];
  categories: { name: string; percentage: number }[];
  logs: { date: string; category: string; description: string }[];
}) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(data.libraryName, 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`运营报表 (最近 ${data.days} 天)`, 105, 30, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 20, 42);

  doc.text(`借阅总量: ${data.overview.totalBorrowings}`, 20, 54);
  doc.text(`活跃读者: ${data.overview.activeReaders}`, 20, 62);
  doc.text(`馆藏增长: ${data.overview.collectionGrowth}`, 20, 70);
  doc.text(`周转率: ${data.overview.turnoverRate} 次/本`, 20, 78);

  autoTable(doc, {
    startY: 88,
    head: [['分类', '占比']],
    body: data.categories.map((c) => [c.name, `${c.percentage}%`]),
    theme: 'grid',
    headStyles: { fillColor: [26, 43, 68] },
  });

  const y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 130;
  autoTable(doc, {
    startY: y + 10,
    head: [['日期', '类别', '描述']],
    body: data.logs.map((l) => [l.date, l.category, l.description]),
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
  });

  doc.save(`lexis-report-${data.days}days.pdf`);
}
