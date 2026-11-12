import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CustomerShell } from "@/components/market/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeviceAvatar } from "@/components/common/device-avatar";
import { useBrand, useT } from "@/components/providers";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { signOut } from "@/lib/auth/client";
import { ensureProfile, requestDeletion, updateProfile } from "@/lib/server/account";
import { useLocationStore, type AddressTag } from "@/lib/stores/location";
import {
  Home,
  Briefcase,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Package,
  CreditCard,
  LifeBuoy,
  Settings,
  Shield,
  FileText,
  Undo2,
  Info,
  LogOut,
  User,
  Edit2,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/")({ component: AccountPage });

function AccountPage() {
  const { t, lang } = useT();
  const { brand } = useBrand();
  const { user, isPending } = useCurrentUserState();
  const [name, setName] = useState(user?.displayName ?? "");
  const [phone, setPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => ensureProfile({ data: { name: user?.displayName ?? undefined, language: lang } }),
    enabled: Boolean(user),
  });

  const [newAddressOpen, setNewAddressOpen] = useState(false);
  const [newAddressTag, setNewAddressTag] = useState<AddressTag>("HOME");
  const [newHouseNo, setNewHouseNo] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newCity, setNewCity] = useState("Kolkata");

  const savedAddresses = useLocationStore((s) => s.savedAddresses);
  const addSavedAddress = useLocationStore((s) => s.addSavedAddress);
  const deleteSavedAddress = useLocationStore((s) => s.deleteSavedAddress);
  const selectSavedAddress = useLocationStore((s) => s.selectSavedAddress);
  const activeLocation = useLocationStore((s) => s.location);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArea.trim()) {
      toast.error("Please enter your area or street");
      return;
    }
    const fullLine = [newHouseNo.trim(), newArea.trim(), newLandmark.trim(), newCity.trim()]
      .filter(Boolean)
      .join(", ");
    const title = newAddressTag === "HOME" ? "Home" : newAddressTag === "WORK" ? "Office" : (newArea.trim() || "Other");
    addSavedAddress({
      tag: newAddressTag,
      title,
      houseNo: newHouseNo.trim(),
      area: newArea.trim(),
      landmark: newLandmark.trim(),
      line1: fullLine,
      cityName: newCity.trim(),
      cityId: newCity.toLowerCase().replace(/\s+/g, "-"),
      zoneName: newArea.trim(),
      zoneId: `zone-${newArea.toLowerCase().replace(/\s+/g, "-")}`,
      lat: 22.55,
      lng: 88.35,
    });
    toast.success(`${title} address saved`);
    setNewAddressOpen(false);
    setNewHouseNo("");
    setNewArea("");
    setNewLandmark("");
  };

  useEffect(() => {
    if (profile.data?.profile?.display_name) setName(profile.data.profile.display_name);
    if (profile.data?.profile?.phone) setPhone(profile.data.profile.phone);
  }, [profile.data]);

  return (
    <CustomerShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 px-4 py-5 pb-28 max-w-2xl mx-auto text-slate-900">
        <header className="pb-4">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Account
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage profile, delivery addresses, and payment settings
          </p>
        </header>

        {isPending ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 bg-slate-200 rounded-2xl" />
            <div className="h-32 bg-slate-200 rounded-2xl" />
          </div>
        ) : !user ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 mb-3">
              <User className="size-6" />
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
              Track orders in real-time, save your delivery addresses, and manage KingPay payments.
            </p>
            <div className="mt-5">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2 rounded-xl text-xs" asChild>
                <Link to="/login">Sign In / Register</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                    <DeviceAvatar userId={user.id} name={user.displayName} imageUrl={user.profileImageUrl} profileImageUrl={user.profileImageUrl} />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-900 truncate">
                      {name || user.displayName || "OrderKing Customer"}
                    </h2>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user.primaryEmail}</p>
                    {phone && <p className="text-xs text-slate-600 font-mono mt-0.5">{phone}</p>}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="rounded-xl text-xs gap-1 h-8"
                >
                  <Edit2 className="size-3" />
                  <span>{isEditing ? "Close" : "Edit Profile"}</span>
                </Button>
              </div>

              {/* Profile Edit Form */}
              {isEditing && (
                <form
                  className="mt-4 pt-4 border-t border-slate-100 space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void updateProfile({ data: { name, phone, language: lang } }).then(() => {
                      toast.success("Profile updated");
                      setIsEditing(false);
                    });
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Name
                      <Input
                        className="mt-1 rounded-xl border-slate-200 text-xs h-9"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-700">
                      Phone Number
                      <Input
                        className="mt-1 rounded-xl border-slate-200 text-xs h-9"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        inputMode="tel"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 rounded-xl"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Link
                to="/orders"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs transition text-center no-underline"
              >
                <Package className="size-5 text-slate-700 mb-1" />
                <span className="text-xs font-bold text-slate-900">My Orders</span>
                <span className="text-[10px] text-slate-500">Live & past</span>
              </Link>

              <Link
                to="/travel"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs transition text-center no-underline"
              >
                <CreditCard className="size-5 text-emerald-600 mb-1" />
                <span className="text-xs font-bold text-slate-900">Travel</span>
                <span className="text-[10px] text-slate-500">Flights and hotels</span>
              </Link>

              <Link
                to="/support"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs transition text-center no-underline"
              >
                <LifeBuoy className="size-5 text-indigo-600 mb-1" />
                <span className="text-xs font-bold text-slate-900">Help & Support</span>
                <span className="text-[10px] text-slate-500">Refunds & disputes</span>
              </Link>

              <Link
                to="/settings"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs transition text-center no-underline"
              >
                <Settings className="size-5 text-slate-700 mb-1" />
                <span className="text-xs font-bold text-slate-900">Settings</span>
                <span className="text-[10px] text-slate-500">Language & theme</span>
              </Link>
            </div>

            {/* Saved Delivery Addresses */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-slate-700" />
                  <h3 className="font-bold text-sm text-slate-900">Saved Addresses</h3>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setNewAddressOpen(!newAddressOpen)}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1 h-8 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Add New</span>
                </Button>
              </div>

              {/* Add New Address Form */}
              {newAddressOpen && (
                <form onSubmit={handleSaveAddress} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Label</label>
                    <div className="flex gap-2">
                      {[
                        { tag: "HOME", label: "Home", icon: Home },
                        { tag: "WORK", label: "Work", icon: Briefcase },
                        { tag: "OTHER", label: "Other", icon: MapPin },
                      ].map(({ tag, label, icon: IconComponent }) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setNewAddressTag(tag as AddressTag)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            newAddressTag === tag
                              ? "border-slate-900 bg-slate-900 text-white shadow-2xs"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <IconComponent className="size-3.5" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">House / Flat / Floor No</label>
                      <Input
                        value={newHouseNo}
                        onChange={(e) => setNewHouseNo(e.target.value)}
                        placeholder="e.g. Flat 3A"
                        className="h-9 text-xs rounded-xl bg-white border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Area / Street *</label>
                      <Input
                        required
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        placeholder="e.g. Station Road"
                        className="h-9 text-xs rounded-xl bg-white border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Landmark (Optional)</label>
                      <Input
                        value={newLandmark}
                        onChange={(e) => setNewLandmark(e.target.value)}
                        placeholder="e.g. Near Main Market"
                        className="h-9 text-xs rounded-xl bg-white border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">City</label>
                      <Input
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder="e.g. Silchar / Guwahati"
                        className="h-9 text-xs rounded-xl bg-white border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewAddressOpen(false)}
                      className="rounded-xl text-xs h-8 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 cursor-pointer"
                    >
                      Save Address
                    </Button>
                  </div>
                </form>
              )}

              {/* List of Saved Addresses */}
              <div className="space-y-2">
                {savedAddresses.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No saved addresses yet. Click &quot;Add New&quot; above.</p>
                ) : (
                  savedAddresses.map((addr) => {
                    const isSelected = activeLocation?.addressId === addr.id || activeLocation?.line1 === addr.line1;
                    const TagIcon = addr.tag === "HOME" ? Home : addr.tag === "WORK" ? Briefcase : MapPin;
                    return (
                      <div
                        key={addr.id}
                        className={`flex items-start justify-between p-3.5 rounded-xl border transition ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/40 shadow-2xs ring-1 ring-emerald-400"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                            <TagIcon className="size-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-slate-900">{addr.title}</h4>
                              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold uppercase text-slate-600">
                                {addr.tag}
                              </span>
                              {isSelected && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                  <CheckCircle2 className="size-2.5" /> Delivering Here
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{addr.line1}</p>
                            {addr.landmark && (
                              <p className="text-[11px] text-slate-400 mt-0.5">Landmark: {addr.landmark}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {!isSelected && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                selectSavedAddress(addr.id);
                                toast.success(`Address set to ${addr.title}`);
                              }}
                              className="h-7 px-2.5 rounded-lg text-[11px] font-bold"
                            >
                              Deliver Here
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              deleteSavedAddress(addr.id);
                              toast.success("Address removed");
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Delete Address"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Legal, Privacy & Policies List */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
              <Link
                to="/legal/privacy"
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 text-xs font-semibold text-slate-800 no-underline transition"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="size-4 text-slate-500" />
                  <span>Privacy Policy (DPDP Act 2023)</span>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>

              <Link
                to="/legal/terms"
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 text-xs font-semibold text-slate-800 no-underline transition"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="size-4 text-slate-500" />
                  <span>Terms of Service</span>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>

              <Link
                to="/legal/refunds"
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 text-xs font-semibold text-slate-800 no-underline transition"
              >
                <div className="flex items-center gap-2.5">
                  <Undo2 className="size-4 text-slate-500" />
                  <span>Cancellation &amp; Refund Policy</span>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>

              <Link
                to="/about"
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 text-xs font-semibold text-slate-800 no-underline transition"
              >
                <div className="flex items-center gap-2.5">
                  <Info className="size-4 text-slate-500" />
                  <span>About {brand.appName}</span>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>
            </div>

            {/* Account Actions & Sign Out */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  void requestDeletion().then(() => toast.success(t("account.deleteDone")))
                }
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Request Data Deletion (DPDP Act)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void signOut("/login")}
                className="text-xs text-slate-700 hover:bg-slate-100 gap-1.5"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
