"use client";

import {
  ASSET_OPTIONS,
  AUDIENCE_OPTIONS,
  COLOR_PRESETS,
  LOGO_OPTIONS,
  REGION_OPTIONS,
  assetPathFromHeroSourceSelect,
  heroSourceSelectValue,
  logoPathFromSelect,
  logoSelectValue,
  type BriefFormState,
  type ProductForm,
} from "@/lib/briefForm";
import styles from "./BriefForm.module.css";

type Props = {
  value: BriefFormState;
  onChange: (next: BriefFormState) => void;
  disabled?: boolean;
};

const CUSTOM = "__custom__";

export function BriefForm({ value, onChange, disabled }: Props) {
  function patch(partial: Partial<BriefFormState>) {
    onChange({ ...value, ...partial });
  }

  function updateProduct(index: number, partial: Partial<ProductForm>) {
    const products = value.products.map((p, i) => (i === index ? { ...p, ...partial } : p));
    patch({ products });
  }

  function addProduct() {
    patch({
      products: [
        ...value.products,
        { id: "", name: "", description: "", assetPath: "" },
      ],
    });
  }

  function removeProduct(index: number) {
    if (value.products.length <= 2) return;
    patch({ products: value.products.filter((_, i) => i !== index) });
  }

  const regionMode = (REGION_OPTIONS as readonly string[]).includes(value.region)
    ? value.region
    : CUSTOM;
  const audienceMode = (AUDIENCE_OPTIONS as readonly string[]).includes(value.audience)
    ? value.audience
    : CUSTOM;
  const logoMode = logoSelectValue(value.logoPath, CUSTOM);
  const colorMode = COLOR_PRESETS.some(
    (o) => o.value.toLowerCase() === value.primaryColor.toLowerCase(),
  )
    ? value.primaryColor
    : CUSTOM;

  return (
    <div className={styles.form} data-disabled={disabled ? "true" : "false"}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Campaign</h3>
        <div className={styles.grid2}>
          <label className={styles.field}>
            <span>Campaign name</span>
            <input
              disabled={disabled}
              value={value.campaignName}
              onChange={(e) => patch({ campaignName: e.target.value })}
            />
          </label>
          <div className={styles.field}>
            <span>Region / market</span>
            <select
              disabled={disabled}
              value={regionMode}
              onChange={(e) => {
                const next = e.target.value;
                patch({ region: next === CUSTOM ? "" : next });
              }}
            >
              {REGION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value={CUSTOM}>Custom…</option>
            </select>
            {regionMode === CUSTOM ? (
              <input
                disabled={disabled}
                className={styles.followUp}
                placeholder="e.g. Nordics"
                value={value.region}
                onChange={(e) => patch({ region: e.target.value })}
              />
            ) : null}
          </div>
        </div>
        <div className={styles.field}>
          <span>Audience</span>
          <select
            disabled={disabled}
            value={audienceMode}
            onChange={(e) => {
              const next = e.target.value;
              patch({ audience: next === CUSTOM ? "" : next });
            }}
          >
            {AUDIENCE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value={CUSTOM}>Custom…</option>
          </select>
          {audienceMode === CUSTOM ? (
            <input
              disabled={disabled}
              className={styles.followUp}
              placeholder="Describe the audience"
              value={value.audience}
              onChange={(e) => patch({ audience: e.target.value })}
            />
          ) : null}
        </div>
        <label className={styles.field}>
          <span>Campaign message</span>
          <textarea
            disabled={disabled}
            rows={2}
            value={value.message}
            onChange={(e) => patch({ message: e.target.value })}
          />
        </label>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Products</h3>
        <p className={styles.hint}>At least two. Choose generate or reuse an asset per product.</p>
        {value.products.map((product, index) => {
          const assetMode = heroSourceSelectValue(product.assetPath, CUSTOM);
          return (
            <div key={index} className={styles.product}>
              <div className={styles.productHead}>
                <strong>Product {index + 1}</strong>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => removeProduct(index)}
                  disabled={disabled || value.products.length <= 2}
                >
                  Remove
                </button>
              </div>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span>ID</span>
                  <input
                    disabled={disabled}
                    value={product.id}
                    placeholder="aqua-spark"
                    onChange={(e) => updateProduct(index, { id: e.target.value })}
                  />
                </label>
                <label className={styles.field}>
                  <span>Name</span>
                  <input
                    disabled={disabled}
                    value={product.name}
                    placeholder="AquaSpark Lemon"
                    onChange={(e) => updateProduct(index, { name: e.target.value })}
                  />
                </label>
              </div>
              <label className={styles.field}>
                <span>Description</span>
                <input
                  disabled={disabled}
                  value={product.description}
                  onChange={(e) => updateProduct(index, { description: e.target.value })}
                />
              </label>
              <div className={styles.field}>
                <span>Hero source</span>
                <select
                  disabled={disabled}
                  value={assetMode}
                  onChange={(e) => {
                    updateProduct(index, {
                      assetPath: assetPathFromHeroSourceSelect(e.target.value, CUSTOM),
                    });
                  }}
                >
                  {ASSET_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value={CUSTOM}>Custom path…</option>
                </select>
                {assetMode === CUSTOM ? (
                  <input
                    disabled={disabled}
                    className={styles.followUp}
                    placeholder="examples/assets/my-hero.png"
                    value={product.assetPath}
                    onChange={(e) => updateProduct(index, { assetPath: e.target.value })}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={addProduct}
          disabled={disabled}
        >
          Add product
        </button>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Brand</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <span>Primary color</span>
            <select
              disabled={disabled}
              value={colorMode === CUSTOM ? CUSTOM : colorMode}
              onChange={(e) => {
                const next = e.target.value;
                patch({
                  primaryColor: next === CUSTOM ? value.primaryColor || "#0B6E4F" : next,
                });
              }}
            >
              {COLOR_PRESETS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </option>
              ))}
              <option value={CUSTOM}>Custom…</option>
            </select>
            <div className={styles.colorRow}>
              <input
                type="color"
                disabled={disabled}
                value={safeColor(value.primaryColor)}
                onChange={(e) => patch({ primaryColor: e.target.value })}
                aria-label="Pick primary color"
              />
              <input
                disabled={disabled}
                value={value.primaryColor}
                onChange={(e) => patch({ primaryColor: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.field}>
            <span>Logo</span>
            <select
              disabled={disabled}
              value={logoMode}
              onChange={(e) => {
                patch({ logoPath: logoPathFromSelect(e.target.value, CUSTOM) });
              }}
            >
              {LOGO_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option value={CUSTOM}>Custom path…</option>
            </select>
            {logoMode === CUSTOM ? (
              <input
                disabled={disabled}
                className={styles.followUp}
                placeholder="examples/assets/logo.png"
                value={value.logoPath}
                onChange={(e) => patch({ logoPath: e.target.value })}
              />
            ) : null}
          </div>
        </div>
        <label className={styles.field}>
          <span>Prohibited words (comma-separated)</span>
          <input
            disabled={disabled}
            value={value.prohibitedWords}
            onChange={(e) => patch({ prohibitedWords: e.target.value })}
          />
        </label>
      </section>
    </div>
  );
}

function safeColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#0B6E4F";
}
