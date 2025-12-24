'use client';

import { Calendar, Package, Download } from 'lucide-react';

interface Activity {
  title: string;
  badge?: string;
  date: string;
  description: string;
  hasDownload?: boolean;
}

interface Transaction {
  product: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  amount: string;
}

interface Connection {
  name: string;
  email: string;
  color: string;
}

interface ProfileContentProps {
  activities: Activity[];
  transactions: Transaction[];
  connections: Connection[];
}

export function ProfileContent({ activities, transactions, connections }: ProfileContentProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Latest Activity */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Latest Activity</h3>
        <div className="space-y-6">
          {activities.map((activity, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground">{activity.title}</h4>
                  {activity.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded">
                      {activity.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>Released on {activity.date}</span>
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                {activity.hasDownload && (
                  <button className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    Download ZIP
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History and Connections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Transaction History */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Transaction History</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b border-border">
              <div className="col-span-5">Product</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            {transactions.map((transaction, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 text-sm items-center">
                <div className="col-span-5 text-foreground truncate">{transaction.product}</div>
                <div className="col-span-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
                <div className="col-span-2 text-muted-foreground text-xs">{transaction.date}</div>
                <div className="col-span-2 text-foreground font-medium text-right">{transaction.amount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Connections */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Connections</h3>
          <div className="space-y-4">
            {connections.map((connection, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${connection.color} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                  {getInitials(connection.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{connection.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{connection.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

