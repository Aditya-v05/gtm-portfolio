"use client";

import { useState, type ReactNode } from "react";

// Tabs over the niches in a week. Every panel is rendered on the server and
// only its visibility changes here, so each niche is in the page for search
// and still readable with scripts off (all panels show until hydration hides
// the inactive ones).
export default function NicheTabs({
  tabs,
}: {
  tabs: { id: string; name: string; count: number; panel: ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div className="sigtabs">
      <div className="sigtabs__bar" role="tablist" aria-label="Niches">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            className={`sigtabs__tab cursor-target${active === t.id ? " is-on" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.name}
            <span className="sigtabs__count">{t.count}</span>
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <section
          key={t.id}
          role="tabpanel"
          id={`panel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={active !== t.id}
          className="sigtabs__panel"
        >
          {t.panel}
        </section>
      ))}
    </div>
  );
}
