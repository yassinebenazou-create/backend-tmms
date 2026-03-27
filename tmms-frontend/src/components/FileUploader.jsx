import { UploadCloud } from 'lucide-react';

function FileUploader({ onChange, onSubmit, loading, file, t }) {
  return (
    <div className="glass-card gradient-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <UploadCloud className="w-5 h-5 text-tmms-blue" />
        <h2 className="text-lg font-semibold">{t('uploadExcelTitle')}</h2>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{t('uploadFormats')}</p>

      <label className="block rounded-xl border border-dashed border-slate-300 p-6 text-center hover:border-tmms-blue transition-colors cursor-pointer bg-white/50 dark:border-slate-600 dark:bg-slate-900/40">
        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onChange} disabled={loading} />
        <span className="text-slate-700 dark:text-slate-200">{file ? file.name : t('chooseExcel')}</span>
      </label>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!file || loading}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('uploading') : t('uploadAndParse')}
      </button>
    </div>
  );
}

export default FileUploader;
