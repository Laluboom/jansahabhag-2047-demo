import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ParliamentPage } from '../src/features/previews/ParliamentPage';
import {
  buildParliamentDelegationIllustration,
  calculateReservedMinimum,
  POLICY_VERSION,
} from '../src/services/reservationAllocationService';

describe('Youth Parliament Preview Reservation Policy & Delegation Allocation Illustration (Package 11)', () => {
  describe('Shared Allocation Service Calculation Invariants', () => {
    it('calculates 3-place delegation formula: ceil(0.33 * 3) = 1 without pooling', () => {
      const min = calculateReservedMinimum(3);
      expect(min).toBe(1);
    });

    it('builds compliant 3-place scenario with 1 eligible and 2 general occupants', () => {
      const result = buildParliamentDelegationIllustration('compliant');
      expect(result.allocation.totalPlaces).toBe(3);
      expect(result.allocation.reservedMinimum).toBe(1);
      expect(result.allocation.ordinaryPlaces).toBe(2);
      expect(result.allocation.reservedOccupiedCount).toBe(1);
      expect(result.allocation.ordinaryOccupiedCount).toBe(2);
      expect(result.allocation.vacanciesCount).toBe(0);
      expect(result.validation.isCompliant).toBe(true);
      expect(result.validation.canFinalize).toBe(true);
      expect(result.validation.errors).toHaveLength(0);

      // Verify explicit candidates without proxy inference
      expect(result.candidates).toHaveLength(3);
      expect(result.candidates[0].id).toBe('user_priya');
      expect(result.candidates[0].seatType).toBe('reserved');
      expect(result.candidates[0].eligibility).toBe('eligible');

      expect(result.candidates[1].id).toBe('user_aarav');
      expect(result.candidates[1].seatType).toBe('ordinary');
      expect(result.candidates[1].eligibility).toBe('ineligible');

      expect(result.candidates[2].id).toBe('user_vikram');
      expect(result.candidates[2].seatType).toBe('ordinary');
      expect(result.candidates[2].eligibility).toBe('ineligible');
    });

    it('builds non-compliant 3-place scenario with reserved vacancy held by default', () => {
      const result = buildParliamentDelegationIllustration('noncompliant');
      expect(result.allocation.totalPlaces).toBe(3);
      expect(result.allocation.reservedMinimum).toBe(1);
      expect(result.allocation.reservedOccupiedCount).toBe(0);
      expect(result.allocation.ordinaryOccupiedCount).toBe(2);
      expect(result.allocation.vacanciesCount).toBe(1);
      expect(result.validation.isCompliant).toBe(false);
      expect(result.validation.canFinalize).toBe(false);
      expect(result.validation.warnings).toHaveLength(1);
      expect(result.validation.warnings[0]).toContain('Unmet reserved minimum');
      expect(result.validation.warnings[0]).toContain('remain held vacant by default');

      // Seat 3 is held vacant under reserved vacancy default
      expect(result.candidates[2].seatType).toBe('vacant');
      expect(result.candidates[2].declaredGenderCategory).toContain('Unfilled Reserved Vacancy');
    });

    it('builds blocked overbooking attempt when 3rd seat is filled by ordinary candidate without owner exception', () => {
      const result = buildParliamentDelegationIllustration('overbooked_ordinary');
      expect(result.allocation.totalPlaces).toBe(3);
      expect(result.allocation.ordinaryOccupiedCount).toBe(3);
      expect(result.validation.isCompliant).toBe(false);
      expect(result.validation.errors).toHaveLength(1);
      expect(result.validation.errors[0]).toContain('Ordinary capacity exceeded (3/2)');
      expect(result.validation.errors[0]).toContain('Reserved places cannot be transferred to ordinary participants without an approved Platform Owner exception');
    });
  });

  describe('ParliamentPage UI Rendering & Reservation Controls', () => {
    const renderParliament = () =>
      render(
        <MemoryRouter initialEntries={['/parliament']}>
          <Routes>
            <Route path="/parliament" element={<ParliamentPage />} />
          </Routes>
        </MemoryRouter>
      );

    it('renders the illustrative notice for 540-member plenary chamber with no false enforcement claim', () => {
      renderParliament();
      const notice = screen.getByTestId('parliament-illustrative-notice');
      expect(notice).toBeInTheDocument();
      expect(notice.textContent).toContain('Notice on 540-Member Plenary Metrics');
      expect(notice.textContent).toContain('540-member plenary chamber, 28-state representation, and national apex metrics displayed above are illustrative prototype figures only');
      expect(notice.textContent).toContain('not been validated or enforced');
      expect(notice.textContent).toContain("under the 33% Women's Reservation Policy");
    });

    it('renders the Point-of-Use Reservation Policy and Rulebook Statement', () => {
      renderParliament();
      const rulebook = screen.getByTestId('parliament-reservation-rulebook');
      expect(rulebook).toBeInTheDocument();
      expect(rulebook.textContent).toContain('Youth Parliament Reservation Policy & Point-of-Use Rulebook (§§1–10)');
      expect(rulebook.textContent).toContain(POLICY_VERSION);
      expect(rulebook.textContent).toContain('Formula: ceil(0.33 × planned places)');
      expect(rulebook.textContent).toContain('ceil(0.33 × 3) = 1');
      expect(rulebook.textContent).toContain('Reserved Vacancy Default');
      expect(rulebook.textContent).toContain('Unfilled reserved places remain held vacant by default');
      expect(rulebook.textContent).toContain('Privacy & Non-Inference');
      expect(rulebook.textContent).toContain('Never infer eligibility from names, portraits, voices, or proxies');
      expect(rulebook.textContent).toContain('Prototype Boundary Notice');
      expect(rulebook.textContent).toContain('exploratory clickable prototype preview');
    });

    it('renders the dynamic Jaipur 3-seat delegation illustration with compliant default', () => {
      renderParliament();
      const illustration = screen.getByTestId('parliament-delegation-illustration');
      expect(illustration).toBeInTheDocument();
      expect(illustration.textContent).toContain('Fictional Jaipur Youth Delegation Allocation (Illustrative 3-Seat Prototype)');

      // Metrics bar
      expect(screen.getByTestId('metric-total-places').textContent).toBe('3');
      expect(screen.getByTestId('metric-formula').textContent).toContain('ceil(0.33 × 3) = 1');
      expect(screen.getByTestId('metric-reserved-filled').textContent).toContain('1 / 1');
      expect(screen.getByTestId('metric-vacancies').textContent).toBe('0');

      // Validation badge derived from shared service
      const badge = screen.getByTestId('validation-status-badge');
      expect(badge.textContent).toBe('VALIDATION OUTCOME: COMPLIANT');

      // Seat Cards
      expect(screen.getByTestId('seat-card-1').textContent).toContain('Priya Sharma');
      expect(screen.getByTestId('seat-card-1').textContent).toContain('Reserved Seat');
      expect(screen.getByTestId('seat-card-2').textContent).toContain('Aarav Sharma');
      expect(screen.getByTestId('seat-card-2').textContent).toContain('General Seat');
      expect(screen.getByTestId('seat-card-3').textContent).toContain('Vikram Malhotra');
      expect(screen.getByTestId('seat-card-3').textContent).toContain('General Seat');
    });

    it('dynamically toggles to Non-Compliant scenario demonstrating reserved vacancy default', async () => {
      renderParliament();
      const nonCompliantBtn = screen.getByTestId('scenario-btn-noncompliant');
      fireEvent.click(nonCompliantBtn);

      await waitFor(() => {
        expect(screen.getByTestId('validation-status-badge').textContent).toContain('UNMET RESERVED MINIMUM (1 VACANCY)');
      });

      expect(screen.getByTestId('metric-reserved-filled').textContent).toContain('0 / 1');
      expect(screen.getByTestId('metric-vacancies').textContent).toBe('1');

      // Check Seat 3 is held vacant
      const seat3 = screen.getByTestId('seat-card-3');
      expect(seat3.textContent).toContain('Held Vacant');
      expect(seat3.textContent).toContain('Unfilled Reserved Vacancy');

      // Check service warning
      const outcomeBox = screen.getByTestId('service-validation-outcome');
      expect(outcomeBox.textContent).toContain('Unmet reserved minimum: 0 of 1 reserved places filled');
      expect(outcomeBox.textContent).toContain('1 place(s) remain held vacant by default');
    });

    it('dynamically toggles to Blocked Ordinary Overbooking scenario', async () => {
      renderParliament();
      const overbookedBtn = screen.getByTestId('scenario-btn-overbooked');
      fireEvent.click(overbookedBtn);

      await waitFor(() => {
        expect(screen.getByTestId('validation-status-badge').textContent).toContain('BLOCKED NON-COMPLIANT');
      });

      const outcomeBox = screen.getByTestId('service-validation-outcome');
      expect(outcomeBox.textContent).toContain('Ordinary capacity exceeded (3/2)');
      expect(outcomeBox.textContent).toContain('Reserved places cannot be transferred to ordinary participants without an approved Platform Owner exception');

      const seat3 = screen.getByTestId('seat-card-3');
      expect(seat3.textContent).toContain('Rohan Mehta');
      expect(seat3.textContent).toContain('Blocked without Platform Owner Exception');
    });

    it('retains Tabled Motions and motion detail modal functionality', async () => {
      renderParliament();
      expect(screen.getByText('Tabled Motions on the Order Paper')).toBeInTheDocument();
      expect(screen.getByText('MOT-RAJ-07 • Rajasthan')).toBeInTheDocument();

      const inspectBtn = screen.getByText('Inspect Rajasthan Motion #07');
      fireEvent.click(inspectBtn);

      await waitFor(() => {
        expect(screen.getByText('Safe School Perimeter Zone Standards (2026)')).toBeInTheDocument();
        expect(screen.getByText('Statutory Tabling Summary')).toBeInTheDocument();
      });

      const closeBtn = screen.getByText('Close Motion Brief');
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByText('Safe School Perimeter Zone Standards (2026)')).not.toBeInTheDocument();
      });
    });
  });
});
