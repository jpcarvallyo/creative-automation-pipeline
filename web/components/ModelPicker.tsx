"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  filterHeroModels,
  getHeroModel,
  type HeroModelId,
} from "@/lib/models";
import styles from "./ModelPicker.module.css";

type Props = {
  value: HeroModelId;
  onChange: (id: HeroModelId) => void;
  falAvailable: boolean;
  disabled?: boolean;
};

export function ModelPicker({ value, onChange, falAvailable, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = getHeroModel(value);

  const models = useMemo(() => filterHeroModels(query), [query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function select(id: HeroModelId, requiresKey?: boolean) {
    if (requiresKey && !falAvailable) return;
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <p className={styles.triggerDesc}>{selected.description}</p>
        <span className={styles.triggerRow}>
          <span className={styles.triggerLabel}>Model</span>
          <span className={styles.triggerValue}>
            {selected.name}
            <span className={styles.chevron} aria-hidden>
              ›
            </span>
          </span>
        </span>
      </button>

      {open ? (
        <div className={styles.menu} role="listbox" id={listId} aria-label="Hero models">
          <div className={styles.searchWrap}>
            <input
              ref={searchRef}
              className={styles.search}
              type="search"
              placeholder="Search models"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <ul className={styles.list}>
            {models.length === 0 ? (
              <li className={styles.empty}>No models match “{query}”</li>
            ) : (
              models.map((m) => {
                const locked = Boolean(m.requiresKey && !falAvailable);
                const active = m.id === value;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={styles.item}
                      data-active={active ? "true" : "false"}
                      disabled={locked}
                      title={
                        locked
                          ? "Set GENAI_API_KEY on the engine to enable this model"
                          : m.description
                      }
                      onClick={() => select(m.id, m.requiresKey)}
                    >
                      <span className={styles.itemMain}>
                        <span className={styles.itemName}>{m.name}</span>
                        <span className={styles.itemTags}>
                          {m.tags.map((t) => (
                            <span key={t}>{t}</span>
                          ))}
                          {locked ? <span>Needs key</span> : null}
                        </span>
                      </span>
                      {active ? (
                        <span className={styles.check} aria-hidden>
                          ✓
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
