import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { CivicIssue, CivicIssueSeverity } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import {
  MapPin,
  ArrowRight,
  ThumbsUp,
  Plus,
  Filter,
  Layers,
} from 'lucide-react';

export const CivicIssuesPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [reportWard, setReportWard] = useState('Ward 24');
  const [reportCategory, setReportCategory] = useState('Pedestrian Hazard');
  const [reportSeverity, setReportSeverity] = useState<CivicIssueSeverity>('high');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const list = await demoRepository.getCivicIssues();
        setIssues(list);
      } catch (err) {
        console.error('Failed to load civic issues', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  const handleUpvote = async (issueId: string) => {
    if (!currentUser) return;
    try {
      await demoRepository.upvoteCivicIssue(issueId, currentUser.id);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to upvote issue', err);
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !reportTitle.trim() || !reportDescription.trim()) return;

    setIsSubmittingReport(true);
    try {
      await demoRepository.reportCivicIssue({
        title: reportTitle.trim(),
        location: reportLocation.trim() || 'Kalawad Road, Rajkot',
        ward: reportWard,
        category: reportCategory,
        severity: reportSeverity,
        status: 'reported',
        description: reportDescription.trim(),
        evidenceIds: [],
      });
      setReportTitle('');
      setReportLocation('');
      setReportDescription('');
      setIsReportModalOpen(false);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to report issue', err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const filteredIssues = issues.filter((iss) => {
    if (selectedWard !== 'all' && iss.ward !== selectedWard) return false;
    if (selectedSeverity !== 'all' && iss.severity !== selectedSeverity) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Demo Preview Notice */}
      <DemoPreviewBadge
        size="banner"
        label="Civic Issues Map Preview"
        description="Geospatial crowd-sourced hazard tagging sandbox. Active data links directly to Ankita's Rajkot school zone audit and Gujarat student fieldwork."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-civic-saffron-600" />
            <span>Civic Issues & Danger Spots Map</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Geospatial visualization of school zone pedestrian hazards and infrastructure defects audited by youth.
          </p>
        </div>

        <Button size="sm" variant="saffron" onClick={() => setIsReportModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Report Danger Spot</span>
        </Button>
      </div>

      {/* Simulated Geospatial Map Banner */}
      <Card className="p-6 border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl relative overflow-hidden shadow-md">
        <div className="relative z-10 space-y-3 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-civic-teal-300 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Interactive GIS Cluster Layer (Simulated)</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-white">
            Rajkot & Gujarat School Zone Heatmap
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {issues.length} verified danger clusters identified by student audits. 14 critical pedestrian crossing conflicts queued for municipal intervention.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
              Critical Deflection Zones (3)
            </span>
            <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Sightline Hazards (4)
            </span>
            <span className="px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
              Missing Sidewalks (5)
            </span>
          </div>
        </div>

        {/* Ambient Map Grid Accent */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 hidden md:block">
          <div className="w-48 h-48 rounded-full border-4 border-dashed border-civic-teal-400 animate-pulse flex items-center justify-center">
            <MapPin className="w-16 h-16 text-civic-saffron-400" />
          </div>
        </div>
      </Card>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Ward:
          </span>
          {['all', 'Ward 24', 'Ward 12', 'Ward 8'].map((ward) => (
            <button
              key={ward}
              onClick={() => setSelectedWard(ward)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedWard === ward
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ward === 'all' ? 'All Wards' : ward}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredIssues.map((iss) => {
          const hasUpvoted = currentUser ? iss.upvotedByUserIds?.includes(currentUser.id) : false;

          return (
            <Card
              key={iss.id}
              hoverable
              className="p-6 border-slate-200 flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        iss.severity === 'critical'
                          ? 'text-rose-700 bg-rose-50 border-rose-200'
                          : iss.severity === 'high'
                          ? 'text-amber-700 bg-amber-50 border-amber-200'
                          : 'text-slate-700 bg-slate-100 border-slate-200'
                      }`}
                    >
                      {iss.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{iss.ward}</span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium capitalize">
                    {iss.status.replace('_', ' ')}
                  </span>
                </div>

                <CardTitle className="text-base font-bold text-slate-900 font-heading">
                  {iss.title}
                </CardTitle>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {iss.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-civic-saffron-600 shrink-0" />
                  <span className="truncate">{iss.location}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleUpvote(iss.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    hasUpvoted
                      ? 'bg-civic-saffron-50 text-civic-saffron-800 border border-civic-saffron-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-civic-saffron-600' : ''}`} />
                  <span>{iss.reportsCount} Endorsements</span>
                </button>

                <Link to={`/issues/${iss.id}`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    <span>Audit Details</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Report Hazard Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Danger Spot / Pedestrian Hazard (Simulated)"
      >
        <form onSubmit={handleReportIssue} className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Report an unaddressed pedestrian safety issue near your school or transit route. This report will be queued for Youth Assembly field audit.
          </p>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Hazard Title</label>
            <Input
              placeholder="e.g. Uncontrolled zebra crossing outside Gate 2 with blind curve"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Specific Location</label>
              <Input
                placeholder="e.g. Kalawad Road outside Virani Science College, Rajkot"
                value={reportLocation}
                onChange={(e) => setReportLocation(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Municipal Ward</label>
              <select
                value={reportWard}
                onChange={(e) => setReportWard(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="Ward 8">Ward 8 (Rajkot)</option>
                <option value="Ward 2">Ward 2 (Rajkot)</option>
                <option value="Ward 14">Ward 14 (Rajkot)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Category</label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="Pedestrian Hazard">Pedestrian Hazard</option>
                <option value="Road Geometry">Road Geometry & Sightlines</option>
                <option value="Accessibility">Accessibility & Sidewalk Defect</option>
                <option value="Lighting & Visibility">Lighting & Visibility</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Estimated Severity</label>
              <select
                value={reportSeverity}
                onChange={(e) => setReportSeverity(e.target.value as CivicIssueSeverity)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
              >
                <option value="critical">Critical (Immediate danger)</option>
                <option value="high">High (Daily near-misses)</option>
                <option value="medium">Medium (Defect/Inconvenience)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Field Observation Summary</label>
            <Textarea
              placeholder="Describe peak hours, approximate speeds, and vulnerable student pedestrian flows..."
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="saffron" type="submit" isLoading={isSubmittingReport}>
              <span>Submit Hazard Report</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
