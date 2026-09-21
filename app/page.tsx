"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionHashVariant, TransactionStatus } from "genlayer-js/types";
import { Anchor, ArrowUpRight, Check, Clipboard, ExternalLink, FileCheck2, Fingerprint, LoaderCircle, Network, RefreshCw, Search, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";

const CONTRACT_ADDRESS = "0x87Ec1A70241F68587268505730f682434A03D062" as const;
const DEPLOY_TX = "0xb2a0347a9d8097f4d77e64d49aaaf8b8176cb6482b53ae544764f50a193c25a4";
const SOURCE_SHA = "9c6b21c82fde7002e06966b2cfafccb0488c310e060fba200a151b7cb8524e13";
const EXPLORER = `https://explorer-studio.genlayer.com/address/${CONTRACT_ADDRESS}`;
const TX_EXPLORER = "https://explorer-studio.genlayer.com/transactions";
const readClient = createClient({ chain: studionet });

type Config = { name: string; version: string; promise_count: number; exception_count: number; max_exceptions_per_promise: number; acknowledgement_required: boolean };
type PromiseRecord = { promise_id: number; promisor: string; promisee: string; promise_text: string; attempt_count: number; accepted_exception_count: number; active_exception_count: number; swallow_blocks: number };
type Attempt = { attempt_id: number; exception_id: number; verdict: string; accepted: boolean; active: boolean };
type EthereumProvider = { request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>; on?: (event: string, handler: (...args: unknown[]) => void) => void; removeListener?: (event: string, handler: (...args: unknown[]) => void) => void };

function objectify(value: unknown): Record<string, unknown> {
  if (value instanceof Map) return Object.fromEntries(value);
  if (value && typeof value === "object") return value as Record<string, unknown>;
  throw new Error("Unexpected contract response");
}
function asNumber(value: unknown) { return typeof value === "bigint" ? Number(value) : Number(value ?? 0); }
function parseConfig(value: unknown): Config {
  const item = objectify(value);
  return { name: String(item.name ?? "ExceptionSwallowGuard"), version: String(item.version ?? "—"), promise_count: asNumber(item.promise_count), exception_count: asNumber(item.exception_count), max_exceptions_per_promise: asNumber(item.max_exceptions_per_promise), acknowledgement_required: Boolean(item.acknowledgement_required) };
}
function parsePromise(value: unknown): PromiseRecord {
  const item = objectify(value);
  return { promise_id: asNumber(item.promise_id), promisor: String(item.promisor ?? ""), promisee: String(item.promisee ?? ""), promise_text: String(item.promise_text ?? ""), attempt_count: asNumber(item.attempt_count), accepted_exception_count: asNumber(item.accepted_exception_count), active_exception_count: asNumber(item.active_exception_count), swallow_blocks: asNumber(item.swallow_blocks) };
}
function parseAttempts(value: unknown): Attempt[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => { const item = objectify(entry); return { attempt_id: asNumber(item.attempt_id), exception_id: asNumber(item.exception_id), verdict: String(item.verdict ?? ""), accepted: Boolean(item.accepted), active: Boolean(item.active) }; });
}
function short(value: string, head = 6, tail = 4) { return value.length > head + tail + 3 ? `${value.slice(0, head)}…${value.slice(-tail)}` : value; }
function errorMessage(error: unknown) { return error instanceof Error ? error.message.replace(/^.*?\[rollback\]\s*/i, "") : String(error); }
function StatusDot({ connected }: { connected: boolean }) { return <span className={`status-dot ${connected ? "is-live" : ""}`} aria-hidden="true" />; }

