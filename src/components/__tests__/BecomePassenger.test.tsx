import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { BecomePassenger } from "../BecomePassenger";

expect.extend(toHaveNoViolations);

const mockEventTypes = [
  {
    id: "1",
    slug: "tripman-experience",
    name: "The Tripman Experience",
    description: "Flat rate ride",
    durationMin: 60,
    priceCents: 9900,
    isActive: true,
  },
];

describe("BecomePassenger", () => {
  const onSelectEvent = jest.fn();

  beforeEach(() => {
    onSelectEvent.mockClear();
  });

  it("renders the single package card with $99 CAD pricing", () => {
    render(
      <BecomePassenger
        eventTypes={mockEventTypes}
        onSelectEvent={onSelectEvent}
      />,
    );
    expect(screen.getByText("The Tripman Experience")).toBeInTheDocument();
    // Price block shows "$99 CAD + 13% HST · 1–4 people" plus the
    // explicit total. Both should be visible to the customer.
    expect(screen.getByText(/\$99 CAD \+ 13% HST/)).toBeInTheDocument();
    expect(screen.getByText(/Total \$111\.87 CAD/)).toBeInTheDocument();
    expect(
      screen.getByText(/Video feature not guaranteed/i),
    ).toBeInTheDocument();
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
