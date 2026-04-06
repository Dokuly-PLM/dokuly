import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { searchPartsGlobal } from "../funcitons/queries";
import { getUser } from "../../layout/queries";
import DokulyImage from "../dokulyImage";
import { formatCloudImageUri } from "../../pcbas/functions/productionHelpers";
import "./commandPalette.css";

const MODULES = [
  { label: "Home", route: "/", icon: "home.svg", filterClass: "dokuly-filter-primary" },
  { label: "Administration", route: "/adminPage/general", icon: "database.svg", filterClass: "dokuly-filter-primary", requiresAdmin: true },
  { label: "Timesheet", route: "/timesheet", icon: "clock.svg", filterClass: "dokuly-filter-secondary", app: "timesheet", orgFlag: "time_tracking_is_enabled" },
  { label: "Customers", route: "/customers", icon: "friends.svg", filterClass: "dokuly-filter-primary", app: "customers", orgFlag: "customer_is_enabled", orgDefault: true },
  { label: "Projects", route: "/projects", icon: "briefcase.svg", filterClass: "dokuly-filter-primary", app: "projects" },
  { label: "Requirements", route: "/requirements", icon: "clipboard-check.svg", filterClass: "dokuly-filter-primary", app: "requirements", orgFlag: "requirement_is_enabled" },
  { label: "ECO", route: "/eco", icon: "clipboard-list.svg", filterClass: "dokuly-filter-primary", app: "eco", orgFlag: "eco_is_enabled" },
  { label: "Documents", route: "/documents", icon: "file.svg", filterClass: "dokuly-filter-info", app: "documents", orgFlag: "document_is_enabled" },
  { label: "Parts", route: "/parts", icon: "puzzle.svg", filterClass: "dokuly-filter-info", app: "parts" },
  { label: "Assemblies", route: "/assemblies", icon: "assembly.svg", filterClass: "dokuly-filter-info", app: "assemblies", orgFlag: "assembly_is_enabled" },
  { label: "PCBAs", route: "/pcbas", icon: "pcb.svg", filterClass: "dokuly-filter-info", app: "pcbas", orgFlag: "pcba_is_enabled" },
  { label: "Suppliers", route: "/suppliers", icon: "factory.svg", filterClass: "dokuly-filter-secondary", app: "procurement", orgFlag: "supplier_is_enabled", orgDefault: true },
  { label: "Procurement", route: "/procurement", icon: "shopping-cart.svg", filterClass: "dokuly-filter-secondary", app: "procurement", orgFlag: "procurement_is_enabled" },
  { label: "Production", route: "/production", icon: "box.svg", filterClass: "dokuly-filter-secondary", app: "production", orgFlag: "production_is_enabled" },
];

