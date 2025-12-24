'use client';

import { Mail, Phone, MapPin, Globe, Link as LinkIcon } from 'lucide-react';

interface ProfileSidebarProps {
  profile: {
    fullName: string | null;
    email: string;
    roles?: Array<{ name: string }>;
  };
  stats: {
    posts: number;
    projects: number;
    members: number;
  };
}

export function ProfileSidebar({ profile, stats }: ProfileSidebarProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const skills = ['Photoshop', 'Figma', 'HTML', 'React', 'Tailwind CSS', 'CSS', 'Laravel', 'Node.js'];
  console.log(profile);
  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
            {profile?.fullName ? getInitials(profile.fullName) : 'U'}
          </div>
          
          {/* Name and Role */}
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            {profile?.fullName || 'User'}
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded">
              Pro
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {profile?.roles?.[0]?.name || 'Project Manager'}
          </p>

          {/* Stats */}
          {/* <div className="grid grid-cols-3 gap-4 w-full mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.posts}</div>
              <div className="text-xs text-muted-foreground mt-1">Post</div>
            </div>
            <div className="text-center border-x border-border">
              <div className="text-2xl font-bold text-foreground">{stats.projects}</div>
              <div className="text-xs text-muted-foreground mt-1">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.members.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">Members</div>
            </div>
          </div> */}

          {/* Contact Info */}
          {/* <div className="w-full mt-6 pt-6 border-t border-border space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground break-all">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">(+1-876) 8654 239 581</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">Canada</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a href="https://shadcnuikit.com" className="text-foreground hover:text-primary transition-colors">
                https://shadcnuikit.com
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
              <a href="https://bundui.io" className="text-foreground hover:text-primary transition-colors">
                https://bundui.io/
              </a>
            </div>
          </div> */}
        </div>
      </div>

      {/* Complete Your Profile */}
      {/* <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Complete Your Profile</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '66%' }} />
            </div>
            <span className="ml-3 text-muted-foreground">%66</span>
          </div>
        </div>
      </div> */}

      {/* Skills */}
      {/* <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 text-xs font-medium bg-muted text-foreground rounded-md"
            >
              {skill}
            </span>
          ))}
        </div>
      </div> */}
    </div>
  );
}

