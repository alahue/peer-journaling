import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Heart, Target, Lightbulb, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { modifyEntryForSharing } from '../utils/llm-mock';
import { ScrollArea } from './ui/scroll-area';

type Intention = 'support' | 'accountability' | 'perspective';

export function Share() {
  const navigate = useNavigate();
  const { journalEntries, updateJournalEntry } = useApp();
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [intention, setIntention] = useState<Intention>('support');
  const [showPreview, setShowPreview] = useState(false);
  const [modifiedContent, setModifiedContent] = useState('');

  const unsharedEntries = journalEntries.filter(entry => !entry.shared);

  const handleGeneratePreview = () => {
    if (!selectedEntry) return;

    const entry = journalEntries.find(e => e.id === selectedEntry);
    if (!entry) return;

    const modified = modifyEntryForSharing(entry.content, intention);
    setModifiedContent(modified);
    setShowPreview(true);
  };

  const handleApprove = () => {
    if (!selectedEntry) return;

    updateJournalEntry(selectedEntry, {
      shared: true,
      modifiedContent,
      intention,
    });

    setShowPreview(false);
    setSelectedEntry(null);
    setModifiedContent('');
    navigate('/menu');
  };

  const handleDeny = () => {
    setShowPreview(false);
    setModifiedContent('');
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
                      <div className="font-medium">Accountability</div>
                      <div className="text-sm text-gray-600">Looking for encouragement to stay on track</div>
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
                          {entry.timestamp.toLocaleDateString('en-US', { 
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

            <div className="flex justify-end">
              <Button 
                onClick={handleGeneratePreview} 
                disabled={!selectedEntry}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Sharing Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Modified Entry</DialogTitle>
              <DialogDescription>
                Our AI has prepared your entry for sharing. You can edit it before sending to a peer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Modified Entry</Label>
                <Textarea
                  value={modifiedContent}
                  onChange={(e) => setModifiedContent(e.target.value)}
                  className="mt-2 min-h-[200px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleDeny}>
                Deny
              </Button>
              <Button onClick={handleApprove}>
                Approve & Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
