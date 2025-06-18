
import React from 'react';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Welcome to your Dashboard
        </h1>
        <div className="bg-white dark:bg-[hsl(217.2_32.6%_17.5%)] border border-border rounded-xl p-8 shadow-sm">
          <p className="text-muted-foreground">
            Your profile has been created successfully! This is where your personalized ApplyFlow journey begins.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
