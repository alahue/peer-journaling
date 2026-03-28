import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Heart, Target, Lightbulb, Users, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import * as api from '../utils/api';

type Intention = 'support' | 'accountability' | 'perspective' | 'connection';

export function Share() {
  const navigate = useNavigate();
  const { journalEntries, refreshData } = useApp();
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [intention, setIntention] = useState<Intention>('support');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mediator output sections
  const [polishedEntry, setPolishedEntry] = useState('');
  const [explanation, setExplanation] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [validationPassed, setValidationPassed] = useState(true);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const unsharedEntries = journalEntries.filter(entry => !entry.shared);

  const handleGeneratePreview = async () => {
    if (!selectedEntry) return;
    setLoading(true);
    setError(null);

    try {
      const result = await api.mediateEntry(selectedEntry, intention);
      setPolishedEntry(result.polished_entry);
      setExplanation(result.explanation);
      setWarning(result.warning);
      setValidationPassed(result.validation_passed);
      setValidationIssues(result.validation_issues);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedEntry) return;
    setLoading(true);

    try {
      await api.approveSharing(selectedEntry, polishedEntry, intention, explanation, warning);
      await refreshData();
      setShowPreview(false);
      setSelectedEntry(null);
      setPolishedEntry('');
      setExplanation('');
      setWarning(null);
      navigate('/menu');
    } catch (err: any) {
      setError(err.message || 'Failed to approve sharing');
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (selectedEntry) {
      await api.denySharing(selectedEntry).catch(() => {});
    }
    setShowPreview(false);
    setPolishedEntry('');
    setExplanation('');
    setWarning(null);
    navigate('/menu');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate('/menu')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Share Journal Entry</CardTitle>
            <CardDescription>
              Select an entry and sharing intention to prepare it for a peer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Intention Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Sharing Intention</Label>
              <RadioGroup value={intention} onValueChange={(value) => setIntention(value as Intention)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="support" id="support" />
                  <Label htmlFor="support" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Heart className="w-5 h-5 text-pink-500" />
                    <div>
                      <div className="font-medium">Support</div>
                      <div className="text-sm text-gray-600">Seeking emotional support and understanding</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="accountability" id="accountability" />
                  <Label htmlFor="accountability" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Target className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Accountability & Goals</div>
                      <div className="text-sm text-gray-600">Looking for encouragement and support in reaching your goals</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="perspective" id="perspective" />
                  <Label htmlFor="perspective" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="font-medium">Perspective</div>
                      <div className="text-sm text-gray-600">Seeking fresh insights and viewpoints</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="connection" id="connection" />
                  <Label htmlFor="connection" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Users className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium">Connection</div>
                      <div className="text-sm text-gray-600">Seeking shared experience and a sense of belonging</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Entry Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Entry to Share</Label>
              {unsharedEntries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No entries available to share. Create a new entry first!
                </p>
              ) : (
                <ScrollArea className="h-[300px] border rounded-lg p-4">
                  <div className="space-y-3">
                    {unsharedEntries.map(entry => (
                      <div
                        key={entry.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedEntry === entry.id ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedEntry(entry.id)}
                      >
                        <div className="text-sm text-gray-500 mb-2">
                          {new Date(entry.created_at + 'Z').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <p className="text-sm line-clamp-3">{entry.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleGeneratePreview}
                disabled={!selectedEntry || loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Sharing Preview
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Review Modified Entry</DialogTitle>
              <DialogDescription>
                Our AI has prepared your entry for sharing. Review the changes below. You can edit the polished entry before sending.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(85vh-200px)]">
              <div className="space-y-4 pr-4">
                {/* Validation Issues */}
                {!validationPassed && validationIssues.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-sm text-red-700">Validation Issues</span>
                    </div>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {validationIssues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-red-500 mt-2">
                      Please edit the entry below to resolve these issues, then click "Re-validate".
                    </p>
                  </div>
                )}

                {/* Warning */}
                {warning && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-sm text-orange-700">Assistant Warning</span>
                    </div>
                    <p className="text-sm text-orange-600">{warning}</p>
                  </div>
                )}

                {/* Polished Entry - Editable */}
                <div>
                  <Label className="text-sm font-medium">Polished Entry (editable)</Label>
                  <Textarea
                    value={polishedEntry}
                    onChange={(e) => setPolishedEntry(e.target.value)}
                    className="mt-2 min-h-[200px]"
                  />
                </div>

                {/* Explanation - Read Only */}
                {explanation && (
                  <div>
                    <Label className="text-sm font-medium">Explanation of Changes</Label>
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 whitespace-pre-wrap">{explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={handleDeny}>
                Deny
              </Button>
              {!validationPassed ? (
                <Button onClick={handleGeneratePreview} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Re-validating...
                    </>
                  ) : (
                    'Re-validate'
                  )}
                </Button>
              ) : (
                <Button onClick={handleApprove} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Approve & Send'
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
