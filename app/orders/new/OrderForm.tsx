"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeDeposit } from "@/lib/orders";
import type { LineItem, MaterialType } from "@/lib/types";
import { GarmentPreview } from "./GarmentPreview";

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const steps = ["Design", "Material", "Sizes", "Delivery", "Review"];
const fontChoices = [
  "Aptos",
  "Arial",
  "Arial Black",
  "Bahnschrift",
  "Calibri",
  "Cambria",
  "Candara",
  "Consolas",
  "Constantia",
  "Corbel",
  "Franklin Gothic Medium",
  "Georgia",
  "Impact",
  "Segoe UI",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];

type Props = {
  materials: MaterialType[];
};

export function OrderForm({ materials }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [decalUrl, setDecalUrl] = useState("");
  const [customFontUrl, setCustomFontUrl] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    design_service: "from_scratch",
    design_notes: "",
    material_type_id: materials[0]?.id ?? "",
    garment_type: "jersey",
    base_colour: "#18365f",
    custom_text: "10",
    font_family: "Bahnschrift",
    font_size: "150",
    team_name: "",
    delivery_address: "",
    delivery_method: "deliver",
    needed_by: "",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>(
    sizes.map((size) => ({ size, quantity: size === "M" ? 8 : 0, colour: "#18365f", custom_text: "" })),
  );

  const totalQuantity = useMemo(
    () => lineItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [lineItems],
  );
  const deposit = computeDeposit(totalQuantity);

  function update(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateLine(index: number, key: keyof LineItem, value: string | number) {
    setLineItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: key === "quantity" ? Number(value) : value } : item,
      ),
    );
  }

  async function uploadStorageFile(file: File, folder: string) {
    setError("");
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large, max 10MB");
      return "";
    }

    const supabase = createClient();
    const path = `${folder}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("design-files").upload(path, file, {
      upsert: false,
    });

    if (uploadError) {
      setError(uploadError.message);
      return "";
    }

    const { data } = supabase.storage.from("design-files").getPublicUrl(path);
    return data.publicUrl;
  }

  async function uploadFile(file: File) {
    const publicUrl = await uploadStorageFile(file, "orders");
    if (publicUrl) setDecalUrl(publicUrl);
  }

  async function uploadFontFile(file: File) {
    const publicUrl = await uploadStorageFile(file, "fonts");
    if (publicUrl) {
      setCustomFontUrl(publicUrl);
      update("font_family", "Uploaded Jersey Font");
    }
  }

  function validate() {
    if (!form.customer_name || !form.customer_email) return "Customer name and email are required.";
    if (!form.material_type_id) return "Choose a material.";
    if (totalQuantity <= 0) return "Add at least one size quantity.";
    if (!form.needed_by) return "Choose a needed-by date.";
    if (form.delivery_method === "deliver" && !form.delivery_address) return "Delivery address is required.";
    return "";
  }

  async function submit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          design_file_url: decalUrl,
          preview_config: {
            colour: form.base_colour,
            customFontUrl,
            fontFamily: form.font_family,
            fontSize: Number(form.font_size),
            garmentType: form.garment_type,
            text: form.custom_text,
            teamName: form.team_name,
            decalUrl,
          },
          line_items: lineItems.filter((item) => Number(item.quantity) > 0),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Order could not be created.");
      setReference(payload.reference_code);

      const checkout = await fetch("/api/stripe/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: payload.id }),
      });
      const checkoutPayload = await checkout.json();
      if (!checkout.ok) throw new Error(checkoutPayload.error ?? "Deposit checkout could not start.");
      setPaymentUrl(checkoutPayload.url);
      if (checkoutPayload.url) window.location.href = checkoutPayload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (reference) {
    return (
      <div className="card">
        <p className="eyebrow">Order saved</p>
        <h2>{reference}</h2>
        <p className="muted">Your order is in Supabase. Continue to the payment link for the deposit.</p>
        {paymentUrl ? <a className="button" href={paymentUrl}>Open Deposit Checkout</a> : null}
        <a className="ghost-button" href="/">Back to order board</a>
      </div>
    );
  }

  return (
    <div className="split">
      <GarmentPreview
        colour={form.base_colour}
        customFontUrl={customFontUrl}
        decalUrl={decalUrl}
        fontFamily={form.font_family}
        fontSize={Number(form.font_size)}
        garmentType={form.garment_type}
        numberText={form.custom_text}
        teamName={form.team_name}
      />

      <section>
        <div className="stepper">
          {steps.map((label, index) => (
            <button className={`step ${step === index ? "active" : ""}`} key={label} onClick={() => setStep(index)} type="button">
              {index + 1}. {label}
            </button>
          ))}
        </div>

        {error ? <p className="error-state">{error}</p> : null}

        <div className="card">
          {step === 0 ? (
            <div className="form-grid">
              <div className="field"><label>Name</label><input value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} /></div>
              <div className="field"><label>Email</label><input type="email" value={form.customer_email} onChange={(e) => update("customer_email", e.target.value)} /></div>
              <div className="field"><label>Phone</label><input value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} /></div>
              <div className="field"><label>Design Service</label><select value={form.design_service} onChange={(e) => update("design_service", e.target.value)}><option value="use_mine">Use my design</option><option value="redesign_mine">Redesign mine</option><option value="from_scratch">Design from scratch</option><option value="slight_modification">Slight modification</option></select></div>
              <div className="field"><label>Upload Design</label><input accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf" type="file" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} /></div>
              <div className="field"><label>Number / Text</label><input value={form.custom_text} onChange={(e) => update("custom_text", e.target.value)} /></div>
              <div className="field"><label>Team Name (Optional)</label><input value={form.team_name} onChange={(e) => update("team_name", e.target.value)} /></div>
              <div className="field"><label>Font</label><select value={form.font_family} onChange={(e) => update("font_family", e.target.value)}>{fontChoices.map((font) => <option key={font} value={font}>{font}</option>)}{customFontUrl ? <option value="Uploaded Jersey Font">Uploaded Jersey Font</option> : null}</select></div>
              <div className="field"><label>Font Size</label><input max="240" min="64" type="range" value={form.font_size} onChange={(e) => update("font_size", e.target.value)} /><input max="240" min="64" type="number" value={form.font_size} onChange={(e) => update("font_size", e.target.value)} /></div>
              <div className="field"><label>Upload Font</label><input accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" type="file" onChange={(e) => e.target.files?.[0] && uploadFontFile(e.target.files[0])} /></div>
              <div className="field full"><label>Design Notes</label><textarea value={form.design_notes} onChange={(e) => update("design_notes", e.target.value)} /></div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="form-grid">
              <div className="field"><label>Garment</label><select value={form.garment_type} onChange={(e) => update("garment_type", e.target.value)}><option value="jersey">Jersey</option><option value="tshirt">T-shirt</option><option value="polo">Polo</option><option value="hoodie">Hoodie</option></select></div>
              <div className="field"><label>Colour</label><input type="color" value={form.base_colour} onChange={(e) => update("base_colour", e.target.value)} /></div>
              <div className="field full"><label>Material</label><select value={form.material_type_id} onChange={(e) => update("material_type_id", e.target.value)}>{materials.map((material) => <option key={material.id} value={material.id}>{material.name} - {material.description}</option>)}</select></div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <table className="table">
                <thead><tr><th>Size</th><th>Quantity</th><th>Colour</th><th>Text</th></tr></thead>
                <tbody>{lineItems.map((item, index) => <tr key={item.size}><td>{item.size}</td><td><input min="0" type="number" value={item.quantity} onChange={(e) => updateLine(index, "quantity", e.target.value)} /></td><td><input type="color" value={item.colour ?? form.base_colour} onChange={(e) => updateLine(index, "colour", e.target.value)} /></td><td><input value={item.custom_text ?? ""} onChange={(e) => updateLine(index, "custom_text", e.target.value)} /></td></tr>)}</tbody>
              </table>
              <p className="muted">Total quantity: {totalQuantity}</p>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="form-grid">
              <div className="field"><label>Delivery Method</label><select value={form.delivery_method} onChange={(e) => update("delivery_method", e.target.value)}><option value="deliver">Deliver</option><option value="self_collect">Self collect</option></select></div>
              <div className="field"><label>Needed By</label><input type="date" value={form.needed_by} onChange={(e) => update("needed_by", e.target.value)} /></div>
              <div className="field full"><label>Delivery Address</label><textarea value={form.delivery_address} onChange={(e) => update("delivery_address", e.target.value)} /></div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="meta-list">
              <p><span>Customer</span>{form.customer_name} / {form.customer_email}</p>
              <p><span>Material</span>{materials.find((material) => material.id === form.material_type_id)?.name}</p>
              <p><span>Garment</span>{form.garment_type}, {totalQuantity} pieces</p>
              <p><span>Team / Font</span>{form.team_name || "No team name"} / {form.font_family} / {form.font_size}px</p>
              <p><span>Deposit</span>SGD {deposit.toFixed(2)}</p>
              <p><span>Design upload</span>{decalUrl ? "Attached" : "No file attached"}</p>
            </div>
          ) : null}

          <div className="actions">
            <button className="ghost-button" disabled={step === 0 || busy} onClick={() => setStep((value) => Math.max(0, value - 1))} type="button">Back</button>
            {step < steps.length - 1 ? (
              <button className="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} type="button">Next</button>
            ) : (
              <button className="button" disabled={busy} onClick={submit} type="button">{busy ? "Submitting..." : "Submit & Pay Deposit"}</button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