const ITEM_TYPE_ROUTES = {
  Part: "/parts",
  Assembly: "/assemblies",
  PCBA: "/pcbas",
  Document: "/documents",
};

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [allowedApps, setAllowedApps] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [organization, setOrganization] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Load user permissions and organization on mount
  useEffect(() => {
    getUser().then((res) => {
      if (res?.data) {
        setAllowedApps(res.data.allowed_apps || []);
        const role = res.data.role;
        setIsAdmin(
          (role === "Admin" || role === "Super Admin" || role === "Owner") &&
            res.data.is_active === true
        );
      }
    });

    const storedOrg = localStorage.getItem("organization");
    if (storedOrg) {
      try {
        setOrganization(JSON.parse(storedOrg));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Filter modules based on org settings and user permissions
  const availableModules = useMemo(() => {
    return MODULES.filter((m) => {
      if (m.requiresAdmin && !isAdmin) return false;
      if (m.app && !allowedApps.includes(m.app)) return false;
      if (m.orgFlag && organization) {
        const flagValue = organization[m.orgFlag];
        // Some flags default to true (enabled unless explicitly disabled)
        if (m.orgDefault) {
          if (flagValue === false) return false;
        } else {
          if (flagValue !== true) return false;
        }
      }
      return true;
    });
  }, [allowedApps, isAdmin, organization]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Focus input when opened, reset state when closed
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await searchPartsGlobal(
          query,
          ["parts", "pcbas", "assemblies", "documents"],
          true
        );
        if (response.status === 200) {
          setResults(response.data || []);
        }
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Reset active index when items change
  useEffect(() => {
    setActiveIndex(0);
  }, [results, query]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  // Build the visible items list
  const filteredModules = query.trim()
    ? availableModules.filter((m) =>
        m.label.toLowerCase().includes(query.toLowerCase())
      )
    : availableModules;

  const allItems = [];

  if (filteredModules.length > 0) {
    filteredModules.forEach((m) => {
      allItems.push({ type: "module", ...m });
    });
  }

  if (results.length > 0) {
    results.forEach((r) => {
      allItems.push({ type: "result", ...r });
    });
  }

  const handleSelect = useCallback(
    (item) => {
      close();
      if (item.type === "module") {
        navigate(item.route);
      } else {
        const base = ITEM_TYPE_ROUTES[item.item_type];
        if (base) {
          navigate(`${base}/${item.id}`);
        }
      }
    },
    [close, navigate]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allItems[activeIndex]) {
        handleSelect(allItems[activeIndex]);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[activeIndex];
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  if (!open) return null;

  const highlightMatch = (text) => {
    if (!text || !query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <strong key={i}>{part}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  let itemIndex = 0;

  return (
    <div className="command-palette-backdrop" onMouseDown={close}>
      <div
        className="command-palette"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="command-palette-input-wrapper">
          <img
            src="../../static/icons/search.svg"
            alt=""
            className="icon-dark"
          />
          <input
            ref={inputRef}
            className="command-palette-input"
            type="text"
            placeholder="Search or jump to..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <ul className="command-palette-list" ref={listRef}>
          {filteredModules.length > 0 && (
            <>
              {!query.trim() && (
                <li className="command-palette-section-label">Modules</li>
              )}
              {filteredModules.map((m) => {
                const idx = itemIndex++;
                return (
                  <li
                    key={`module-${m.route}`}
                    className={`command-palette-item ${idx === activeIndex ? "active" : ""}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={() => handleSelect({ type: "module", ...m })}
                  >
                    <span className="command-palette-item-icon">
                      <img
                        src={`../../static/icons/${m.icon}`}
                        alt=""
                        className={m.filterClass}
                      />
                    </span>
                    <span className="command-palette-item-text">
                      {highlightMatch(m.label)}
                    </span>
                  </li>
                );
              })}
            </>
          )}

          {searching && results.length === 0 && (
            <li className="command-palette-empty">Searching...</li>
          )}

          {results.length > 0 && (
            <>
              <li className="command-palette-section-label">Results</li>
              {results.map((r) => {
                const idx = itemIndex++;
                const label =
                  r.display_name || r.title || r.full_part_number || "";
                const partNum = r.full_part_number || r.full_doc_number || "";
                const displayText = partNum
                  ? `${partNum} — ${label}`
                  : label;

                return (
                  <li
                    key={`result-${r.item_type}-${r.id}`}
                    className={`command-palette-item ${idx === activeIndex ? "active" : ""}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={() =>
                      handleSelect({ type: "result", ...r })
                    }
                  >
                    <span className="command-palette-item-thumb">
                      {r.thumbnail ? (
                        <DokulyImage
                          src={formatCloudImageUri(r.thumbnail)}
                          alt=""
                          style={{
                            maxWidth: "32px",
                            maxHeight: "32px",
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <img
                          src={`../../static/icons/${r.item_type === "Document" ? "file.svg" : "puzzle.svg"}`}
                          alt=""
                          className="icon-dark"
                          style={{ width: 18, height: 18, opacity: 0.3 }}
                        />
                      )}
                    </span>
                    <span className="command-palette-item-text">
                      {highlightMatch(displayText)}
                    </span>
                    <span className="command-palette-item-type">
                      {r.item_type}
                    </span>
                  </li>
                );
              })}
            </>
          )}

          {query.trim() &&
            !searching &&
            filteredModules.length === 0 &&
            results.length === 0 && (
              <li className="command-palette-empty">
                No results found
              </li>
            )}
        </ul>

        <div className="command-palette-hint">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
