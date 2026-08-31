export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
}

export interface SkillCategory {
  id: number;
  name: string;
  skills: Skill[];
}

export interface Skill {
  id: number;
  name: string;
  level: number;
  category: number; // ID reference to SkillCategory
  category_name?: string; // For easier access
}

export interface Certification {
  id: number;
  name: string;
  issuer: string;
  date: string;
  badge?: string;
  credential_url?: string;
  type: "aws" | "alx" | "oracle" | "badge" | "other";
  in_progress: boolean;
}

export interface Language {
  id: number;
  name: string;
  proficiency: "Native" | "Fluent" | "Proficient" | "Intermediate" | "Basic";
}

export interface UserProfile {
  id: number;
  user: number;
  username: string;
  first_name: string;
  last_name: string;
  user_details?: User; // Expanded user object
  email: string;
  bio: string;
  title: string;
  location: string;
  phone: string;
  website: string;
  github: string;
  linkedin: string;
  twitter: string;
  profile_image?: string;

  // Relationships (could be IDs or full objects)
  skill_categories?: number[] | SkillCategory[];
  certifications?: number[] | Certification[];
  languages?: Language[];

  // For API responses that include expanded data
  skills?: Array<{
    category: string;
    skills: Array<{
      name: string;
      level: number;
    }>;
  }>;
}

export interface Me {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  profile?: UserProfile;
}

export interface About {
  id?: number;
  name: string;
  bio: string;
  profile_image?: string | null;
  skills?: string;
}

// export interface CertificationData {
//   id: number;
//   name: string;
//   issuer: string;
//   date: string;
//   badge: string;
//   type: "aws" | "alx" | "other";
// }

export interface Project {
  id: number;
  name: string;
  description: string;
  type: string;
  status: string;
  technologies: string;
  completion: string;
  link?: string | null;
  image?: string | null;
  user: number; // User ID
  user_details?: User; // Expanded user object
  created_at?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at?: string;
  author?: number; // User ID
  author_details?: User; // Expanded user object
}

export interface ContactMessage {
  id?: number;
  name: string;
  email: string;
  message: string;
  created_at?: string;
}
