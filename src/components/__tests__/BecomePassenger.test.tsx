import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { BecomePassenger } from "../BecomePassenger";

expect.extend(toHaveNoViolations);

const mockEventTypes = [
  {
    id: "1",
    slug: "tripman-experience",
    name: "The Tripman Experience",
    description: "Journey & party only",
    durationMin: 60,
    priceCents: 7000,
    isActive: true,
  },
  {
    id: "2",
    slug: "tripman-experience-plus",
    name: "The Tripman Experience +",
    description: "Includes videos",
    durationMin: 60,
    priceCents: 27000,
    isActive: true,
  },
];

describe("BecomePassenger", () => {
  const onSelectEvent = jest.fn();

  beforeEach(() => {
    onSelectEvent.mockClear();
  });

  it("renders two package cards with correct pricing", () => {
    render(
      <BecomePassenger
        eventTypes={mockEventTypes}
        onSelectEvent={onSelectEvent}
      />,
    );
    expect(screen.getByText("The Tripman Experience")).toBeInTheDocument();
    expect(screen.getByText("The Tripman Experience +")).toBeInTheDocument();
    expect(screen.getByText(/70 CAD — Journey/)).toBeInTheDocument();
    expect(screen.getByText(/270 CAD — Includes/)).toBeInTheDocument();
  });

  it("has no critical accessibility violations", async () => {
    const { container } = render(
      <BecomePassenger
        eventTypes={mockEventTypes}
        onSelectEvent={onSelectEvent}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
