import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MoneyText } from "@/components/money-text";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { can } from "@/lib/rbac";
import { rupeesToPaise } from "@/lib/money";
import {
  duplicateItem,
  getMenu,
  getMenuItemUploadUrl,
  saveAddon,
  saveCategory,
  saveItem,
  setAvailability,
} from "@/lib/server/api-menu";
import { OneTapStockToggle } from "@/components/one-tap-stock-toggle";
import { FssaiExpiryBanner } from "@/components/fssai-expiry-banner";
import { Search, Flame, Sparkles, RotateCcw, Zap, Filter, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/menu")({ component: MenuPage });

function MenuPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const menu = useQuery({
    queryKey: ["menu", vendor.restaurantId],
    queryFn: () => getMenu({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });
  const canEdit = vendor.role ? can(vendor.role, "menu.edit") : false;
  const canAvail = vendor.role ? can(vendor.role, "availability.edit") : false;
  const [catName, setCatName] = useState("");
  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editor, setEditor] = useState<null | {
    id?: string;
    categoryId: string;
    name: string;
    description: string;
    diet: "VEG" | "NONVEG" | "EGG";
    recommended: boolean;
    imageUrl?: string | null;
    addonIds: string[];
    variants: { name: string; price: string }[];
  }>(null);

  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");
  const [searchFilter, setSearchFilter] = useState("");
  const [kitchenRushMode, setKitchenRushMode] = useState(false);

  const allItems = useMemo(() => menu.data?.items ?? [], [menu.data]);
  const inStockCount = useMemo(() => allItems.filter((i) => i.availability === "available").length, [allItems]);
  const outOfStockCount = useMemo(() => allItems.filter((i) => i.availability !== "available").length, [allItems]);

  const grouped = useMemo(() => {
    const cats = menu.data?.categories ?? [];
    const items = menu.data?.items ?? [];
    return cats.map((c) => {
      const catItems = items.filter((i) => {
        if (i.category_id !== c.id) return false;
        if (stockFilter === "IN_STOCK" && i.availability !== "available") return false;
        if (stockFilter === "OUT_OF_STOCK" && i.availability === "available") return false;
        if (searchFilter.trim()) {
          const q = searchFilter.toLowerCase();
          const matchName = i.name.toLowerCase().includes(q);
          const matchDesc = i.description ? i.description.toLowerCase().includes(q) : false;
          return matchName || matchDesc;
        }
        return true;
      });
      return { ...c, items: catItems };
    }).filter((c) => c.items.length > 0 || (!searchFilter.trim() && stockFilter === "ALL"));
  }, [menu.data, stockFilter, searchFilter]);

  async function bulk(status: "sold_out" | "available") {
    if (!selected.length) return;
    await setAvailability({
      data: { restaurantId: vendor.restaurantId, itemIds: selected, status },
    });
    setSelected([]);
    void qc.invalidateQueries({ queryKey: ["menu"] });
  }

  async function restoreAllOutOfStock() {
    const outOfStockIds = allItems.filter((i) => i.availability !== "available").map((i) => i.id);
    if (!outOfStockIds.length) return;
    await setAvailability({
      data: { restaurantId: vendor.restaurantId, itemIds: outOfStockIds, status: "available" },
    });
    void qc.invalidateQueries({ queryKey: ["menu"] });
  }

  return (
    <VendorShell
      title={t("menu.title")}
      dataLabel={menu.data?.dataLabel ?? vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      {/* FSSAI Statutory Food Safety Regulatory Compliance Banner */}
      <FssaiExpiryBanner />

      {/* 1-Tap Quick Stock Action Bar & Real-time Filter HUD */}
      {canAvail && (
        <div className="rounded-xl border border-border bg-surface-1 p-3.5 shadow-sm space-y-3 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Stock Status Count Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Zap className="size-3.5 text-amber-500" />
                1-Tap Stock Desk:
              </span>
              <button
                type="button"
                onClick={() => setStockFilter("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                  stockFilter === "ALL"
                    ? "bg-slate-800 text-white border border-slate-600"
                    : "text-muted hover:text-foreground"
                }`}
              >
                All ({allItems.length})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("IN_STOCK")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                  stockFilter === "IN_STOCK"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                    : "text-leaf hover:bg-leaf/10"
                }`}
              >
                <CheckCircle2 className="size-3" />
                In Stock ({inStockCount})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("OUT_OF_STOCK")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                  stockFilter === "OUT_OF_STOCK"
                    ? "bg-rose-950 text-rose-300 border border-rose-500/50"
                    : outOfStockCount > 0
                    ? "text-rose-400 bg-rose-500/10 border border-rose-500/30"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <XCircle className="size-3" />
                Out of Stock ({outOfStockCount})
              </button>
            </div>

            {/* Right: Quick Restore & Rush Mode */}
            <div className="flex items-center gap-2">
              {outOfStockCount > 0 && (
                <button
                  type="button"
                  onClick={() => void restoreAllOutOfStock()}
                  title="1-Tap restore all sold-out items to in-stock"
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  Restore All ({outOfStockCount})
                </button>
              )}

              <button
                type="button"
                onClick={() => setKitchenRushMode(!kitchenRushMode)}
                title="Toggle large tactile hit-targets for kitchen rush hours"
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                  kitchenRushMode
                    ? "bg-amber-500 text-black border-amber-400 shadow-md font-extrabold"
                    : "border-border bg-surface-2 text-muted hover:text-foreground"
                }`}
              >
                <Flame className="size-3.5" />
                {kitchenRushMode ? "Rush Mode ON" : "Rush Mode"}
              </button>
            </div>
          </div>

          {/* Search bar inside stock desk */}
          <div className="relative">
            <Search className="size-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search dishes to toggle stock (e.g. Butter Naan, Paneer, Biryani)..."
              className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-xs placeholder:text-muted focus:outline-none focus:border-emerald-500 font-sans"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {canEdit ? (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!catName.trim()) return;
            await saveCategory({ data: { restaurantId: vendor.restaurantId, name: catName } });
            setCatName("");
            void qc.invalidateQueries({ queryKey: ["menu"] });
          }}
        >
          <Input
            placeholder={t("menu.addCategory")}
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
          <Button type="submit">{t("menu.addCategory")}</Button>
        </form>
      ) : null}

      {canAvail && selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void bulk("sold_out")}>
            {t("menu.bulkSoldOut")}
          </Button>
          <Button variant="secondary" onClick={() => void bulk("available")}>
            {t("menu.bulkAvailable")}
          </Button>
        </div>
      ) : null}

      {grouped.length === 0 ? (
        <Card className="text-sm text-muted">{t("menu.noItems")}</Card>
      ) : (
        grouped.map((cat) => (
          <section key={cat.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">{cat.name}</h2>
              {canEdit ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    setEditor({
                      categoryId: cat.id,
                      name: "",
                      description: "",
                      diet: "NONVEG",
                      recommended: false,
                      imageUrl: null,
                      addonIds: [],
                      variants: [{ name: "Regular", price: "" }],
                    })
                  }
                >
                  {t("menu.addItem")}
                </Button>
              ) : null}
            </div>
            <div className="grid gap-2">
              {cat.items.map((item) => (
                <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <label className="flex min-h-11 items-start gap-3">
                    {canAvail ? (
                      <input
                        type="checkbox"
                        className="mt-1 size-4"
                        checked={selected.includes(item.id)}
                        onChange={(e) =>
                          setSelected((cur) =>
                            e.target.checked ? [...cur, item.id] : cur.filter((id) => id !== item.id),
                          )
                        }
                      />
                    ) : null}
                    <div>
                      <div className="font-medium">
                        {item.name}{" "}
                        <span className="text-xs uppercase text-muted">{item.diet}</span>
                        {item.recommended ? (
                          <span className="ml-2 text-xs text-chili">{t("menu.recommended")}</span>
                        ) : null}
                      </div>
                      <div className="text-sm text-muted">{item.description}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm">
                        {item.variants.map((v) => (
                          <span key={v.id} className="rounded-full bg-surface-2 px-2 py-0.5">
                            {v.name} <MoneyText paise={v.pricePaise} />
                          </span>
                        ))}
                      </div>
                    </div>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {canAvail ? (
                      <OneTapStockToggle
                        itemId={item.id}
                        itemName={item.name}
                        availability={item.availability as any}
                        nextAvailableAt={item.nextAvailableAt}
                        restaurantId={vendor.restaurantId}
                        size={kitchenRushMode ? "lg" : "md"}
                      />
                    ) : (
                      <span className="text-xs text-muted">
                        {item.availability === "available" ? "In Stock" : t("menu.soldOut")}
                      </span>
                    )}
                    {canEdit ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            void duplicateItem({
                              data: { restaurantId: vendor.restaurantId, itemId: item.id },
                            }).then(() => qc.invalidateQueries({ queryKey: ["menu"] }))
                          }
                        >
                          {t("menu.duplicate")}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setEditor({
                              id: item.id,
                              categoryId: item.category_id,
                              name: item.name,
                              description: item.description,
                              diet: (item.diet as "VEG" | "NONVEG" | "EGG") ?? "NONVEG",
                              recommended: Boolean(item.recommended),
                              imageUrl: item.image_url,
                              addonIds: item.addonIds ?? [],
                              variants: item.variants.map((v) => ({
                                name: v.name,
                                price: String(v.pricePaise / 100),
                              })),
                            })
                          }
                        >
                          {t("menu.edit")}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}

      <Card className="space-y-3">
        <h3 className="font-display text-lg">{t("menu.addons")}</h3>
        <ul className="text-sm">
          {(menu.data?.addons ?? []).map((a) => (
            <li key={a.id} className="flex justify-between border-b border-line py-2">
              <span>{a.name}</span>
              <MoneyText paise={a.pricePaise} />
            </li>
          ))}
        </ul>
        {canEdit ? (
          <form
            className="grid gap-2 md:grid-cols-[1fr_120px_auto]"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!addonName.trim() || !addonPrice) return;
              await saveAddon({
                data: {
                  restaurantId: vendor.restaurantId,
                  name: addonName,
                  pricePaise: rupeesToPaise(Number(addonPrice)),
                },
              });
              setAddonName("");
              setAddonPrice("");
              void qc.invalidateQueries({ queryKey: ["menu"] });
            }}
          >
            <Input placeholder={t("menu.addAddon")} value={addonName} onChange={(e) => setAddonName(e.target.value)} />
            <Input
              inputMode="decimal"
              placeholder={t("menu.price")}
              value={addonPrice}
              onChange={(e) => setAddonPrice(e.target.value)}
            />
            <Button type="submit">{t("menu.addAddon")}</Button>
          </form>
        ) : null}
      </Card>

      {editor ? (
        <Card className="space-y-3">
          <h3 className="font-display text-lg">{editor.id ? t("menu.edit") : t("menu.addItem")}</h3>
          <div>
            <Label>{t("menu.name")}</Label>
            <Input value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} />
          </div>
          <div>
            <Label>Dish Photo</Label>
            {editor.imageUrl ? (
              <div className="relative mb-2 mt-1 h-32 w-48 overflow-hidden rounded-lg border border-border">
                <img
                  src={editor.imageUrl}
                  alt={editor.name || "Dish photo"}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setEditor({ ...editor, imageUrl: null })}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-surface-3"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingImage(true);
                  try {
                    const upload = await getMenuItemUploadUrl({
                      data: {
                        restaurantId: vendor.restaurantId,
                        fileName: file.name,
                        contentType: file.type || "image/jpeg",
                        itemId: editor.id,
                      },
                    });
                    if (upload.uploadUrl) {
                      await fetch(upload.uploadUrl, {
                        method: upload.method as string,
                        headers: upload.headers as Record<string, string>,
                        body: file,
                      });
                    }
                    setEditor((cur) => (cur ? { ...cur, imageUrl: upload.publicUrl } : null));
                  } catch (err) {
                    console.error("Upload error:", err);
                  } finally {
                    setUploadingImage(false);
                  }
                }}
              />
              {uploadingImage ? <span className="text-xs text-muted animate-pulse">Uploading photo...</span> : null}
            </div>
          </div>
          <div>
            <Label>{t("menu.description")}</Label>
            <Textarea
              value={editor.description}
              onChange={(e) => setEditor({ ...editor, description: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("onboarding.vegStatus")}</Label>
            <select
              className="h-11 w-full rounded-[12px] border border-line bg-surface px-3"
              value={editor.diet}
              onChange={(e) => setEditor({ ...editor, diet: e.target.value as typeof editor.diet })}
            >
              <option value="VEG">{t("menu.veg")}</option>
              <option value="NONVEG">{t("menu.nonveg")}</option>
              <option value="EGG">{t("menu.egg")}</option>
            </select>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editor.recommended}
              onChange={(e) => setEditor({ ...editor, recommended: e.target.checked })}
            />
            {t("menu.recommended")}
          </label>
          {editor.variants.map((v, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <Input
                value={v.name}
                onChange={(e) => {
                  const variants = [...editor.variants];
                  variants[i] = { ...v, name: e.target.value };
                  setEditor({ ...editor, variants });
                }}
              />
              <Input
                inputMode="decimal"
                placeholder={t("menu.price")}
                value={v.price}
                onChange={(e) => {
                  const variants = [...editor.variants];
                  variants[i] = { ...v, price: e.target.value };
                  setEditor({ ...editor, variants });
                }}
              />
            </div>
          ))}
          <Button
            variant="secondary"
            type="button"
            onClick={() => setEditor({ ...editor, variants: [...editor.variants, { name: "", price: "" }] })}
          >
            {t("menu.variants")}
          </Button>
          {(menu.data?.addons.length ?? 0) > 0 ? (
            <div className="space-y-1">
              <Label>{t("menu.addons")}</Label>
              {menu.data?.addons.map((a) => (
                <label key={a.id} className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editor.addonIds.includes(a.id)}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        addonIds: e.target.checked
                          ? [...editor.addonIds, a.id]
                          : editor.addonIds.filter((id) => id !== a.id),
                      })
                    }
                  />
                  {a.name} <MoneyText paise={a.pricePaise} />
                </label>
              ))}
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                await saveItem({
                  data: {
                    restaurantId: vendor.restaurantId,
                    id: editor.id,
                    categoryId: editor.categoryId,
                    name: editor.name,
                    description: editor.description,
                    diet: editor.diet,
                    recommended: editor.recommended,
                    imageUrl: editor.imageUrl,
                    addonIds: editor.addonIds,
                    variants: editor.variants
                      .filter((v) => v.name && v.price)
                      .map((v) => ({ name: v.name, pricePaise: rupeesToPaise(Number(v.price)) })),
                  },
                });
                setEditor(null);
                void qc.invalidateQueries({ queryKey: ["menu"] });
              }}
            >
              {t("menu.save")}
            </Button>
            <Button variant="ghost" onClick={() => setEditor(null)}>
              {t("common.cancel")}
            </Button>
          </div>
        </Card>
      ) : null}
    </VendorShell>
  );
}
