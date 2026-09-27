import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The real Server Action can't run in a unit test; the component only needs something to call
vi.mock("@/app/cart/actions", () => ({ addToCartAction: vi.fn(async () => ({ status: "idle" })) }));

const { AddToCart } = await import("./add-to-cart");

describe("AddToCart", () => {
  it("offers quantities up to the stock", () => {
    render(<AddToCart slug="grip-tape" stock={3} />);
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["1", "2", "3"]);
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeEnabled();
  });

  it("caps the quantity list at 10", () => {
    render(<AddToCart slug="glide-skates" stock={200} />);
    expect(screen.getAllByRole("option")).toHaveLength(10);
  });

  it("shows a disabled button when out of stock", () => {
    render(<AddToCart slug="lowsens-air" stock={0} />);
    expect(screen.getByRole("button", { name: "Out of stock" })).toBeDisabled();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
