import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Hero } from "../Hero";

expect.extend(toHaveNoViolations);

// Mock next/image - strip fill/priority to avoid DOM warnings
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
  }) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- mock for tests
      <img
        src={src}
        alt={alt}
        width={width ?? "100%"}
        height={height ?? "100%"}
        className={className}
        data-testid="mock-image"
      />
    );
  },
}));

describe("Hero", () => {
  it("renders heading and CTA", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "The Tripman Experience",
    );
    expect(
      screen.getByRole("button", { name: /become a passenger/i }),
    ).toBeInTheDocument();
  });

  it("has accessible section", () => {
    render(<Hero />);
    const section = screen.getByRole("region", { name: /hero section/i });
    expect(section).toBeInTheDocument();
  });

  it("has no critical accessibility violations", async () => {
    const { container } = render(<Hero />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
