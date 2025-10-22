import { render, screen } from '@testing-library/react';
import { TeamLogo } from './TeamLogo';

describe('TeamLogo', () => {
  it('renders the team logo when logoUrl is provided', () => {
    render(<TeamLogo logoUrl="/logo.png" teamName="My Team" />);
    const img = screen.getByAltText('My Team logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/logo.png');
  });

  it('renders the fallback with initials when logoUrl is not provided', () => {
    render(<TeamLogo teamName="My Team" />);
    const fallback = screen.getByText('MT');
    expect(fallback).toBeInTheDocument();
  });
});
