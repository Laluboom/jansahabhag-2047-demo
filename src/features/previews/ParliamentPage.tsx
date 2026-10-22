import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import {
  Landmark,
  Users,
  Vote,
  Sparkles,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Scale,
  ShieldAlert,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import {
  POLICY_VERSION,
  buildParliamentDelegationIllustration,
} from '../../services/reservationAllocationService';
import { SessionSeating, SeatModel, SeatingQuotaSummary, SessionTextTurn } from '../../components/session';

export const ParliamentPage: React.FC = () => {
  const [selectedMotionModal, setSelectedMotionModal] = useState<boolean>(false);
  const [delegationScenario, setDelegationScenario] = useState<'compliant' | 'noncompliant' | 'overbooked_ordinary'>('compliant');

  const illustration = buildParliamentDelegationIllustration(delegationScenario);
  const { allocation, validation, seats, summaryNote } = illustration;

  // Typed Seating View Models for SessionSeating (Parliament Horseshoe Layout)
  const parliamentSeats: SeatModel[] = React.useMemo(() => {
    const isNonCompliant = delegationScenario === 'noncompliant';
    const isOverbooked = delegationScenario === 'overbooked_ordinary';

    return [
      // 1. Presiding Speaker
      {
        id: 'seat_parl_speaker',
        name: 'Youth Advisory Panel',
        role: 'Presiding Speaker of Plenary',
        sideOrBench: 'Speaker',
        status: 'active',
        institution: 'Apex Parliamentary Secretariat, New Delhi',
        currentActivity:
          'Presiding over Winter Plenary Session 2026 on Child & Pedestrian Urban Transit Protection',
      },
      // 2. Government & Sponsoring Benches
      {
        id: 'seat_parl_priya',
        userId: 'user_priya',
        name: 'Priya Sharma',
        role: 'Lead Motion Sponsor (Jaipur Delegation)',
        sideOrBench: 'Government',
        status: 'speaking',
        isSpeaking: true,
        isReserved: true,
        institution: 'Navchetna Public School, Jaipur (Rajasthan)',
        currentActivity:
          'Tabled Rajasthan Motion #07: Mandatory 25 km/h Safe School Perimeter Zones & Raised Crosswalk Standards',
      },
      {
        id: 'seat_parl_rahul',
        userId: 'user_rahul',
        name: 'Rahul Deshmukh',
        role: 'Co-Sponsor (Pune Delegation)',
        sideOrBench: 'Government',
        status: 'active',
        institution: 'Pune Youth Civic Council (Maharashtra)',
        currentActivity:
          'Co-Sponsoring Motion #12: Urban School Bus Staggering & Non-Motorised Freight Windows',
      },
      {
        id: 'seat_parl_aarav',
        userId: 'user_aarav',
        name: 'Aarav Sharma',
        role: 'Jaipur Youth Delegate',
        sideOrBench: 'Government',
        status: 'active',
        institution: 'Navchetna Public School, Jaipur',
        currentActivity:
          'Presenting grassroots observational traffic counts and speed logs from Mansarovar',
      },
      // 3. Opposition & Scrutiny Benches
      {
        id: 'seat_parl_ananya',
        name: 'Ananya Sen',
        role: 'Civic Scrutiny Spokesperson',
        sideOrBench: 'Opposition',
        status: 'waiting',
        institution: 'Kolkata Deliberative Circle (West Bengal)',
        currentActivity:
          'Chamber Inquiry: Municipal budget allocations under AMRUT 2.0 vs local road engineering capacity',
      },
      {
        id: 'seat_parl_dev',
        name: 'Dev Patel',
        role: 'Shadow Committee Member',
        sideOrBench: 'Opposition',
        status: 'active',
        institution: 'Ahmedabad Civic Youth Guild (Gujarat)',
        currentActivity:
          'Scrutinizing freight diversion time windows and roadside vendor displacement risks',
      },
      // 4. Cross-benches & State Delegations
      {
        id: 'seat_parl_vikram',
        userId: 'user_vikram',
        name: isNonCompliant ? 'Unfilled Reserved Seat' : 'Vikram Rathore',
        role: isNonCompliant ? 'Held Vacant (33% Quota)' : 'Jaipur Youth Delegate',
        sideOrBench: 'Cross-bench',
        status: isNonCompliant ? 'vacant' : 'active',
        isReserved: isNonCompliant,
        institution: isNonCompliant
          ? 'Jaipur Delegation Allocation'
          : 'Jaipur Youth Deliberative Assembly',
        currentActivity: isNonCompliant
          ? 'Unmet reserved place remains held vacant by default per 33% Reservation Policy (OD.17).'
          : isOverbooked
          ? 'Ordinary overbooking attempt blocked by validation without approved Platform Owner exception.'
          : 'Advocating 1:15 approach ramps and cross-drainage pipe installation beneath tabletop crossings.',
      },
      {
        id: 'seat_parl_tara',
        name: 'Tara Verma',
        role: 'Northern Zone Delegate',
        sideOrBench: 'Cross-bench',
        status: 'active',
        institution: 'Shimla Youth Environment Circle (Himachal Pradesh)',
        currentActivity:
          'Reviewing gradient standards for hill-station pedestrian crossings',
      },
      {
        id: 'seat_parl_arjun',
        name: 'Arjun Rao',
        role: 'Southern Zone Representative',
        sideOrBench: 'Cross-bench',
        status: 'active',
        institution: 'Bengaluru Active Mobility Youth Network (Karnataka)',
        currentActivity:
          'Presenting data on smart solar warning beacons at 50m approaches',
      },
    ];
  }, [delegationScenario]);

  const parliamentQuotaSummary: SeatingQuotaSummary = React.useMemo(() => {
    return {
      totalCapacity: allocation.totalPlaces,
      filledCount:
        (allocation.reservedOccupiedCount ?? 0) + (allocation.ordinaryOccupiedCount ?? 0),
      reservedMinimum: allocation.reservedMinimum,
      reservedFilledCount: allocation.reservedOccupiedCount ?? 0,
      vacanciesCount: allocation.vacanciesCount ?? 0,
      isIllustrative: true,
      illustrativeNotice:
        'Illustrative apex plenary prototype: 3-seat Jaipur delegation calculation via shared reservationAllocationService. No live member appointment or statutory quota enforcement is claimed for national parliament.',
    };
  }, [allocation]);

  const motions = [
    {
      id: 'MOT-RAJ-07',
      state: 'Rajasthan',
      title: 'Mandatory 25 km/h Safe School Perimeter Zones & Raised Crosswalk Standards',
      sponsor: 'Priya Sharma (Youth Delegate, Jaipur)',
      status: 'Tabled in Apex Chamber',
      support: '89% State Deliberation Consensus',
      synopsis:
        'Statutory mandate requiring urban local bodies to install physical speed tables and continuous 1.8m footpaths outside high-density educational corridors.',
    },
    {
      id: 'MOT-MAH-12',
      state: 'Maharashtra',
      title: 'Urban School Bus Staggering & Non-Motorised Freight Windows',
      sponsor: 'Rahul Deshmukh (Youth Delegate, Pune)',
      status: 'Under Committee Review',
      support: '78% State Deliberation Consensus',
      synopsis:
        'Designation of zero-emission student walking zones during 07:30-08:30 and 14:00-15:00 peak hours.',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DemoPreviewBadge
        size="banner"
        label="National Youth Parliament Preview"
        description="National apex deliberative chamber aggregating verified state assembly propositions into unified parliamentary submissions."
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-civic-saffron-600" />
            <span>National Youth Parliament 2047</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Apex youth assembly tabling grassroots civic propositions from 28 State Deliberation Grids.
          </p>
        </div>

        <Button
          size="sm"
          variant="saffron"
          onClick={() => setSelectedMotionModal(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          <span>Inspect Rajasthan Motion #07</span>
        </Button>
      </div>

      {/* Chamber Header Card */}
      <Card className="p-8 border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-civic-saffron-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WINTER SESSION 2026 IN PLENARY</span>
          </div>
          <DemoPreviewBadge size="sm" label="Simulated Apex Chamber" />
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
            Special Plenary: Child & Pedestrian Urban Transit Protection
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Presiding Speaker: Youth Advisory Panel &bull; 540 Youth Parliamentarians representing all States & UTs.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Motions Tabled</span>
            <span className="text-lg font-bold text-white font-heading mt-0.5 block">24</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Verified Audits</span>
            <span className="text-lg font-bold text-civic-saffron-400 font-heading mt-0.5 block">42,100</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Apex Consensus</span>
            <span className="text-lg font-bold text-emerald-400 font-heading mt-0.5 block">84.2%</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Target Ministry</span>
            <span className="text-xs font-semibold text-slate-200 font-heading mt-1 block">MoHUA & MoRTH</span>
          </div>
        </div>
      </Card>

      {/* Point-of-Use Explicit Notice on Illustrative 540-Member Plenary Metrics */}
      <div
        className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1.5 shadow-sm"
        data-testid="parliament-illustrative-notice"
      >
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Illustrative Chamber Notice (PRD Competition-Demo Prototype Allowance)</span>
        </div>
        <p className="leading-relaxed text-amber-900/90">
          <strong>Notice on 540-Member Plenary Metrics:</strong> The 540-member plenary chamber, 28-state representation,
          and national apex metrics displayed above are illustrative prototype figures only. They have <strong>not been validated
          or enforced</strong> under the 33% Women&apos;s Reservation Policy. Real-data collection, national delegate selection,
          and production parliamentary enforcement workflows remain unbuilt.
        </p>
      </div>

      {/* Point-of-Use Reservation Policy & Rulebook Statement */}
      <Card className="p-6 border-slate-200 bg-white space-y-4" data-testid="parliament-reservation-rulebook">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-civic-saffron-600" />
            <CardTitle className="text-base font-bold text-slate-900">
              Youth Parliament Reservation Policy & Point-of-Use Rulebook (§§1–10)
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-semibold text-civic-indigo-700 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100">
              Policy {POLICY_VERSION}
            </span>
            <Link
              to="/help"
              className="inline-flex items-center gap-1 text-xs font-semibold text-civic-indigo-700 hover:text-civic-indigo-900 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 rounded py-0.5 px-1.5"
              data-testid="parliament-full-rulebook-link"
            >
              <span>Full Rulebook</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Scale className="w-4 h-4 text-civic-saffron-600" />
              <span>Formula: ceil(0.33 &times; planned places)</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              Approved per-allocation formula calculated separately without cross-chamber or cross-cohort pooling.
              For a 3-member delegation, the mandatory minimum is <code className="font-mono font-bold text-slate-900">ceil(0.33 &times; 3) = 1</code> reserved place.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Reserved Vacancy Default</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              Unfilled reserved places remain held vacant by default. General/ordinary candidates cannot claim reserved vacancies
              without an explicit, simulated Platform Owner audited exception.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <EyeOff className="w-4 h-4 text-civic-teal-600" />
              <span>Privacy & Non-Inference</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              Eligibility is based strictly on explicit fictional declarations (<code className="font-mono">eligible</code>, <code className="font-mono">ineligible</code>, <code className="font-mono">undeclared</code>).
              Never infer eligibility from names, portraits, voices, or proxies. In small cohorts (1–3 places), individual declarations are protected from deductive inference.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Prototype Boundary Notice</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              This Youth Parliament page is an exploratory clickable prototype preview. The delegation allocation below is an illustrative calculation
              and does <strong>not</strong> appoint real members or enforce a live parliamentary selection system.
            </p>
          </div>
        </div>
      </Card>

      {/* Reusable Accessible SessionSeating Component (Parliament Horseshoe Layout) */}
      <SessionSeating
        layout="parliament"
        currentRoute="parliament"
        sessionId="parliament_plenary_2026"
        seats={parliamentSeats}
        quotaSummary={parliamentQuotaSummary}
        activeSpeakerId="seat_parl_priya"
        sampleTurns={[
          {
            id: 'turn_parl_1',
            authorName: 'Priya Sharma',
            authorRole: 'Lead Motion Sponsor',
            timestamp: '11:00 AM',
            text: 'Tabled National Motion #07: Mandatory 25 km/h school perimeter zones and safe pedestrian corridors across Tier-2 municipal corporations.',
          },
          {
            id: 'turn_parl_2',
            authorName: 'Ananya Sen',
            authorRole: 'Civic Scrutiny Spokesperson',
            timestamp: '11:08 AM',
            text: 'Chamber Inquiry: Clarification requested on AMRUT 2.0 capital allocation guarantees vs municipal engineering capacity in Rajasthan.',
          },
          {
            id: 'turn_parl_3',
            authorName: 'Youth Advisory Panel',
            authorRole: 'Presiding Speaker',
            timestamp: '11:15 AM',
            text: 'Chamber recognized Government sponsor for two-minute clarification on statutory guidelines.',
          },
        ]}
        isIllustrative={true}
        title="National Youth Parliament Plenary Chamber"
        subtitle="Apex horseshoe layout with Presiding Speaker, Government, Opposition & Cross-benches"
      />

      {/* Fictional Jaipur Youth Delegation Allocation Illustration */}
      <Card className="p-6 border-slate-200 bg-white space-y-5" data-testid="parliament-delegation-illustration">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <DemoPreviewBadge size="sm" label="Fictional Demo Allocation" />
              <span className="text-[11px] font-mono font-semibold text-slate-500">
                Shared Engine: reservationAllocationService.ts
              </span>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 mt-1">
              Fictional Jaipur Youth Delegation Allocation (Illustrative 3-Seat Prototype)
            </CardTitle>
            <p className="text-xs text-slate-500">
              Simulated 3-place seat allocation to the apex chamber, demonstrating how the shared reservation allocation service calculates quotas and validates compliance without hard-coded claims.
            </p>
          </div>
        </div>

        {/* Scenario Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 mr-1">Select Fictional Scenario:</span>
          <Button
            size="sm"
            variant={delegationScenario === 'compliant' ? 'primary' : 'outline'}
            onClick={() => setDelegationScenario('compliant')}
            data-testid="scenario-btn-compliant"
            className="text-xs"
          >
            Scenario A: Compliant (1 Reserved + 2 General)
          </Button>
          <Button
            size="sm"
            variant={delegationScenario === 'noncompliant' ? 'primary' : 'outline'}
            onClick={() => setDelegationScenario('noncompliant')}
            data-testid="scenario-btn-noncompliant"
            className="text-xs"
          >
            Scenario B: Non-Compliant (Reserved Vacancy Default)
          </Button>
          <Button
            size="sm"
            variant={delegationScenario === 'overbooked_ordinary' ? 'primary' : 'outline'}
            onClick={() => setDelegationScenario('overbooked_ordinary')}
            data-testid="scenario-btn-overbooked"
            className="text-xs"
          >
            Scenario C: Blocked Ordinary Overbooking Attempt
          </Button>
        </div>

        {/* Dynamic Calculation Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Planned Places</span>
            <span className="text-lg font-bold text-slate-900 font-heading block mt-0.5" data-testid="metric-total-places">
              {allocation.totalPlaces}
            </span>
            <span className="text-[10px] text-slate-500 block">Jaipur Delegation</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Approved Formula</span>
            <span className="text-sm font-bold text-civic-saffron-700 font-mono block mt-1.5" data-testid="metric-formula">
              ceil(0.33 &times; 3) = 1
            </span>
            <span className="text-[10px] text-slate-500 block">Mandatory Min: 1</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Reserved Filled</span>
            <span
              className={`text-lg font-bold font-heading block mt-0.5 ${
                allocation.reservedOccupiedCount! >= allocation.reservedMinimum
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              }`}
              data-testid="metric-reserved-filled"
            >
              {allocation.reservedOccupiedCount} / {allocation.reservedMinimum}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {allocation.reservedOccupiedCount! >= allocation.reservedMinimum ? 'Quota Met' : 'Unmet Quota'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase text-slate-500 font-bold block">Reserved Vacancies</span>
            <span
              className={`text-lg font-bold font-heading block mt-0.5 ${
                allocation.vacanciesCount! > 0 ? 'text-amber-700' : 'text-slate-700'
              }`}
              data-testid="metric-vacancies"
            >
              {allocation.vacanciesCount}
            </span>
            <span className="text-[10px] text-slate-500 block">Held Vacant by Default</span>
          </div>
        </div>

        {/* Validation Outcome Card derived dynamically from shared service */}
        <div
          className={`p-4 rounded-xl border space-y-2 text-xs ${
            validation.isCompliant
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : delegationScenario === 'noncompliant'
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}
          data-testid="service-validation-outcome"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {validation.isCompliant ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="font-bold text-sm" data-testid="validation-status-badge">
                {validation.isCompliant
                  ? 'VALIDATION OUTCOME: COMPLIANT'
                  : delegationScenario === 'noncompliant'
                  ? 'VALIDATION OUTCOME: UNMET RESERVED MINIMUM (1 VACANCY)'
                  : 'VALIDATION OUTCOME: BLOCKED NON-COMPLIANT'}
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/70 border border-current">
              Status: {validation.status}
            </span>
          </div>

          <p className="leading-relaxed text-xs" data-testid="service-summary-note">
            {summaryNote}
          </p>

          {validation.warnings.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-100/70 border border-amber-300 text-amber-900 space-y-1">
              <span className="font-bold block text-[11px]">Service Warning:</span>
              <p className="text-[11px] leading-relaxed">{validation.warnings.join(' ')}</p>
            </div>
          )}

          {validation.errors.length > 0 && (
            <div className="p-2.5 rounded-lg bg-rose-100/70 border border-rose-300 text-rose-900 space-y-1">
              <span className="font-bold block text-[11px]">Service Error:</span>
              <p className="text-[11px] leading-relaxed">{validation.errors.join(' ')}</p>
            </div>
          )}
        </div>

        {/* Fictional Seat Roster Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Fictional Delegation Seats (Seat-by-Seat Math Illustration)</span>
            <span className="text-[11px] text-slate-500">Anonymous Seat Cards &bull; Non-Inference Invariant</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed" data-testid="small-cohort-privacy-notice">
            <strong>Small-Cohort Privacy Notice:</strong> This example illustrates allocation mathematics and capacity validation only,
            not a public disclosure pattern for real cohorts. In real small cohorts (1–3 places), individual declarations and named breakdowns
            are withheld from public views to prevent deductive identification.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {seats.map((seat) => (
              <div
                key={seat.seatNumber}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  seat.seatType === 'reserved'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : seat.seatType === 'vacant'
                    ? 'bg-amber-50/50 border-dashed border-amber-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
                data-testid={`seat-card-${seat.seatNumber}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                    Seat #{seat.seatNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      seat.seatType === 'reserved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : seat.seatType === 'vacant'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {seat.seatType === 'reserved'
                      ? 'Reserved Allocation'
                      : seat.seatType === 'vacant'
                      ? 'Held Vacant'
                      : 'General Allocation'}
                  </span>
                </div>

                <div className="font-bold text-slate-900">{seat.seatLabel}</div>
                <div className="text-[11px] text-slate-600">
                  <span>Allocation Status: </span>
                  <span className="font-mono text-[10px] font-semibold">{seat.categoryLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prototype & Shared Service Disclaimer Footer */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
          <span>
            <strong>Prototype Preview Limitation:</strong> Illustrative calculation only. Real member appointment and parliamentary delegation selection remain unbuilt.
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            Validated via reservationAllocationService.ts
          </span>
        </div>
      </Card>


      {/* Motions Order of Business */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
          <Vote className="w-5 h-5 text-civic-indigo-600" />
          <span>Tabled Motions on the Order Paper</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {motions.map((m) => (
            <Card key={m.id} className="p-6 border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-civic-indigo-600 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100">
                    {m.id} &bull; {m.state}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {m.status}
                  </span>
                </div>

                <CardTitle className="text-base font-bold text-slate-900">{m.title}</CardTitle>
                <p className="text-xs text-slate-600 leading-relaxed">{m.synopsis}</p>
                <div className="pt-1 text-[11px] text-slate-500">
                  <span>Lead Sponsor: <strong>{m.sponsor}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-civic-teal-700">{m.support}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedMotionModal(true)}
                  className="text-xs"
                >
                  View Motion Brief
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Motion Detail Modal */}
      {selectedMotionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-civic-saffron-600 uppercase">
                  Rajasthan State Motion #07
                </span>
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Safe School Perimeter Zone Standards (2026)
                </h3>
              </div>
              <button
                onClick={() => setSelectedMotionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 text-xs text-slate-600 flex-1 pr-1">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <span className="font-bold block">Statutory Tabling Summary</span>
                <p className="leading-relaxed text-[11px]">
                  Originating from the Jaipur Pedestrian Safety Youth Assembly (#assembly_jaipur_pedestrian_2026), this resolution unifies audit findings from 12 Jaipur and Kota schools into a national standard.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-900 uppercase tracking-wider block text-[10px]">
                  Key Legislative Clauses
                </span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  <li>Mandatory speed tables reducing vehicular approach velocity to 25 km/h within 200m of schools.</li>
                  <li>Continuous 1.8m grade-separated pedestrian footpaths with unobstructed curb cuts.</li>
                  <li>Installation of solar-powered amber flashers active during bell transition periods.</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                <strong>Simulated Preview Context:</strong> In the full Mission 2047 platform, passed apex motions are transmitted electronically to the parliamentary e-Gazette and municipal standing committee portal.
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedMotionModal(false)}
              >
                Close Motion Brief
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
