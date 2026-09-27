import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductCard } from "./product-card";

const product = {
  id: "1",
  slug: "flick-pro-wireless",
  name: "Flick Pro Wireless",
  tagline: "58 g of pure aim",
  category: "MICE" as const,
  priceCents: 12999,
  stock: 3,
  imageUrl: "/products/flick-pro-wireless.svg",
};

describe("ProductCard", () => {
  it("links to the product page and shows its details", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/flick-pro-wireless");
    expect(screen.getByRole("heading", { name: "Flick Pro Wireless" })).toBeInTheDocument();
    expect(screen.getByText("£129.99")).toBeInTheDocument();
    expect(screen.getByText("Mice")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Flick Pro Wireless" })).toBeInTheDocument();
  });

  it("shows the stock status", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText("Only 3 left")).toBeInTheDocument();
  });

  it("says when a product is sold out", () => {
    render(<ProductCard product={{ ...product, stock: 0 }} />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });
});
