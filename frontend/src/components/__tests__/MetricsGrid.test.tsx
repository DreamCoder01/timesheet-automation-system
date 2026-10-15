import { expect, test, describe } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MetricsGrid from '../MetricsGrid';

describe('MetricsGrid Presentation Component Test Suite', () => {
  test('Scenario A: cleanly renders standard numbers and date ranges', () => {
    // 1. Arrange: Define a standard, type-safe dataset structure
    const mockProps = {
      totalEmployees: 8,
      totalShifts: 14,
      totalSkipped: 9,
      weekRange: "Mon 7 Sep - Sun 13 Sep"
    };

    // 2. Act: Render node into our virtual Happy DOM
    render(
      <MetricsGrid 
        totalEmployees={mockProps.totalEmployees}
        totalShifts={mockProps.totalShifts}
        totalSkipped={mockProps.totalSkipped}
        weekRange={mockProps.weekRange}
      />
    );

    // 3. Assert: Verify numbers and text strings render cleanly on screen
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('Mon 7 Sep - Sun 13 Sep')).toBeInTheDocument();
  });

  test('Scenario B: exercises alternative code branches with zero or missing data states', () => {
    // 1. Arrange: Pass zero states to satisfy lines 50-75 fallback boundary logic checks
    const zeroProps = {
      totalEmployees: 0,
      totalShifts: 0,
      totalSkipped: 0,
      weekRange: ""
    };

    // 2. Act
    render(
      <MetricsGrid 
        totalEmployees={zeroProps.totalEmployees}
        totalShifts={zeroProps.totalShifts}
        totalSkipped={zeroProps.totalSkipped}
        weekRange={zeroProps.weekRange}
      />
    );

    // 3. Assert: Verify structural fallback containers adapt error-free
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3);
  });
});
