"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, UserCircle, Home, ShieldCheck, Info, KeyRound, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardNote } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { Input, ReadOnlyField } from "@/components/ui/Input";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import Avatar from "@/components/ui/Avatar";
import { api, fieldErrors } from "@/lib/client/api";
import { formatDate, titleCase } from "@/lib/format";

export default function ProfileClient({ account, flats }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: account?.name ?? "", phone: account?.phone ?? "" });
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set(key) {
    return (e) => {
      setSaved(false);
      setForm({ ...form, [key]: e.target.value });
    };
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      await api.patch("/api/profile", { name: form.name, phone: form.phone || null });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    form.name !== (account?.name ?? "") || form.phone !== (account?.phone ?? "");

  return (
    <div className="stack">
      <PageHeader
        title="My profile"
        description="Keep your contact details current so the society can reach you."
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <ShieldCheck className="size-3.5" />
            {titleCase(account?.role)}
          </span>
        }
      />

      <Card className="flex flex-wrap items-center gap-4 p-5">
        <Avatar name={account?.name ?? "?"} size="xl" tone="brand" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-900">{account?.name}</p>
          <p className="truncate text-sm text-slate-500">{account?.email}</p>
        </div>
        <StatusBadge status={account?.status} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Personal details"
            subtitle="Name and phone are editable. Email and role are managed by your society."
          />
          <form onSubmit={submit} className="flex flex-col gap-4 px-5 py-4">
            <ErrorBanner error={error} />

            <Input
              id="name"
              label="Full name"
              value={form.name}
              onChange={set("name")}
              error={errors.name}
              required
            />
            <Input
              id="phone"
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
              placeholder="9876543210"
              hint="Used for urgent society announcements"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ReadOnlyField label="Email" value={account?.email ?? "—"} />
              <ReadOnlyField label="Role" value={titleCase(account?.role ?? "—")} />
            </div>

            {saved ? <SuccessBanner title="Profile updated" icon={CheckCircle2} /> : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving || !dirty} loading={saving}>
                <Save />
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="My flats"
              subtitle="Set by your society admin"
              icon={Home}
            />
            {flats.length === 0 ? (
              <EmptyState
                icon={Home}
                compact
                title="No flat linked"
                description="Contact your society admin to be added to a flat."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {flats.map((f) => (
                  <li key={f.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {f.block ? `${f.block}-` : ""}
                          {f.flatNumber}
                          {f.isPrimary ? (
                            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-700 uppercase">
                              Primary
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-slate-500">
                          {[f.flatType, f.floor, f.sqFt ? `${f.sqFt} sq.ft` : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {f.residentType ? titleCase(f.residentType) : null}
                          {f.parkingSlot ? ` · Parking ${f.parkingSlot}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={f.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Account" icon={ShieldCheck} />
            <dl className="divide-y divide-slate-100 text-sm">
              <Row label="Account status">
                <StatusBadge status={account?.status} />
              </Row>
              <Row label="Member since">{formatDate(account?.createdAt)}</Row>
              <Row label="Role">
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <ShieldCheck className="size-3.5 text-slate-400" />
                  {titleCase(account?.role)}
                </span>
              </Row>
              <Row label="User ID">
                <span className="font-mono text-xs text-slate-400">{account?.id}</span>
              </Row>
            </dl>
          </Card>
        </div>
      </div>

      <CardNote tone="slate" icon={Info} title="Managed by your society">
        Need your email, role or flat changed? Your society admin handles those so that billing and
        complaint history stay attached to the right person.
      </CardNote>

      <CardNote tone="brand" icon={KeyRound} title="Changing your sign-in method">
        Your password is managed by whichever sign-in provider your society uses. Use the reset link
        on the login screen to set a new one.
      </CardNote>

      <p className="flex items-start gap-2 text-xs text-slate-400">
        <UserCircle className="mt-0.5 size-3.5 shrink-0" />
        Resident account · {account?.email}
      </p>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}