'use client';

// admin-ui/app/(admin)/emails/_components/email-preview-modal.tsx
import { useState, useEffect } from 'react';
import { api } from '@/lib';
import { Button, useToast } from '@/components/ui';
import { Monitor, Smartphone, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface EmailPreviewModalProps {
  subject: string;
  bodyHtml: string;
  onClose: () => void;
}

export default function EmailPreviewModal({
  subject,
  bodyHtml,
  onClose,
}: EmailPreviewModalProps) {
  const { toast } = useToast();
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState<boolean>(true);

  const [testEmail, setTestEmail] = useState<string>('');
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchPreview() {
      setLoadingPreview(true);
      try {
        const res = await api.post<{ subject: string; renderedHtml: string }>(
          '/api/admin/emails/preview',
          { subject: subject || 'No Subject', bodyHtml: bodyHtml || '<p>No content provided</p>' },
        );
        if (mounted) {
          setPreviewHtml(res.renderedHtml);
        }
      } catch (err: unknown) {
        if (mounted) {
          setPreviewHtml(
            `<div style="padding:24px;font-family:sans-serif;color:#ef4444;">Failed to render preview: ${
              err instanceof Error ? err.message : 'Unknown error'
            }</div>`,
          );
        }
      } finally {
        if (mounted) setLoadingPreview(false);
      }
    }

    fetchPreview();
    return () => {
      mounted = false;
    };
  }, [subject, bodyHtml]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      toast({ type: 'error', message: 'Please provide a valid email address.' });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      await api.post('/api/admin/emails/test', {
        toEmail: testEmail,
        subject: subject || 'Test Subject',
        bodyHtml: bodyHtml || '<p>Test email body</p>',
      });
      setTestResult({
        success: true,
        message: `Test email successfully dispatched to ${testEmail}`,
      });
      toast({ type: 'success', message: `Test email sent to ${testEmail}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send test email';
      setTestResult({
        success: false,
        message: msg,
      });
      toast({ type: 'error', message: msg });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] max-h-[800px] w-full max-w-4xl space-y-4">
      {/* Top Controls: Mode Switcher & Test Send Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              deviceMode === 'desktop'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="h-4 w-4" />
            <span>Desktop (600px)</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              deviceMode === 'mobile'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Mobile (360px)</span>
          </button>
        </div>

        {/* Test Send Form */}
        <form onSubmit={handleSendTest} className="flex items-center space-x-2">
          <input
            type="email"
            placeholder="admin@cykruit.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 w-56"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={sendingTest || !testEmail}
            className="flex items-center space-x-1"
          >
            {sendingTest ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>Send Test</span>
          </Button>
        </form>
      </div>

      {testResult && (
        <div
          className={`flex items-center space-x-2 p-2.5 rounded-md text-xs ${
            testResult.success
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Preview Frame Container */}
      <div className="flex-1 bg-slate-100/90 rounded-xl p-6 overflow-auto flex items-center justify-center border border-slate-200 min-h-[500px]">
        {loadingPreview ? (
          <div className="flex flex-col items-center justify-center space-y-2 text-slate-500 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B3C8B]" />
            <p className="text-xs font-semibold">Generating email preview...</p>
          </div>
        ) : deviceMode === 'desktop' ? (
          /* Desktop View: Full Card Preview */
          <div className="w-full max-w-[660px] h-[520px] bg-white rounded-xl shadow-lg border border-slate-300/80 overflow-hidden flex flex-col transition-all duration-300">
            <div className="h-7 bg-slate-100 border-b border-slate-200 px-3 flex items-center space-x-1.5 flex-shrink-0">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              <span className="text-[10px] text-slate-400 font-mono ml-2">Desktop Preview (600px wrapper)</span>
            </div>
            <iframe
              title="Email Desktop Preview"
              srcDoc={previewHtml}
              className="w-full flex-1 border-0 bg-slate-50"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          /* Mobile View: Smartphone Frame */
          <div className="w-[360px] h-[540px] bg-slate-900 rounded-[36px] p-2.5 shadow-2xl border-4 border-slate-700 flex flex-col transition-all duration-300">
            {/* Phone Speaker Notch */}
            <div className="w-20 h-4 bg-slate-900 mx-auto rounded-b-xl mb-1 flex items-center justify-center">
              <div className="w-8 h-1 bg-slate-700 rounded-full" />
            </div>
            {/* Screen */}
            <div className="flex-1 bg-white rounded-[26px] overflow-hidden border border-slate-800 flex flex-col">
              <iframe
                title="Email Mobile Preview"
                srcDoc={previewHtml}
                className="w-full flex-1 border-0"
                sandbox="allow-same-origin"
              />
            </div>
            {/* Home Indicator */}
            <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-end pt-2">
        <Button variant="secondary" onClick={onClose}>
          Close Preview
        </Button>
      </div>
    </div>
  );
}
