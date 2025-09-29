

'use client';

import PageHeader from '@/components/shared/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Pie, PieChart, Cell, Legend } from 'recharts';
import { useEffect, useState, useMemo } from 'react';
import { getAllRequestsAction } from '@/lib/actions';
import { TransportRequest } from '@/lib/types';

const COLORS = {
  Pending: '#FFBB28',
  Approved: '#00C49F',
  Disapproved: '#FF4136',
  Forwarded: '#0088FE',
  Recommended: '#8884d8',
  'Not Recommended': '#ff7300',
};

const CurrentYearRequestsChart = ({ requests }: { requests: TransportRequest[] }) => {
    const data = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(new Date().getFullYear(), i, 1);
            return {
                name: date.toLocaleString('default', { month: 'short' }),
                total: 0,
            };
        });

        const currentYear = new Date().getFullYear();
        requests.forEach(req => {
            const reqDate = new Date(req.from);
            if (reqDate.getFullYear() === currentYear) {
                const monthIndex = reqDate.getMonth();
                months[monthIndex].total += 1;
            }
        });

        
        return months;
    }, [requests]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transport Requests This Year</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#888888" tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
              }}
              cursor={{ fill: 'hsl(var(--muted))' }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const RequestStatusPieChart = ({ requests, role }: { requests: TransportRequest[], role: string | null }) => {
  const data = useMemo(() => {
    const statusCounts = requests.reduce((acc, req) => {
      const status = req.status === 'Rejected' ? 'Disapproved' : req.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    let statusesToShow: string[] = [];
    if (role === 'User') {
      statusesToShow = ['Pending', 'Approved', 'Disapproved', 'Forwarded', 'Recommended', 'Not Recommended'];
    } else if (role === 'Supervisor') {
      statusesToShow = ['Recommended', 'Forwarded', 'Approved', 'Disapproved'];
    } else if (role === 'Manager') {
        statusesToShow = ['Forwarded', 'Approved', 'Disapproved'];
    } else if (role === 'PD') {
        statusesToShow = ['Pending', 'Recommended', 'Not Recommended'];
    }


    return Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => statusesToShow.includes(item.name) && item.value > 0);

  }, [requests, role]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-sm font-bold">
        {value}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requests by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie 
              data={data} 
              cx="50%" 
              cy="50%" 
              labelLine={false} 
              label={renderCustomizedLabel}
              outerRadius={100} 
              innerRadius={60}
              dataKey="value" 
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#CCCCCC'} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};


export default function DashboardPage() {
  const { user, userRole } = useAuth();
  const [allRequests, setAllRequests] = useState<TransportRequest[]>([]);

  useEffect(() => {
    async function fetchRequests() {
      const requests = await getAllRequestsAction();
      setAllRequests(requests);
    }
    fetchRequests();
  }, []);

  const visibleRequests = useMemo(() => {
    if (!user || !userRole) return [];

    if (userRole === 'User') {
        return allRequests.filter(req => req.employeeNumber === user.employeeNumber);
    }
    if (userRole === 'PD') {
        return allRequests.filter(req => req.pdId === user.id);
    }
    return allRequests;
  }, [user, userRole, allRequests]);

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome, ${userRole}!`} description="Here's a quick overview of your transport requests." />
      <div className="grid gap-6 md:grid-cols-2">
        <RequestStatusPieChart requests={visibleRequests} role={userRole} />
        <CurrentYearRequestsChart requests={visibleRequests} />
      </div>
    </div>
  );
}
