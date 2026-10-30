"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Plus,
  Eye,
  Wrench,
  ShoppingCart,
  Trash2,
  X,
  Upload,
  CheckCircle2,
  SlidersHorizontal,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";
import {
  ProductProfile,
  getAllProducts,
  saveProductProfile,
  deleteProductProfile,
  BASELINE_PRODUCT_PROFILES
} from "@/lib/products";

const CATEGORIES = [
  "All",
  "Pressure",
  "Temperature",
  "Electrical",
  "Flow & Level",
  "Calibration",
  "Lab & Safety"
] as const;

export default function ProductsClient() {
  const [products, setProducts] = useState<ProductProfile[]>(BASELINE_PRODUCT_PROFILES);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [selectedProduct, setSelectedProduct] = useState<ProductProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState("");

  // New product form state
  const [newName, setNewName] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newCat, setNewCat] = useState<ProductProfile["category"]>("Pressure");
  const [newPrice, setNewPrice] = useState("");
  const [newAccuracy, setNewAccuracy] = useState("");
  const [newRange, setNewRange] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSpecs, setNewSpecs] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const loadProducts = () => {
    const list = getAllProducts();
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
    window.addEventListener("nunes:records-synced", loadProducts);
    return () => window.removeEventListener("nunes:records-synced", loadProducts);
  }, []);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setNewImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newModel.trim()) return;

    const id = `prod-${Date.now()}`;
    const priceNum = parseFloat(newPrice) || 0;
    const finalImg = newImageUrl.trim() || "/images/servicing_tools.png";

    const created: ProductProfile = {
      id,
      name: newName.trim(),
      model: newModel.trim(),
      category: newCat,
      price: priceNum,
      imageUrl: finalImg,
      accuracy: newAccuracy.trim() || "±0.1% FS",
      range: newRange.trim() || "Standard Range",
      description: newDesc.trim() || "Industrial instrumentation unit calibrated to ISO standards.",
      specifications: newSpecs.trim() || "SS316 housing, standard industrial connection.",
      calibrationPeriodMonths: 12,
      inStock: true
    };

    saveProductProfile(created);
    setModalOpen(false);
    resetForm();
    setNotification(`✓ Created product profile "${created.name}"`);
    setTimeout(() => setNotification(""), 4000);
  };

  const resetForm = () => {
    setNewName("");
    setNewModel("");
    setNewCat("Pressure");
    setNewPrice("");
    setNewAccuracy("");
    setNewRange("");
    setNewDesc("");
    setNewSpecs("");
    setNewImageUrl("");
    setImagePreview(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete profile for "${name}"?`)) {
      deleteProductProfile(id);
      if (selectedProduct?.id === id) setSelectedProduct(null);
      setNotification(`Deleted profile "${name}"`);
      setTimeout(() => setNotification(""), 3500);
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat = selectedCat === "All" || p.category === selectedCat;
    if (!matchesCat) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.specifications.toLowerCase().includes(q) ||
      p.range.toLowerCase().includes(q)
    );
  });

  const getCatColor = (cat: string) => {
    switch (cat) {
      case "Pressure":
        return { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857" };
      case "Temperature":
        return { bg: "#fffbeb", border: "#fde68a", text: "#b45309" };
      case "Electrical":
        return { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9" };
      case "Flow & Level":
        return { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" };
      case "Calibration":
        return { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" };
      case "Lab & Safety":
        return { bg: "#fff1f2", border: "#fecdd3", text: "#be123c" };
      default:
        return { bg: "#f8fafc", border: "#e2e8f0", text: "#475569" };
    }
  };

  return (
    <main className="page" style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px" }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#0f766e",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            fontWeight: 600,
            fontSize: "14px",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-head" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", width: "100%" }}>
          <div>
            <div className="eyebrow" style={{ color: "#0f766e", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Nunes Instrumentation Catalog
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
              Equipment &amp; Product Profiles
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
              Comprehensive product specifications, calibration intervals, replacement prices, and high-resolution photos for servicing and purchasing.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(15,118,110,0.25)"
              }}
            >
              <Plus size={16} /> Add Product Profile
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "22px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#f0fdfa", color: "#0f766e", display: "grid", placeItems: "center" }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{products.length}</div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Instruments in Catalog</div>
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "grid", placeItems: "center" }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>6 Categories</div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Pressure, Temp, Metrology</div>
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#f5f3ff", color: "#7c3aed", display: "grid", placeItems: "center" }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>ISO 17025</div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Traceable Calibration</div>
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fffbeb", color: "#d97706", display: "grid", placeItems: "center" }}>
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>12 - 24 Mos</div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Recalibration Interval</div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "16px 20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", justifyContent: "space-between" }}>
          {/* Search box */}
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search product name, model (e.g. NPG-500D), range, or specs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 40px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none"
              }}
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {CATEGORIES.map((cat) => {
              const active = selectedCat === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "20px",
                    border: active ? "1.5px solid #0f766e" : "1px solid #e2e8f0",
                    background: active ? "#f0fdfa" : "#ffffff",
                    color: active ? "#0f766e" : "#64748b",
                    fontSize: "12px",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
        {filtered.map((p) => {
          const col = getCatColor(p.category);
          return (
            <article
              key={p.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
            >
              {/* Product Photo Box */}
              <div
                style={{
                  position: "relative",
                  height: "190px",
                  background: "radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f5f9 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px",
                  borderBottom: "1px solid #f1f5f9"
                }}
              >
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  style={{
                    maxWidth: "92%",
                    maxHeight: "165px",
                    objectFit: "contain",
                    filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.08))"
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/servicing_tools.png";
                  }}
                />

                {/* Category Pill */}
                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    background: col.bg,
                    border: `1px solid ${col.border}`,
                    color: col.text,
                    fontSize: "11px",
                    fontWeight: 700
                  }}
                >
                  {p.category}
                </span>

                {/* Price Tag */}
                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.85)",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 800,
                    backdropFilter: "blur(4px)"
                  }}
                >
                  ₹ {p.price.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Product Content Body */}
              <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 750, color: "#0f172a", lineHeight: "1.3" }}>
                    {p.name}
                  </h3>
                </div>
                <div style={{ fontSize: "12px", color: "#0f766e", fontWeight: 700, marginTop: "2px" }}>
                  Model: {p.model}
                </div>

                <p style={{ fontSize: "12px", color: "#64748b", margin: "8px 0 12px", lineHeight: "1.4", flex: 1 }}>
                  {p.description}
                </p>

                {/* Spec Highlights */}
                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "10px 12px", fontSize: "11px", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Range:</span>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{p.range}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Accuracy:</span>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{p.accuracy}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Recalibration:</span>
                    <span style={{ fontWeight: 600, color: "#0f766e" }}>Every {p.calibrationPeriodMonths} Months</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: "#f1f5f9",
                      color: "#334155",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    <Eye size={14} /> Profile
                  </button>
                  <Link
                    href={`/forms/servicing?productName=${encodeURIComponent(p.name)}&model=${encodeURIComponent(p.model)}&price=${p.price}&spec=${encodeURIComponent(p.specifications)}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: "#ecfdf5",
                      color: "#0f766e",
                      border: "1px solid #a7f3d0",
                      fontSize: "12px",
                      fontWeight: 700,
                      textDecoration: "none"
                    }}
                    title="Pre-fill this equipment in a new Servicing Job"
                  >
                    <Wrench size={13} /> Service
                  </Link>
                  <Link
                    href={`/forms/purchasing?itemName=${encodeURIComponent(p.name)}&model=${encodeURIComponent(p.model)}&price=${p.price}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                      fontSize: "12px",
                      fontWeight: 700,
                      textDecoration: "none"
                    }}
                    title="Add this item to a new Purchasing Order"
                  >
                    <ShoppingCart size={13} /> Order
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: "60px 20px", textAlign: "center", background: "#ffffff", borderRadius: "16px", border: "1px dashed #cbd5e1" }}>
          <Package size={40} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>No products matching your search</h3>
          <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
            Try adjusting your search keywords or select "All" categories.
          </p>
        </div>
      )}

      {/* COMPLETE PRODUCT PROFILE MODAL */}
      {selectedProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Head */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "12px",
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    color: "#0f766e",
                    fontSize: "11px",
                    fontWeight: 700
                  }}
                >
                  {selectedProduct.category} Instrumentation
                </span>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                {/* Photo */}
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "14px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #e2e8f0"
                  }}
                >
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
                  />
                </div>

                {/* Primary Attributes */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>MODEL CODE</div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f766e" }}>{selectedProduct.model}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>REPLACEMENT / LIST PRICE</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                      ₹ {selectedProduct.price.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>MEASUREMENT RANGE</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{selectedProduct.range}</div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div style={{ marginBottom: "18px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: 750, color: "#0f172a", marginBottom: "6px" }}>
                  Technical Specifications
                </h4>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px", fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
                  {selectedProduct.specifications}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: "22px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: 750, color: "#0f172a", marginBottom: "6px" }}>
                  Overview &amp; Application
                </h4>
                <p style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                  {selectedProduct.description}
                </p>
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedProduct.id, selectedProduct.name)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  <Trash2 size={14} /> Remove Product
                </button>

                <div style={{ display: "flex", gap: "10px" }}>
                  <Link
                    href={`/forms/servicing?productName=${encodeURIComponent(selectedProduct.name)}&model=${encodeURIComponent(selectedProduct.model)}&price=${selectedProduct.price}&spec=${encodeURIComponent(selectedProduct.specifications)}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 16px",
                      borderRadius: "10px",
                      background: "#0f766e",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      textDecoration: "none"
                    }}
                  >
                    <Wrench size={15} /> Use in Servicing Form
                  </Link>
                  <Link
                    href={`/forms/purchasing?itemName=${encodeURIComponent(selectedProduct.name)}&model=${encodeURIComponent(selectedProduct.model)}&price=${selectedProduct.price}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 16px",
                      borderRadius: "10px",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      textDecoration: "none"
                    }}
                  >
                    <ShoppingCart size={15} /> Use in Purchasing Order
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW PRODUCT MODAL */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  Add New Product Profile
                </h2>
                <p style={{ fontSize: "12px", color: "#64748b" }}>
                  Create an instrument profile with specifications, price, and photo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer"
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Photo Upload Dropzone */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Product Photo / Image:
                </label>
                <div
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: "12px",
                    padding: "16px",
                    textAlign: "center",
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {imagePreview ? (
                    <div style={{ position: "relative" }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ maxHeight: "120px", borderRadius: "8px", objectFit: "contain" }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setNewImageUrl("");
                        }}
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: "-8px",
                          background: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "50%",
                          width: "22px",
                          height: "22px",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center"
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={28} style={{ color: "#94a3b8" }} />
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Click to upload an image from your device (JPG, PNG, WebP)
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        style={{ fontSize: "12px", marginTop: "4px" }}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Name & Model */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Digital Pressure Gauge"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Model Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NPG-500D"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Category & Price */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Category
                  </label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as any)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff" }}
                  >
                    <option value="Pressure">Pressure</option>
                    <option value="Temperature">Temperature</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Flow & Level">Flow &amp; Level</option>
                    <option value="Calibration">Calibration</option>
                    <option value="Lab & Safety">Lab &amp; Safety</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 18500"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Range & Accuracy */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Measurement Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0 to 700 bar"
                    value={newRange}
                    onChange={(e) => setNewRange(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Accuracy Class
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ±0.05% FS"
                    value={newAccuracy}
                    onChange={(e) => setNewAccuracy(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Product Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of product features and laboratory use..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              {/* Specifications */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Technical Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="Connection threads, power supply, wetted parts material, IP rating..."
                  value={newSpecs}
                  onChange={(e) => setNewSpecs(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    color: "#64748b",
                    border: "none",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    background: "#0f766e",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(15,118,110,0.25)"
                  }}
                >
                  Save Product Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
