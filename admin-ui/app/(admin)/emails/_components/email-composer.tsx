'use client';

// admin-ui/app/(admin)/emails/_components/email-composer.tsx
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib';
import type { EmailRecipientType } from '@/lib';
import { Button, useToast, useModal } from '@/components/ui';
import {
  Send,
  Eye,
  Users,
  Mail,
  Upload,
  Sparkles,
  Bold,
  Italic,
  Heading2,
  List,
  Link2,
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Undo2,
  Redo2,
} from 'lucide-react';
import EmailPreviewModal from './email-preview-modal';

interface EmailComposerProps {
  initialSubject?: string;
  initialBody?: string;
}

export default function EmailComposer({
  initialSubject = '',
  initialBody = '',
}: EmailComposerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { openModal, closeModal } = useModal();

  const [recipientType, setRecipientType] = useState<EmailRecipientType>('SEGMENT');
  const [segmentTarget, setSegmentTarget] = useState<string>('ALL');
  const [customEmailsRaw, setCustomEmailsRaw] = useState<string>('');
  const [subject, setSubject] = useState<string>(initialSubject);
  const [bodyHtml, setBodyHtml] = useState<string>(
    initialBody ||
      `<p>Hi {{firstName}},</p>\n<p>We are reaching out with an important update regarding your Cykruit account.</p>\n<p>Best regards,<br>The Cykruit Team</p>`,
  );

  const [submitting, setSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Helper to extract unique valid email list from raw text
  const parseEmails = (text: string): string[] => {
    const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    return Array.from(new Set(matches.map((e) => e.toLowerCase())));
  };

  const parsedCustomEmails = parseEmails(customEmailsRaw);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const found = parseEmails(content);
        if (found.length === 0) {
          toast({ type: 'error', message: 'No valid email addresses found in file.' });
        } else {
          setCustomEmailsRaw((prev) => (prev ? `${prev}\n${found.join('\n')}` : found.join('\n')));
          toast({ type: 'success', message: `Imported ${found.length} emails from ${file.name}` });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Explicit history stack for robust Ctrl+Z / Ctrl+Y support in controlled textarea
  const [history, setHistory] = useState<{ past: string[]; future: string[] }>({
    past: [],
    future: [],
  });

  const pushHistory = (prevState: string) => {
    setHistory((prev) => ({
      past: [...prev.past.slice(-100), prevState],
      future: [],
    }));
  };

  const handleUndo = () => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);

    setHistory((prev) => ({
      past: newPast,
      future: [bodyHtml, ...prev.future],
    }));
    setBodyHtml(previous);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);

    setHistory((prev) => ({
      past: [...prev.past, bodyHtml],
      future: newFuture,
    }));
    setBodyHtml(next);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else {
        e.preventDefault();
        handleUndo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handleRedo();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    // Push previous to history when user modifies content
    pushHistory(bodyHtml);
    setBodyHtml(newVal);
  };

  const insertVariable = (tag: string) => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : bodyHtml.length;
    const end = textarea ? textarea.selectionEnd : bodyHtml.length;
    const nextVal = bodyHtml.substring(0, start) + tag + bodyHtml.substring(end);

    pushHistory(bodyHtml);
    setBodyHtml(nextVal);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }
    }, 0);
  };

  const insertTagWrapper = (openTag: string, closeTag: string) => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : bodyHtml.length;
    const end = textarea ? textarea.selectionEnd : bodyHtml.length;
    const selected = bodyHtml.substring(start, end) || 'text';
    const replacement = `${openTag}${selected}${closeTag}`;
    const nextVal = bodyHtml.substring(0, start) + replacement + bodyHtml.substring(end);

    pushHistory(bodyHtml);
    setBodyHtml(nextVal);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start + openTag.length, start + openTag.length + selected.length);
      }
    }, 0);
  };

  const handleOpenPreview = () => {
    openModal({
      title: 'Email Layout Preview & Test Send',
      size: '4xl',
      content: (
        <EmailPreviewModal
          subject={subject}
          bodyHtml={bodyHtml}
          onClose={closeModal}
        />
      ),
    });
  };

  const handleSendCampaign = async () => {
    if (!subject.trim()) {
      toast({ type: 'error', message: 'Subject line cannot be empty.' });
      return;
    }
    if (!bodyHtml.trim()) {
      toast({ type: 'error', message: 'Email body cannot be empty.' });
      return;
    }

    if (recipientType === 'CUSTOM_LIST' && parsedCustomEmails.length === 0) {
      toast({ type: 'error', message: 'Please provide at least one valid recipient email.' });
      return;
    }

    const recipientDescription =
      recipientType === 'SEGMENT'
        ? `all users in segment "${segmentTarget}"`
        : `${parsedCustomEmails.length} custom recipients`;

    openModal({
      title: 'Confirm Campaign Broadcast',
      content: (
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Are you ready to send this broadcast?</p>
              <p className="mt-1 text-xs text-amber-800">
                This will dispatch emails to <strong>{recipientDescription}</strong>. This action
                cannot be undone.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
            <p>
              <strong>Subject:</strong> {subject}
            </p>
            <p>
              <strong>Recipient Mode:</strong> {recipientType}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                closeModal();
                executeSend();
              }}
              disabled={submitting}
              className="flex items-center space-x-1.5"
            >
              <Send className="h-4 w-4" />
              <span>Confirm & Dispatch</span>
            </Button>
          </div>
        </div>
      ),
    });
  };

  const executeSend = async () => {
    setSubmitting(true);
    try {
      const payload = {
        subject,
        bodyHtml,
        recipientType,
        segmentTarget: recipientType === 'SEGMENT' ? segmentTarget : undefined,
        customEmails: recipientType === 'CUSTOM_LIST' ? parsedCustomEmails : undefined,
      };

      const res = await api.post<{ campaignId?: string; totalRecipients?: number; status?: string }>(
        '/api/admin/emails/send',
        payload,
      );

      toast({
        type: 'success',
        message: 'Campaign successfully queued for delivery.',
      });

      if (res?.campaignId) {
        router.push(`/emails/${res.campaignId}`);
      } else {
        router.push('/emails');
      }
    } catch (err: unknown) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to dispatch email campaign',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Recipient Targeting Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-800" />
            <span>1. Select Recipients</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {recipientType === 'SEGMENT'
              ? `Segment: ${segmentTarget}`
              : `${parsedCustomEmails.length} recipients selected`}
          </span>
        </div>

        {/* Tab selection */}
        <div className="flex rounded-lg bg-slate-100 p-1 max-w-md">
          <button
            type="button"
            onClick={() => setRecipientType('SEGMENT')}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition ${
              recipientType === 'SEGMENT'
                ? 'bg-white text-blue-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Target Audience Segment
          </button>
          <button
            type="button"
            onClick={() => setRecipientType('CUSTOM_LIST')}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition ${
              recipientType === 'CUSTOM_LIST'
                ? 'bg-white text-blue-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Email List / CSV
          </button>
        </div>

        {/* Segment Options */}
        {recipientType === 'SEGMENT' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {[
              { id: 'ALL', label: 'All Users', desc: 'All verified seekers & employers' },
              { id: 'SEEKERS', label: 'Job Seekers Only', desc: 'Candidate accounts' },
              { id: 'EMPLOYERS', label: 'Employers Only', desc: 'Registered hiring teams' },
              { id: 'ACTIVE', label: 'Active Users', desc: 'Status is ACTIVE' },
            ].map((seg) => (
              <label
                key={seg.id}
                onClick={() => setSegmentTarget(seg.id)}
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition ${
                  segmentTarget === seg.id
                    ? 'border-blue-700 bg-blue-50/60 ring-1 ring-blue-700'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900">{seg.label}</span>
                  {segmentTarget === seg.id && (
                    <CheckCircle2 className="h-4 w-4 text-blue-700" />
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-1">{seg.desc}</span>
              </label>
            ))}
          </div>
        ) : (
          /* Custom Email List */
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Paste Email Addresses (one per line, or comma-separated):
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1.5 text-xs"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Import from CSV/TXT</span>
                </Button>
              </div>
            </div>

            <textarea
              rows={4}
              value={customEmailsRaw}
              onChange={(e) => setCustomEmailsRaw(e.target.value)}
              placeholder="user1@example.com, user2@example.com&#10;user3@company.com"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            {parsedCustomEmails.length > 0 && (
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border text-xs text-slate-600">
                <span>
                  <strong>{parsedCustomEmails.length}</strong> unique valid email address(es) parsed.
                </span>
                <button
                  type="button"
                  onClick={() => setCustomEmailsRaw('')}
                  className="text-red-600 hover:text-red-800 text-xs font-medium"
                >
                  Clear list
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Email Composition Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-800" />
            <span>2. Email Content & Design</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            HTML & Dynamic Variables Supported
          </span>
        </div>

        {/* Subject Line */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Subject Line</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Important platform announcement for all members"
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Dynamic Variable Tags Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-1 text-xs text-blue-900 font-semibold mr-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-700" />
            <span>Insert Dynamic Tags:</span>
          </div>
          {[
            { tag: '{{firstName}}', desc: 'First Name' },
            { tag: '{{lastName}}', desc: 'Last Name' },
            { tag: '{{fullName}}', desc: 'Full Name' },
            { tag: '{{email}}', desc: 'Email' },
          ].map((v) => (
            <button
              key={v.tag}
              type="button"
              onClick={() => insertVariable(v.tag)}
              className="px-2.5 py-1 bg-white hover:bg-blue-100/50 text-blue-900 border border-blue-200 rounded text-xs font-mono font-medium transition shadow-2xs"
            >
              + {v.tag}
            </button>
          ))}
        </div>

        {/* Formatting Quick Tools */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-slate-700">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-400 font-medium mr-2">Formatting:</span>
            <button
              type="button"
              onClick={() => insertTagWrapper('<strong>', '</strong>')}
              title="Bold"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTagWrapper('<em>', '</em>')}
              title="Italic"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTagWrapper('<h3>', '</h3>')}
              title="Heading"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTagWrapper('<ul>\n  <li>', '</li>\n</ul>')}
              title="List"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTagWrapper('<a href="https://cykruit.com" style="color:#1B3C8B;">', '</a>')}
              title="Link"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
            >
              <Link2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertTagWrapper(
                  '<a href="https://cykruit.com" class="cykruit-btn" style="display:inline-block;padding:12px 24px;background:#1B3C8B;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0;">',
                  '</a>',
                )
              }
              title="CTA Button"
              className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded font-medium text-slate-800 transition"
            >
              + CTA Button
            </button>
          </div>

          <div className="flex items-center space-x-1 text-slate-500">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.past.length === 0}
              title="Undo (Ctrl+Z)"
              className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded transition text-xs flex items-center space-x-1 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={history.future.length === 0}
              title="Redo (Ctrl+Y)"
              className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded transition text-xs flex items-center space-x-1 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Redo2 className="h-3.5 w-3.5" />
              <span>Redo</span>
            </button>
          </div>
        </div>

        {/* HTML / Rich Text Editor Area */}
        <div className="space-y-1.5">
          <textarea
            ref={textareaRef}
            rows={12}
            value={bodyHtml}
            onChange={handleTextareaChange}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Write your email body in HTML format..."
            className="w-full px-3.5 py-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-900 text-slate-100 leading-relaxed"
          />
          <p className="text-[11px] text-slate-400">
            Note: Your email will automatically be wrapped in the official Cykruit responsive
            email template with company header and footer.
          </p>
        </div>
      </div>

      {/* 3. Action Footer Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Button variant="secondary" onClick={() => router.push('/emails')}>
          Cancel
        </Button>

        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleOpenPreview}
            className="flex items-center space-x-1.5"
          >
            <Eye className="h-4 w-4 text-slate-600" />
            <span>Preview & Send Test</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSendCampaign}
            disabled={submitting}
            className="flex items-center space-x-1.5"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Launch Broadcast</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
