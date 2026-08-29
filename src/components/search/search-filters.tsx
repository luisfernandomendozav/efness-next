"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useT } from "@/i18n/use-t";
import type { SearchLookups } from "@/server/search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

export function SearchFilters({
  lookups,
  searchType,
  targetLabel,
}: {
  lookups: SearchLookups;
  searchType: "users" | "products";
  targetLabel: string;
}) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();

  const [type, setType] = useState(searchType);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [company, setCompany] = useState(params.get("company") ?? "");
  const [productType, setProductType] = useState(
    params.get("producttype") ?? "",
  );
  const [brand, setBrand] = useState(params.get("brand") ?? "");
  const [country, setCountry] = useState(params.get("country") ?? "");
  const [state, setState] = useState(params.get("state") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");

  const states = [
    ...new Set(
      lookups.locations
        .filter((l) => l.country === country)
        .map((l) => l.state)
        .filter(Boolean),
    ),
  ] as string[];
  const cities = [
    ...new Set(
      lookups.locations
        .filter((l) => l.country === country && l.state === state)
        .map((l) => l.city)
        .filter(Boolean),
    ),
  ] as string[];

  const apply = () => {
    const q = new URLSearchParams();
    q.set("type", type);
    if (search) q.set("search", search);
    if (country) q.set("country", country);
    if (state) q.set("state", state);
    if (city) q.set("city", city);
    if (company) q.set("company", company);
    if (type === "users" && category) q.set("category", category);
    if (type === "products") {
      if (productType) q.set("producttype", productType);
      if (brand) q.set("brand", brand);
    }
    router.replace(`/advanced-search/users?${q.toString()}`);
  };

  const reset = () => {
    setSearch("");
    setCategory("");
    setCompany("");
    setProductType("");
    setBrand("");
    setCountry("");
    setState("");
    setCity("");
    router.replace(`/advanced-search/users?type=${type}`);
  };

  return (
    <form
      action={apply}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "users" | "products")}
          className={`${selectClass} max-w-40`}
        >
          <option value="users">{targetLabel}</option>
          <option value="products">{t("Products")}</option>
        </select>
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              type === "products"
                ? t("Search products")
                : `${t("Search")} ${targetLabel.toLowerCase()}`
            }
            className="pl-9"
          />
        </div>
        <Button type="submit">{t("Search")}</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {type === "users" ? (
          <div className="space-y-1">
            <Label className="text-xs">{t("Category")}</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClass}
            >
              <option value="">—</option>
              {lookups.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <Label className="text-xs">{t("Product type")}</Label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className={selectClass}
              >
                <option value="">—</option>
                {lookups.productTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {t(pt.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("Brand")}</Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder={t("Brand")}
                className="h-9"
              />
            </div>
          </>
        )}
        <div className="space-y-1">
          <Label className="text-xs">{t("Company")}</Label>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={selectClass}
          >
            <option value="">—</option>
            {lookups.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("Country")}</Label>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setState("");
              setCity("");
            }}
            className={selectClass}
          >
            <option value="">—</option>
            {lookups.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {country && (
          <div className="space-y-1">
            <Label className="text-xs">{t("State")}</Label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setCity("");
              }}
              className={selectClass}
            >
              <option value="">—</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
        {state && (
          <div className="space-y-1">
            <Label className="text-xs">{t("City")}</Label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={selectClass}
            >
              <option value="">—</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={reset}>
          {t("Reset")}
        </Button>
        <Button type="submit" size="sm">
          {t("Apply")}
        </Button>
      </div>
    </form>
  );
}
