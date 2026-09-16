"use client";

import type { BriefFormState, ProductForm } from "@/lib/briefForm";
import styles from "./BriefForm.module.css";

type Props = {
  value: BriefFormState;
  onChange: (next: BriefFormState) => void;
  disabled?: boolean;
};

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

  return (
    <div className={styles.form}>
      <fieldset className={styles.fieldset} disabled={disabled}>
        <legend>Campaign</legend>
        <div className={styles.grid2}>
          <label>
            <span>Campaign name</span>
            <input
              value={value.campaignName}
              onChange={(e) => patch({ campaignName: e.target.value })}
            />
          </label>
          <label>
            <span>Region / market</span>
            <input value={value.region} onChange={(e) => patch({ region: e.target.value })} />
          </label>
        </div>
        <label>
          <span>Audience</span>
          <input value={value.audience} onChange={(e) => patch({ audience: e.target.value })} />
        </label>
        <label>
          <span>Campaign message (overlaid on creatives)</span>
          <textarea
            rows={2}
            value={value.message}
            onChange={(e) => patch({ message: e.target.value })}
          />
        </label>
      </fieldset>

      <fieldset className={styles.fieldset} disabled={disabled}>
        <legend>Products</legend>
        <p className={styles.hint}>At least two. Optional asset path reuses a local hero instead of generating.</p>
        {value.products.map((product, index) => (
          <div key={index} className={styles.product}>
            <div className={styles.productHead}>
              <strong>Product {index + 1}</strong>
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => removeProduct(index)}
                disabled={value.products.length <= 2}
              >
                Remove
              </button>
            </div>
            <div className={styles.grid2}>
              <label>
                <span>ID</span>
                <input
                  value={product.id}
                  placeholder="aqua-spark"
                  onChange={(e) => updateProduct(index, { id: e.target.value })}
                />
              </label>
              <label>
                <span>Name</span>
                <input
                  value={product.name}
                  placeholder="AquaSpark Lemon"
                  onChange={(e) => updateProduct(index, { name: e.target.value })}
                />
              </label>
            </div>
            <label>
              <span>Description</span>
              <input
                value={product.description}
                onChange={(e) => updateProduct(index, { description: e.target.value })}
              />
            </label>
            <label>
              <span>Existing asset path (optional)</span>
              <input
                value={product.assetPath}
                placeholder="examples/assets/my-hero.png"
                onChange={(e) => updateProduct(index, { assetPath: e.target.value })}
              />
            </label>
          </div>
        ))}
        <button type="button" className={styles.secondaryBtn} onClick={addProduct}>
          Add product
        </button>
      </fieldset>

      <fieldset className={styles.fieldset} disabled={disabled}>
        <legend>Brand</legend>
        <div className={styles.grid2}>
          <label>
            <span>Primary color</span>
            <div className={styles.colorRow}>
              <input
                type="color"
                value={safeColor(value.primaryColor)}
                onChange={(e) => patch({ primaryColor: e.target.value })}
                aria-label="Pick primary color"
              />
              <input
                value={value.primaryColor}
                onChange={(e) => patch({ primaryColor: e.target.value })}
              />
            </div>
          </label>
          <label>
            <span>Logo path</span>
            <input
              value={value.logoPath}
              onChange={(e) => patch({ logoPath: e.target.value })}
            />
          </label>
        </div>
        <label>
          <span>Prohibited words (comma-separated)</span>
          <input
            value={value.prohibitedWords}
            onChange={(e) => patch({ prohibitedWords: e.target.value })}
          />
        </label>
      </fieldset>
    </div>
  );
}

function safeColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#0B6E4F";
}
