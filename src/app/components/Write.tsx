import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Info } from 'lucide-react';

export function Write() {
  const navigate = useNavigate();

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
              This feature is not available during the usability study.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center text-center py-12 space-y-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Info className="w-10 h-10 text-blue-600" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-semibold text-gray-900">
                  Writing is disabled for this study
                </h3>
                <p className="text-gray-600">
                  A sample journal entry has been provided for you in the{' '}
                  <button
                    onClick={() => navigate('/history')}
                    className="text-indigo-600 font-medium hover:underline"
                  >
                    History tab
                  </button>
                  . Please use that entry to continue the usability test.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/history')} className="mt-4">
                Go to History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
