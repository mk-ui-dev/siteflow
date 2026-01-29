'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasksSummary, useProjectHealth } from '@/hooks/use-reports';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

const PROJECT_ID = 'proj-demo-123';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function ReportsPage() {
  const { data: tasksSummary, isLoading: tasksLoading } = useTasksSummary(PROJECT_ID);
  const { data: health, isLoading: healthLoading } = useProjectHealth(PROJECT_ID);

  // Mock data for demo
  const taskCompletionData = [
    { name: 'Week 1', completed: 12, pending: 8 },
    { name: 'Week 2', completed: 18, pending: 6 },
    { name: 'Week 3', completed: 24, pending: 10 },
    { name: 'Week 4', completed: 30, pending: 5 },
  ];

  const issueSeverityData = [
    { name: 'Low', value: 8 },
    { name: 'Medium', value: 12 },
    { name: 'High', value: 6 },
    { name: 'Critical', value: 2 },
  ];

  const projectTimelineData = [
    { date: 'Jan', tasks: 45, inspections: 12 },
    { date: 'Feb', tasks: 52, inspections: 15 },
    { date: 'Mar', tasks: 48, inspections: 18 },
    { date: 'Apr', tasks: 61, inspections: 20 },
  ];

  if (tasksLoading || healthLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-gray-500">View project insights and metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Completion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taskCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issue Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={issueSeverityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {issueSeverityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectTimelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={2} name="Tasks" />
                <Line type="monotone" dataKey="inspections" stroke="#10b981" strokeWidth={2} name="Inspections" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">{health?.score || 85}%</div>
                <p className="mt-2 text-sm text-muted-foreground">Overall Project Health</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Task Completion</span>
                  <span className="font-medium">92%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: '92%' }} />
                </div>

                <div className="flex justify-between text-sm">
                  <span>Quality Score</span>
                  <span className="font-medium">88%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: '88%' }} />
                </div>

                <div className="flex justify-between text-sm">
                  <span>Schedule Adherence</span>
                  <span className="font-medium">75%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-yellow-500" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Tasks</span>
                <span className="font-medium">{tasksSummary?.total || 245}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completed Tasks</span>
                <span className="font-medium text-green-600">{tasksSummary?.completed || 180}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">In Progress</span>
                <span className="font-medium text-blue-600">{tasksSummary?.inProgress || 45}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-medium text-yellow-600">{tasksSummary?.pending || 20}</span>
              </div>
              <div className="mt-4 border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="font-bold text-primary">73%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