export default function Home() {
  const [wallet, setWallet] = useState<`0x${string}` | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [promisee, setPromisee] = useState("");
  const [promiseText, setPromiseText] = useState("");
  const [proposalPromiseId, setProposalPromiseId] = useState("1");
  const [exceptionText, setExceptionText] = useState("");
  const [ackExceptionId, setAckExceptionId] = useState("1");
  const [lookupPromiseId, setLookupPromiseId] = useState("1");
  const [record, setRecord] = useState<PromiseRecord | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [activeTab, setActiveTab] = useState("create");

  const ethereum = useMemo(() => typeof window === "undefined" ? undefined : (window as unknown as { ethereum?: EthereumProvider }).ethereum, []);

  const refreshConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const result = await readClient.readContract({ address: CONTRACT_ADDRESS, functionName: "get_config", args: [], transactionHashVariant: TransactionHashVariant.LATEST_NONFINAL });
      setConfig(parseConfig(result));
    } catch (error) { toast.error("Could not read the contract", { description: errorMessage(error) }); }
    finally { setLoadingConfig(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshConfig(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshConfig]);
  useEffect(() => {
    if (!ethereum?.on) return;
    const onAccounts = (...args: unknown[]) => { const accounts = args[0] as string[] | undefined; setWallet((accounts?.[0] as `0x${string}` | undefined) ?? null); };
    ethereum.on("accountsChanged", onAccounts);
    return () => ethereum.removeListener?.("accountsChanged", onAccounts);
  }, [ethereum]);

  async function connectWallet() {
    if (!ethereum) { toast.error("No EIP-1193 wallet found", { description: "Install MetaMask or open this app inside a compatible wallet." }); return; }
    try {
      const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts[0] as `0x${string}` | undefined;
      if (!address) throw new Error("Wallet returned no account");
      const client = createClient({ chain: studionet, account: address, provider: ethereum });
      await client.connect("studionet");
      setWallet(address);
      toast.success("Wallet connected", { description: `${short(address)} · Studionet 61999` });
    } catch (error) { toast.error("Wallet connection failed", { description: errorMessage(error) }); }
  }

  async function writeContract(functionName: string, args: (string | number)[]) {
    if (!ethereum || !wallet) { await connectWallet(); throw new Error("Connect your wallet, then confirm the action again."); }
    setBusy(functionName);
    try {
      const client = createClient({ chain: studionet, account: wallet, provider: ethereum });
      await client.connect("studionet");
      const hash = await client.writeContract({ address: CONTRACT_ADDRESS, functionName, args, value: BigInt(0) });
      setLastTx(String(hash));
      toast.success("Transaction submitted", { description: short(String(hash), 10, 8) });
      void client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED }).then((receipt) => {
        if (receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN) { toast.success("Consensus accepted the transaction"); void refreshConfig(); }
        else toast.error("Transaction reached consensus but execution failed", { description: receipt.txExecutionResultName });
      }).catch((error) => toast.error("Transaction tracking paused", { description: errorMessage(error) }));
      return hash;
    } catch (error) { toast.error("Transaction was not submitted", { description: errorMessage(error) }); throw error; }
    finally { setBusy(null); }
  }

  async function createPromise(event: React.FormEvent) {
    event.preventDefault();
    if (!promisee.trim() || !promiseText.trim()) return toast.error("Promisee and promise text are required");
    try { await writeContract("create_promise", [promisee.trim(), promiseText.trim()]); setPromiseText(""); } catch {}
  }
  async function proposeException(event: React.FormEvent) {
    event.preventDefault();
    if (!exceptionText.trim()) return toast.error("Exception text is required");
    try { await writeContract("propose_exception", [Number(proposalPromiseId), exceptionText.trim()]); setExceptionText(""); } catch {}
  }
  async function acknowledge(event: React.FormEvent) { event.preventDefault(); try { await writeContract("acknowledge_exception", [Number(ackExceptionId)]); } catch {} }

  async function loadLedger(event?: React.FormEvent) {
    event?.preventDefault(); const id = Number(lookupPromiseId);
    if (!Number.isInteger(id) || id <= 0) return toast.error("Enter a valid promise ID");
    setBusy("ledger");
    try {
      const promiseResult = await readClient.readContract({ address: CONTRACT_ADDRESS, functionName: "get_promise", args: [id], transactionHashVariant: TransactionHashVariant.LATEST_NONFINAL });
      const nextRecord = parsePromise(promiseResult); setRecord(nextRecord);
      if (nextRecord.attempt_count > 0) {
        const attemptResult = await readClient.readContract({ address: CONTRACT_ADDRESS, functionName: "get_attempts", args: [id, 1, Math.min(50, nextRecord.attempt_count)], transactionHashVariant: TransactionHashVariant.LATEST_NONFINAL });
        setAttempts(parseAttempts(attemptResult));
      } else setAttempts([]);
    } catch (error) { setRecord(null); setAttempts([]); toast.error("Promise could not be loaded", { description: errorMessage(error) }); }
    finally { setBusy(null); }
  }

  async function copy(value: string, label: string) { await navigator.clipboard.writeText(value); toast.success(`${label} copied`); }

  return (
    <main className="app-shell">
      <Toaster position="bottom-right" richColors />
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark"><Anchor /></div><div><p className="eyebrow">GenLayer · Meaningful commitments</p><h1>PromiseAnchor</h1></div></div>
        <div className="topbar-actions"><div className="network-pill"><StatusDot connected={Boolean(config)} /><span>Studionet</span><strong>61999</strong></div><Button onClick={connectWallet} className="wallet-button">{wallet ? <Check /> : <Wallet />}{wallet ? short(wallet) : "Connect wallet"}</Button></div>
      </header>

      <section className="hero-grid">
        <div className="hero-copy"><Badge className="signal-badge"><Sparkles /> ON-CHAIN SEMANTIC GUARD</Badge><h2>Make a promise.<br /><span>Test every escape hatch.</span></h2><p>Record an immutable commitment, let GenLayer validators judge proposed exceptions, and require the promisee to acknowledge every valid exception before it becomes active.</p></div>
        <div className="live-card">
          <div className="live-card-head"><div><p className="eyebrow">Live contract state</p><h3>{config?.name ?? "Connecting…"}</h3></div><Button variant="ghost" size="icon" onClick={refreshConfig} aria-label="Refresh contract state"><RefreshCw className={loadingConfig ? "animate-spin" : ""} /></Button></div>
          <div className="metric-row"><div><span>Promises</span><strong>{loadingConfig ? "—" : config?.promise_count ?? 0}</strong></div><div><span>Exceptions</span><strong>{loadingConfig ? "—" : config?.exception_count ?? 0}</strong></div><div><span>Limit / promise</span><strong>{loadingConfig ? "—" : config?.max_exceptions_per_promise ?? 3}</strong></div></div>
          <div className="address-strip"><span>{short(CONTRACT_ADDRESS, 12, 10)}</span><Button variant="ghost" size="icon-xs" onClick={() => copy(CONTRACT_ADDRESS, "Contract address")}><Clipboard /></Button><a href={EXPLORER} target="_blank" rel="noreferrer" aria-label="Open contract in explorer"><ArrowUpRight /></a></div>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="workbench">
        <TabsList variant="line" className="stage-rail" aria-label="PromiseAnchor workflows">
          <TabsTrigger value="create"><span>01</span><div>Create<small>Set the commitment</small></div></TabsTrigger>
          <TabsTrigger value="review"><span>02</span><div>Review<small>Propose & acknowledge</small></div></TabsTrigger>
          <TabsTrigger value="ledger"><span>03</span><div>Ledger<small>Inspect live state</small></div></TabsTrigger>
          <TabsTrigger value="proof"><span>04</span><div>Proof<small>Verify deployment</small></div></TabsTrigger>
        </TabsList>
        <div className="work-canvas">
          <TabsContent value="create">
            <section className="panel-intro"><div><p className="step-label">Stage 01 / Immutable record</p><h3>Create a promise</h3></div><p>The connected wallet becomes the promisor. The recipient address becomes the promisee. Neither role is hardcoded.</p></section>
            <form onSubmit={createPromise} className="form-grid">
              <label className="field-block field-wide"><span>Promisee wallet</span><Input value={promisee} onChange={(e) => setPromisee(e.target.value)} placeholder="0x…" spellCheck={false} /></label>
              <label className="field-block field-wide"><span>Immutable promise</span><Textarea value={promiseText} onChange={(e) => setPromiseText(e.target.value)} placeholder="I promise to…" rows={6} /></label>
              <div className="form-foot field-wide"><p><ShieldCheck /> Stored exactly once. Future exceptions are evaluated against this original text.</p><Button type="submit" disabled={busy === "create_promise"}>{busy === "create_promise" ? <LoaderCircle className="animate-spin" /> : <Anchor />}Anchor promise</Button></div>
            </form>
          </TabsContent>

          <TabsContent value="review">
            <section className="panel-intro"><div><p className="step-label">Stage 02 / Two-party control</p><h3>Review an exception</h3></div><p>Only the on-chain promisor may propose. Only the on-chain promisee may acknowledge an accepted result.</p></section>
            <div className="split-forms">
              <form onSubmit={proposeException} className="action-card"><div className="action-number">A</div><h4>Propose exception</h4><p>Runs decentralized semantic consensus against the immutable promise.</p><label className="field-block"><span>Promise ID</span><Input type="number" min="1" value={proposalPromiseId} onChange={(e) => setProposalPromiseId(e.target.value)} /></label><label className="field-block"><span>Exception text</span><Textarea value={exceptionText} onChange={(e) => setExceptionText(e.target.value)} placeholder="This promise does not apply when…" rows={5} /></label><Button type="submit" disabled={busy === "propose_exception"}>{busy === "propose_exception" ? <LoaderCircle className="animate-spin" /> : <Sparkles />}Request verdict</Button></form>
              <form onSubmit={acknowledge} className="action-card action-card-dark"><div className="action-number">B</div><h4>Acknowledge exception</h4><p>Activates an accepted exception. The contract rejects invalid roles, rejected verdicts, and duplicates.</p><label className="field-block"><span>Exception ID</span><Input type="number" min="1" value={ackExceptionId} onChange={(e) => setAckExceptionId(e.target.value)} /></label><div className="role-note"><Fingerprint /><span>Authorization is derived from contract state—not from this interface.</span></div><Button type="submit" disabled={busy === "acknowledge_exception"}>{busy === "acknowledge_exception" ? <LoaderCircle className="animate-spin" /> : <Check />}Acknowledge</Button></form>
            </div>
          </TabsContent>

          <TabsContent value="ledger">
            <section className="panel-intro"><div><p className="step-label">Stage 03 / Read-only</p><h3>Promise ledger</h3></div><p>Read the newest accepted state directly from the deployed contract. No wallet signature is required.</p></section>
            <form onSubmit={loadLedger} className="lookup-bar"><Input type="number" min="1" value={lookupPromiseId} onChange={(e) => setLookupPromiseId(e.target.value)} aria-label="Promise ID" /><Button type="submit" disabled={busy === "ledger"}>{busy === "ledger" ? <LoaderCircle className="animate-spin" /> : <Search />}Load promise</Button></form>
            {!record ? <div className="empty-ledger"><Network /><h4>No promise loaded</h4><p>Enter an existing ID above. The fresh deployment begins at zero.</p></div> : <div className="ledger-wrap"><article className="promise-sheet"><div className="promise-id">PROMISE / {String(record.promise_id).padStart(3, "0")}</div><blockquote>“{record.promise_text}”</blockquote><div className="party-grid"><div><span>Promisor</span><strong>{short(record.promisor, 10, 8)}</strong></div><div><span>Promisee</span><strong>{short(record.promisee, 10, 8)}</strong></div></div><div className="ledger-metrics"><div><strong>{record.attempt_count}</strong><span>Attempts</span></div><div><strong>{record.accepted_exception_count}</strong><span>Accepted</span></div><div><strong>{record.active_exception_count}</strong><span>Active</span></div><div><strong>{record.swallow_blocks}</strong><span>Blocked</span></div></div></article><div className="attempt-list"><h4>Exception attempts</h4>{attempts.length === 0 ? <p className="muted-copy">No exception has been proposed for this promise.</p> : attempts.map((attempt) => <div className="attempt-row" key={attempt.attempt_id}><span>#{attempt.attempt_id}</span><div><strong>{attempt.verdict.replaceAll("_", " ")}</strong><small>Exception ID {attempt.exception_id}</small></div><Badge variant={attempt.accepted ? "default" : "destructive"}>{attempt.active ? "Active" : attempt.accepted ? "Accepted" : "Blocked"}</Badge></div>)}</div></div>}
          </TabsContent>

          <TabsContent value="proof">
            <section className="panel-intro"><div><p className="step-label">Stage 04 / Reproducibility</p><h3>Deployment proof</h3></div><p>The product name differs from the Intelligent Contract class while the deployed source remains byte-identical.</p></section>
            <div className="proof-grid"><div className="proof-seal"><FileCheck2 /><p>Source parity</p><strong>EXACT</strong><span>20,982 bytes · 634 lines</span></div><dl className="proof-list"><div><dt>Project</dt><dd>PromiseAnchor</dd></div><div><dt>Contract class</dt><dd>{config?.name ?? "ExceptionSwallowGuard"}</dd></div><div><dt>Project filename</dt><dd>PromiseAnchor.py</dd></div><div><dt>Version</dt><dd>{config?.version ?? "1.3"}</dd></div><div><dt>Network</dt><dd>Studionet · 61999</dd></div><div><dt>Contract</dt><dd><code>{CONTRACT_ADDRESS}</code><Button variant="ghost" size="icon-xs" onClick={() => copy(CONTRACT_ADDRESS, "Contract address")}><Clipboard /></Button></dd></div><div><dt>Deploy tx</dt><dd><code>{short(DEPLOY_TX, 18, 14)}</code><Button variant="ghost" size="icon-xs" onClick={() => copy(DEPLOY_TX, "Deploy transaction")}><Clipboard /></Button></dd></div><div><dt>SHA-256</dt><dd><code>{short(SOURCE_SHA, 18, 14)}</code><Button variant="ghost" size="icon-xs" onClick={() => copy(SOURCE_SHA, "Source hash")}><Clipboard /></Button></dd></div></dl></div>
            <div className="proof-actions"><Button asChild><a href={EXPLORER} target="_blank" rel="noreferrer"><ExternalLink />Open contract explorer</a></Button><Button variant="outline" asChild><a href={`${TX_EXPLORER}/${DEPLOY_TX}`} target="_blank" rel="noreferrer"><ExternalLink />View deployment tx</a></Button></div>
          </TabsContent>
        </div>
      </Tabs>
      {lastTx && <aside className="tx-dock"><div><StatusDot connected /><span>Latest submission</span><code>{short(lastTx, 12, 10)}</code></div><a href={`${TX_EXPLORER}/${lastTx}`} target="_blank" rel="noreferrer">Inspect <ArrowUpRight /></a></aside>}
      <footer><div><Anchor />PromiseAnchor</div><p>Human commitments, machine-verifiable boundaries.</p><a href={EXPLORER} target="_blank" rel="noreferrer">Built on GenLayer <ArrowUpRight /></a></footer>
    </main>
  );
}
