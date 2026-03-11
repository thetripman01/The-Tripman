import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Footer } from "../Footer";

expect.extend(toHaveNoViolations);

describe("Footer", () => {
  it("renders brand and links", () => {
    render(<Footer />);
    expect(screen.getByText("The Tripman")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /privacy policy/i }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: /terms of service/i }),
    ).toHaveAttribute("href", "/terms");
  });

  it("has no Collabstr link", () => {
    render(<Footer />);
    expect(
      screen.queryByRole("link", { name: /collabstr/i }),
    ).not.toBeInTheDocument();
  });

  it("has no critical accessibility violations", async () => {
    const { container } = render(<Footer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
