import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Write() {
  const navigate = useNavigate();
  const { addJournalEntry } = useApp();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      await addJournalEntry(content);
      setContent('');
      navigate('/menu');
    } catch (err) {
      console.error('Failed to save entry:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate('/menu')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Write Journal Entry</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Write your thoughts here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/menu')}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!content.trim() || saving}>
                {saving ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
