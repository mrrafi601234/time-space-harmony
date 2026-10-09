import { ArrowLeft, ArrowRight, ExternalLink, Globe, GripVertical, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { faviconUrl, reorderLinks, STARTER_LINKS, websiteUrl, type QuickLink } from "@/lib/quick-links";
import { uid } from "@/lib/store";

function LinkIcon({ link }: { link: QuickLink }) {
  const [failed, setFailed] = useState(false);
  const [customFailed, setCustomFailed] = useState(false);
  return failed ? <Globe className="h-7 w-7 text-primary" /> : <img src={link.icon && !customFailed ? link.icon : faviconUrl(link.url)} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 object-contain" referrerPolicy="no-referrer" onError={() => { if (link.icon && !customFailed) setCustomFailed(true); else setFailed(true); }} />;
}

export function QuickLinks() {
  const [links, setLinks] = useLocalStorage<QuickLink[]>("quickLinks", STARTER_LINKS);
  const [draft, setDraft] = useState<QuickLink | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [dragged, setDragged] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const categories = ["All", ...new Set(links.map((link) => link.category).filter(Boolean))];
  const selected = categories.includes(filter) ? filter : "All";
  const edit = (link: QuickLink) => { setDraft({ ...link }); setError(""); setConfirmDelete(false); };
  const move = (id: string, offset: number) => {
    const index = links.findIndex((link) => link.id === id);
    const target = links[index + offset];
    if (target) setLinks((current) => reorderLinks(current, id, target.id));
  };
  const existing = draft && links.some((link) => link.id === draft.id);

  return (
    <section className="quick-hub my-6" aria-labelledby="quick-links-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="quick-links-heading" className="flex items-center gap-2 text-lg font-semibold"><Star className="h-4 w-4 text-primary" />Quick Links<span className="text-xs font-normal text-muted-foreground">{links.length}</span></h2>
        <Button size="sm" variant="outline" onClick={() => edit({ id: uid(), title: "", url: "", icon: "", category: "Study" })}><Plus />Add link</Button>
      </div>
      {links.length > 0 && <div className="mb-3 flex flex-wrap gap-1" aria-label="Link categories">{categories.map((category) => <Button size="sm" variant="ghost" key={category} aria-pressed={selected === category} onClick={() => setFilter(category)} className={selected === category ? "bg-primary/10 text-primary" : "text-muted-foreground"}>{category}</Button>)}</div>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
        {links.filter((link) => selected === "All" || link.category === selected).map((link) => {
          const index = links.findIndex((item) => item.id === link.id);
          return <article key={link.id} className={`quick-tile group ${dragged === link.id ? "opacity-50" : ""}`} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain"); setLinks((current) => reorderLinks(current, id, link.id)); setDragged(null); }}>
            <div className="flex items-center justify-between px-2 pt-1">
              <span draggable aria-label={`Drag ${link.title}`} title={`Drag ${link.title} to reorder`} className="cursor-grab rounded p-1 text-muted-foreground" onDragStart={(event) => { event.dataTransfer.setData("text/plain", link.id); event.dataTransfer.effectAllowed = "move"; setDragged(link.id); }} onDragEnd={() => setDragged(null)}><GripVertical className="h-3.5 w-3.5" /></span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" aria-label={`Edit ${link.title}`} title={`Edit ${link.title}`} onClick={() => edit(link)}><Pencil /></Button>
            </div>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex min-h-28 flex-col items-center gap-2 px-3 pb-3 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="grid h-14 w-14 place-items-center rounded-lg bg-secondary/70"><LinkIcon key={`${link.url}-${link.icon}`} link={link} /></span>
              <span className="flex max-w-full items-center gap-1 text-sm font-semibold"><span className="break-all">{link.title}</span><ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" /></span>
              <span className={`text-[11px] ${link.category === "Coding" ? "text-primary" : link.category === "Social" ? "text-violet" : "text-success"}`}>{link.category}</span>
            </a>
            <div className="flex justify-center gap-1 border-t border-border py-1">
              <Button size="icon" variant="ghost" className="h-6 w-7" disabled={index === 0} aria-label={`Move ${link.title} earlier`} title="Move earlier" onClick={() => move(link.id, -1)}><ArrowLeft /></Button>
              <Button size="icon" variant="ghost" className="h-6 w-7" disabled={index === links.length - 1} aria-label={`Move ${link.title} later`} title="Move later" onClick={() => move(link.id, 1)}><ArrowRight /></Button>
            </div>
          </article>;
        })}
      </div>
      {!links.length && <p className="py-4 text-sm text-muted-foreground">No favorites yet.</p>}
      <Dialog open={draft !== null} onOpenChange={(open) => { if (!open) setDraft(null); }}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg border-primary/25 bg-popover" aria-describedby="link-dialog-description">
          <DialogHeader><DialogTitle>{existing ? "Edit quick link" : "Add quick link"}</DialogTitle><DialogDescription id="link-dialog-description" className="sr-only">Website details</DialogDescription></DialogHeader>
          {draft && <form className="grid gap-4" onSubmit={(event) => {
            event.preventDefault();
            try {
              if (!draft.title.trim()) throw new Error("Enter a title.");
              const saved = { ...draft, title: draft.title.trim(), url: websiteUrl(draft.url), icon: draft.icon.trim() ? websiteUrl(draft.icon) : "", category: draft.category.trim() };
              setLinks((current) => existing ? current.map((link) => link.id === saved.id ? saved : link) : [...current, saved]);
              setDraft(null);
            } catch (cause) { setError(cause instanceof Error ? cause.message : "Check the URL."); }
          }}>
            <label className="grid gap-1.5 text-sm">Title<input autoFocus className="field w-full" value={draft.title} maxLength={80} required onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <label className="grid gap-1.5 text-sm">URL<input className="field w-full" value={draft.url} placeholder="https://example.com" required onChange={(event) => setDraft({ ...draft, url: event.target.value })} /></label>
            <label className="grid gap-1.5 text-sm">Custom icon URL (optional)<input className="field w-full" value={draft.icon} placeholder="https://example.com/icon.png" onChange={(event) => setDraft({ ...draft, icon: event.target.value })} /></label>
            <label className="grid gap-1.5 text-sm">Category<input className="field w-full" value={draft.category} maxLength={30} list="quick-link-categories" onChange={(event) => setDraft({ ...draft, category: event.target.value })} /><datalist id="quick-link-categories">{["Study", "Coding", "Social"].map((category) => <option key={category} value={category} />)}</datalist></label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {confirmDelete ? <div className="flex flex-wrap items-center gap-2"><p className="mr-auto text-sm">Delete this link?</p><Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button type="button" variant="destructive" onClick={() => { setLinks((current) => current.filter((link) => link.id !== draft.id)); setDraft(null); }}>Delete link</Button></div> : <div className="flex flex-wrap items-center gap-2">{existing && <Button type="button" variant="ghost" className="mr-auto text-destructive" onClick={() => setConfirmDelete(true)}><Trash2 />Delete</Button>}<Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit">Save link</Button></div>}
          </form>}
        </DialogContent>
      </Dialog>
    </section>
  );
}