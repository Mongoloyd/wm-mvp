/**
 * AdminPartners — White-label client management dashboard.
 * CRUD for clients + meta_configurations, realtime CAPI signal log.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { toast } from "sonner";
import {
  Plus, Check, Copy, ChevronDown, ChevronRight, X, Loader2,
  Globe, Settings, Radio, ExternalLink, Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/* ── Types ──────────────────────────────────────────────────── */

interface Client {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

interface MetaConfig {
  id: string;
  client_id: string | null;
  pixel_id: string | null;
  access_token: string | null;
  test_event_code: string | null;
  is_default: boolean;
  updated_at: string;
}

interface SignalLog {
  id: string;
  client_slug: string | null;
  event_name: string | null;
  pixel_id: string | null;
  status_code: number | null;
  payload: any;
  response: any;
  fired_at: string;
}

/* ── Helpers ────────────────────────────────────────────────── */

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function relTime(iso: string) {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return d.toLocaleDateString();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

/* ══════════════════════════════════════════════════════════════
   Client Dossier Modal
   ══════════════════════════════════════════════════════════════ */

interface DossierModalProps {
  open: boolean;
  onClose: () => void;
  client: Client | null; // null = create mode
  metaConfig: MetaConfig | null;
  existingSlugs: string[];
  onSaved: () => void;
}

function ClientDossierModal({ open, onClose, client, metaConfig, existingSlugs, onSaved }: DossierModalProps) {
  const isEdit = !!client;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [testEventCode, setTestEventCode] = useState("");
  const [tokenDirty, setTokenDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return;
    if (client) {
      setName(client.name);
      setSlug(client.slug);
      setIsActive(client.is_active);
      setPixelId(metaConfig?.pixel_id ?? "");
      setAccessToken(""); // never prefill token
      setTestEventCode(metaConfig?.test_event_code ?? "");
      setTokenDirty(false);
    } else {
      setName("");
      setSlug("");
      setIsActive(true);
      setPixelId("");
      setAccessToken("");
      setTestEventCode("");
      setTokenDirty(false);
    }
    setSlugError(null);
    setNameError(null);
    setTouched(false);
  }, [open, client, metaConfig]);

  // Auto-slug from name in create mode
  useEffect(() => {
    if (!isEdit && name) setSlug(slugify(name));
  }, [name, isEdit]);

  // Validate name
  useEffect(() => {
    if (!touched) { setNameError(null); return; }
    if (!name.trim()) { setNameError("Client name is required"); return; }
    setNameError(null);
  }, [name, touched]);

  // Validate slug
  useEffect(() => {
    if (!slug) { setSlugError(null); return; }
    if (!SLUG_REGEX.test(slug)) { setSlugError("Only lowercase letters, numbers, and hyphens"); return; }
    if (slug.length < 2) { setSlugError("Minimum 2 characters"); return; }
    const taken = existingSlugs.filter(s => s !== client?.slug).includes(slug);
    if (taken) { setSlugError("Slug already taken"); return; }
    setSlugError(null);
  }, [slug, existingSlugs, client]);

  const canSave = name.trim() && slug && !slugError && !saving;

  async function handleSave() {
    setTouched(true);
    if (!name.trim()) {
      setNameError("Client name is required");
      return;
    }
    if (!canSave) return;
    setSaving(true);
    try {
      let clientId: string;

      if (isEdit) {
        clientId = client!.id;
        const { error } = await supabase
          .from("clients")
          .update({ name: name.trim(), slug, is_active: isActive })
          .eq("id", clientId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("clients")
          .insert({ name: name.trim(), slug, is_active: isActive })
          .select("id")
          .single();
        if (error) throw error;
        clientId = data.id;
      }

      // Upsert meta_configurations if pixel is provided
      if (pixelId.trim()) {
        const metaPayload: Record<string, any> = {
          client_id: clientId,
          pixel_id: pixelId.trim(),
          test_event_code: testEventCode.trim() || null,
        };
        if (tokenDirty && accessToken.trim()) {
          metaPayload.access_token = accessToken.trim();
        }

        if (metaConfig?.id) {
          const { error } = await supabase
            .from("meta_configurations")
            .update(metaPayload)
            .eq("id", metaConfig.id);
          if (error) throw error;
        } else {
          if (accessToken.trim()) metaPayload.access_token = accessToken.trim();
          const { error } = await supabase
            .from("meta_configurations")
            .insert(metaPayload);
          if (error) throw error;
        }
      }

      toast.success(isEdit ? "Client updated" : "Client created");
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("[AdminPartners] save error:", err);
      toast.error(err?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const lpUrl = slug ? `${window.location.origin}/lp/${slug}` : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Client" : "Add Client"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update client details and pixel configuration." : "Create a new white-label client."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="client-name">Client Name</Label>
            <Input
              id="client-name"
              value={name}
              onChange={e => { setName(e.target.value); setTouched(true); }}
              onBlur={() => setTouched(true)}
              placeholder="Acme Windows"
              className={nameError ? "border-destructive" : ""}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="client-slug">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">/lp/</span>
              <Input
                id="client-slug"
                value={slug}
                onChange={e => setSlug(slugify(e.target.value))}
                placeholder="acme-windows"
                className={slugError ? "border-destructive" : ""}
              />
            </div>
            {slugError && <p className="text-xs text-destructive">{slugError}</p>}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="client-active">Active</Label>
            <Switch id="client-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* ── Meta Pixel Config ── */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meta Pixel Configuration</p>

            <div className="space-y-1.5">
              <Label htmlFor="pixel-id">Pixel ID</Label>
              <Input id="pixel-id" value={pixelId} onChange={e => setPixelId(e.target.value)} placeholder="123456789012345" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="access-token">Access Token</Label>
              <Input
                id="access-token"
                type="password"
                value={accessToken}
                onChange={e => { setAccessToken(e.target.value); setTokenDirty(true); }}
                placeholder={metaConfig?.access_token ? "••••••••  (unchanged)" : "Paste CAPI access token"}
              />
              {isEdit && !tokenDirty && metaConfig?.access_token && (
                <p className="text-[11px] text-muted-foreground">Token on file. Only change if you paste a new one.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="test-event-code">Test Event Code <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="test-event-code" value={testEventCode} onChange={e => setTestEventCode(e.target.value)} placeholder="TEST12345" />
            </div>
          </div>

          {/* ── Landing Page URL ── */}
          {lpUrl && (
            <LandingPageUrl url={lpUrl} />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving…</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Landing Page URL with copy ──────────────────────────────── */

function LandingPageUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = url;

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
      <code className="text-xs flex-1 truncate">{fullUrl}</code>
      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        <span className="ml-1 text-xs">{copied ? "Copied!" : "Copy"}</span>
      </Button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Delete Confirmation Dialog
   ══════════════════════════════════════════════════════════════ */

interface DeleteConfirmProps {
  open: boolean;
  clientName: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ open, clientName, deleting, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will deactivate <strong>{clientName}</strong>. The client record will be preserved but marked inactive.
            Any associated pixel configuration will remain intact.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Deleting…</> : "Delete Client"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ══════════════════════════════════════════════════════════════
   Realtime Signal Log
   ══════════════════════════════════════════════════════════════ */

function SignalLogSection({ clients }: { clients: Client[] }) {
  const [logs, setLogs] = useState<SignalLog[]>([]);
  const [filterSlug, setFilterSlug] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("capi_signal_logs")
        .select("*")
        .order("fired_at", { ascending: false })
        .limit(100);
      setLogs((data ?? []) as SignalLog[]);
      setLoading(false);
    })();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("capi-signal-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "capi_signal_logs" },
        (payload) => {
          const row = payload.new as SignalLog;
          setLogs(prev => [row, ...prev].slice(0, 200));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    if (filterSlug === "all") return logs;
    if (filterSlug === "default") return logs.filter(l => !l.client_slug);
    return logs.filter(l => l.client_slug === filterSlug);
  }, [logs, filterSlug]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider">CAPI Signal Log</h2>
          <span className="text-xs text-muted-foreground">({filtered.length})</span>
        </div>

        <Select value={filterSlug} onValueChange={setFilterSlug}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Signals</SelectItem>
            <SelectItem value="default">Default Pixel</SelectItem>
            {clients.map(c => (
              <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No signals recorded yet.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-3 py-2 w-6"></th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Pixel</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const expanded = expandedId === log.id;
                return (
                  <SignalLogRow
                    key={log.id}
                    log={log}
                    expanded={expanded}
                    onToggle={() => setExpandedId(expanded ? null : log.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SignalLogRow({ log, expanded, onToggle }: { log: SignalLog; expanded: boolean; onToggle: () => void }) {
  const statusOk = log.status_code != null && log.status_code >= 200 && log.status_code < 300;

  return (
    <>
      <tr
        className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-3 py-2">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </td>
        <td className="px-3 py-2 font-mono">{log.event_name ?? "—"}</td>
        <td className="px-3 py-2">{log.client_slug ?? <span className="text-muted-foreground italic">default</span>}</td>
        <td className="px-3 py-2 font-mono">{log.pixel_id ? `…${log.pixel_id.slice(-4)}` : "—"}</td>
        <td className="px-3 py-2 text-center">
          {log.status_code != null ? (
            <Badge variant={statusOk ? "default" : "destructive"} className={`text-[10px] ${statusOk ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : ""}`}>
              {log.status_code}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
        <td className="px-3 py-2 text-right text-muted-foreground">{relTime(log.fired_at)}</td>
      </tr>
      {expanded && (
        <tr className="bg-muted/20">
          <td colSpan={6} className="px-4 py-3">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Payload</p>
              <pre className="text-[11px] font-mono bg-background border rounded p-3 max-h-64 overflow-auto whitespace-pre-wrap break-all">
                {JSON.stringify(log.payload, null, 2) ?? "null"}
              </pre>
              {log.response && (
                <>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-2">Response</p>
                  <pre className="text-[11px] font-mono bg-background border rounded p-3 max-h-40 overflow-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(log.response, null, 2)}
                  </pre>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════════ */

function AdminPartnersContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [configs, setConfigs] = useState<MetaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("meta_configurations").select("*"),
    ]);
    setClients((c ?? []) as Client[]);
    setConfigs((m ?? []) as MetaConfig[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const configByClientId = useMemo(() => {
    const map: Record<string, MetaConfig> = {};
    for (const mc of configs) {
      if (mc.client_id) map[mc.client_id] = mc;
    }
    return map;
  }, [configs]);

  function openCreate() {
    setEditClient(null);
    setModalOpen(true);
  }

  function openEdit(c: Client) {
    setEditClient(c);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Soft-delete: deactivate the client
      const { error } = await supabase
        .from("clients")
        .update({ is_active: false })
        .eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success(`"${deleteTarget.name}" has been deactivated`);
      setDeleteTarget(null);
      fetchAll();
    } catch (err: any) {
      console.error("[AdminPartners] delete error:", err);
      toast.error(err?.message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const existingSlugs = clients.map(c => c.slug);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mr-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CRM</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">White-Label Partners</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {clients.length} client{clients.length !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Client
          </Button>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-8">
        {/* ── Client List ── */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground">No clients yet. Click "Add Client" to get started.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5">Client</th>
                  <th className="px-4 py-2.5">Slug</th>
                  <th className="px-4 py-2.5 text-center">Pixel Status</th>
                  <th className="px-4 py-2.5 text-center">Active</th>
                  <th className="px-4 py-2.5">Created</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => {
                  const mc = configByClientId[c.id];
                  const ready = !!(mc?.pixel_id && mc?.access_token);
                  return (
                    <tr key={c.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">/lp/{c.slug}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={ready ? "default" : "secondary"}
                          className={ready ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}
                        >
                          {ready ? "Ready" : "Needs Setup"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.is_active ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/30" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                          <Settings className="h-3.5 w-3.5 mr-1" /> Manage
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Signal Log ── */}
        <SignalLogSection clients={clients} />
      </div>

      {/* ── Dossier Modal ── */}
      <ClientDossierModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditClient(null); }}
        client={editClient}
        metaConfig={editClient ? configByClientId[editClient.id] ?? null : null}
        existingSlugs={existingSlugs}
        onSaved={fetchAll}
      />

      {/* ── Delete Confirmation ── */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        clientName={deleteTarget?.name ?? ""}
        deleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default function AdminPartners() {
  return (
    <AuthGuard>
      <AdminPartnersContent />
    </AuthGuard>
  );
}
