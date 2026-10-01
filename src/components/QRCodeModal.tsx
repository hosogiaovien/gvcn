import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer, Copy, Check, ExternalLink } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  className: string;
  shareUrl: string;
}

export const QRCodeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  token,
  className,
  shareUrl,
}) => {
  const { showToast } = useNotification();
  const [copied, setCopied] = React.useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_Thi_Dua_${className}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã tải mã QR dạng SVG!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 print:border-none print:shadow-none">
        {/* Header - hide on print */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <h3 className="font-bold text-slate-800 text-base">
            Mã QR Chia Sẻ Cho Phụ Huynh ({className})
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 text-center space-y-4 print:p-8" ref={qrRef}>
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-indigo-600 mb-1">
              TH&amp;THCS BÀN LONG &bull; NĂM HỌC 2026–2027
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              BẢNG THI ĐUA LỚP {className}
            </h2>
            <p className="text-sm md:text-base text-slate-600 mt-2 font-medium leading-relaxed">
              Quét mã QR bên dưới bằng Zalo hoặc Camera điện thoại để xem kết quả thi đua của lớp
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 inline-block mx-auto print:border-2 print:border-slate-800">
            <QRCodeSVG
              value={shareUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="text-xs font-mono bg-slate-100 p-2 rounded-lg text-slate-600 break-all select-all print:text-black">
            {shareUrl}
          </div>

          <div className="text-[11px] text-slate-400 print:text-slate-600">
            * Dữ liệu thi đua được giáo viên chủ nhiệm cập nhật hàng tuần. Thông tin riêng tư của học sinh được bảo vệ an toàn.
          </div>
        </div>

        {/* Actions - hide on print */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 print:hidden">
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition"
          >
            <ExternalLink className="w-4 h-4" /> Mở trang
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Đã sao chép' : 'Sao chép link'}
            </button>
            <button
              onClick={handleDownloadSVG}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" /> Tải SVG
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-4 h-4" /> In Thẻ QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
