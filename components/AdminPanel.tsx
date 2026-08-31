// components/AdminPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { getSession, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Skill,
  Project,
  SkillCategory,
  Certification,
  UserProfile,
} from "@/types";
import {
  User,
  Briefcase,
  Award,
  Code,
  FileText,
  Save,
  Plus,
  Trash2,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ResumeData {
  profile: {
    name: string;
    role: string;
    avatar: string;
  };
  experience: Array<{
    title: string;
    company: string;
    period: string;
    location: string;
    achievements: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    period: string;
  }>;
  skills: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
  }>;
}

export function AdminPanel() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({
    id: 0,
    user: 0,
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    title: "",
    bio: "",
    location: "",
    profile_image: "",
    linkedin: "",
    github: "",
    phone: "",
    website: "",
    twitter: "",
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState<Skill>({
    id: 0,
    name: "",
    level: 50,
    category: 0,
  });
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [newCertification, setNewCertification] = useState<Omit<Certification, "id">>({ 
    name: "",
    issuer: "",
    date: new Date().toISOString().split("T")[0],
    in_progress: false,
    badge: "",
    credential_url: "",
    type: "other",
  });
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState<Project>({
    id: 0,
    name: "",
    description: "",
    technologies: "",
    link: "",
    type: "web",
    status: "completed",
    completion: "",
    user: 0,
  });
  const [resumeData, setResumeData] = useState<ResumeData>({
    profile: {
      name: "",
      role: "",
      avatar: "",
    },
    experience: [],
    education: [],
    skills: [],
    certifications: [],
  });
  const [newExperience, setNewExperience] = useState({
    title: "",
    company: "",
    period: "",
    location: "",
    achievements: [""],
  });
  const [newEducation, setNewEducation] = useState({
    school: "",
    degree: "",
    period: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch profile data
      const profile = await api.profile.get();
      setProfileData({
        ...profile,
        profile_image: profile.profile_image ?? "",
      });

      // Fetch skills
      const skillsData = await api.skills.get();
      setSkills(skillsData);

      // Fetch skill categories
      const categoriesData = await api.skillCategory.get();
      setSkillCategories(categoriesData);

      // Fetch certifications
      const certsData = await api.certifications.get();
      setCertifications(certsData);

      // Fetch projects
      const projectsData = await api.projects.get();
      setProjects(projectsData);

      // For resume data, you might need to create a new endpoint or use local data
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error fetching data", {
        description: "There was a problem loading your data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true);
      const updateData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        title: profileData.title,
        bio: profileData.bio,
        location: profileData.location,
        phone: profileData.phone,
        website: profileData.website,
        github: profileData.github,
        linkedin: profileData.linkedin,
        twitter: profileData.twitter,
      };

      await api.profile.update(updateData);
      toast.success("Profile updated", {
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile", {
        description:
          "There was a problem updating your profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name) {
      toast.error("Missing information", {
        description: "Please enter a skill name.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.skills.create(newSkill);
      setSkills([...skills, response]);
      setNewSkill({ id: 0, name: "", level: 50, category: 0 });
      toast.success("Skill added", {
        description: `${newSkill.name} has been added to your skills.`,
      });
    } catch (error) {
      console.error("Error adding skill:", error);
      toast.error("Error adding skill", {
        description: "There was a problem adding your skill. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSkill = async (id: number) => {
    try {
      setIsLoading(true);
      await api.skills.delete(id);
      setSkills(skills.filter((skill) => skill.id !== id));
      toast.success("Skill deleted", {
        description: "The skill has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting skill:", error);
      toast.error("Error deleting skill", {
        description:
          "There was a problem deleting your skill. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCertification = async () => {
    if (!newCertification.name || !newCertification.issuer) {
      toast.error("Missing information", {
        description: "Please enter both name and issuer for the certification.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.certifications.create(newCertification);
      setCertifications([...certifications, response]);
      setNewCertification({
        name: "",
        issuer: "",
        date: new Date().toISOString().split("T")[0],
        in_progress: false,
        badge: "",
        credential_url: "",
        type: "other",
      });
      toast.success("Certification added", {
        description: `${newCertification.name} has been added.`,
      });
    } catch (error) {
      console.error("Error adding certification:", error);
      toast.error("Error adding certification", {
        description: "There was a problem adding your certification. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCertification = async () => {
    if (!editingCert) return;
    try {
      setIsLoading(true);
      const response = await api.certifications.update(editingCert.id, editingCert);
      setCertifications(certifications.map((c) => (c.id === editingCert.id ? response : c)));
      setEditingCert(null);
      toast.success("Certification updated");
    } catch (error) {
      console.error("Error updating certification:", error);
      toast.error("Error updating certification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCertification = async (id: number) => {
    try {
      setIsLoading(true);
      await api.certifications.delete(id);
      setCertifications(certifications.filter((cert) => cert.id !== id));
      toast.success("Certification deleted", {
        description: "The certification has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting certification:", error);
      toast.error("Error deleting certification", {
        description:
          "There was a problem deleting your certification. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name || !newProject.description) {
      toast.error("Missing information", {
        description: "Please enter both name and description for the project.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.projects.create(newProject);
      setProjects([...projects, response]);
      setNewProject({
        id: 0,
        name: "",
        description: "",
        technologies: "",
        link: "",
        type: "web",
        status: "completed",
        completion: "",
        user: 0,
      });
      toast.success("Project added", {
        description: `${newProject.name} has been added to your projects.`,
      });
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Error adding project", {
        description:
          "There was a problem adding your project. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      setIsLoading(true);
      await api.projects.delete(id);
      setProjects(projects.filter((project) => project.id !== id));
      toast.success("Project deleted", {
        description: "The project has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Error deleting project", {
        description:
          "There was a problem deleting your project. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  // components/AdminPanel.tsx
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("profile_image", file);

    try {
      const data = await api.profile.uploadImage(formData);
      setProfileData({ ...profileData, profile_image: data.imageUrl });
      toast.success("Image uploaded", {
        description: "Your profile image has been successfully updated.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error uploading image", {
        description:
          error instanceof Error
            ? error.message
            : "There was a problem uploading your image. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };
  const togglePanel = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setActiveTab("profile");
  };

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={togglePanel}
        className="rounded-full w-12 h-12 shadow-lg relative"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <User className="h-5 w-5" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 max-w-[90vw] bg-white dark:bg-slate-800 rounded-lg shadow-xl border">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-semibold">Portfolio Editor</h3>
            <Button variant="ghost" size="sm" onClick={togglePanel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="profile" className="text-xs">
                <User className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="skills" className="text-xs">
                <Code className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="certs" className="text-xs">
                <Award className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="projects" className="text-xs">
                <Briefcase className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="resume" className="text-xs">
                <FileText className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <div className="p-4 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Profile Tab */}
                  <TabsContent value="profile">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={
                              profileData.profile_image ||
                              "/placeholder-avatar.jpg"
                            }
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <Label
                            htmlFor="profile-image"
                            className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer"
                          >
                            {isUploading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                            <Input
                              id="profile-image"
                              type="file"
                              className="hidden"
                              onChange={handleImageUpload}
                              accept="image/*"
                              disabled={isUploading}
                            />
                          </Label>
                        </div>
                        <div>
                          <h4 className="font-medium">Profile Image</h4>
                          <p className="text-sm text-muted-foreground">
                            {isUploading
                              ? "Uploading..."
                              : "Click camera to upload"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="first-name">First Name *</Label>
                          <Input
                            id="first-name"
                            value={profileData.first_name}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                first_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last-name">Last Name *</Label>
                          <Input
                            id="last-name"
                            value={profileData.last_name}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                last_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={profileData.title}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              title: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio *</Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              bio: e.target.value,
                            })
                          }
                          rows={3}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              location: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input
                            id="linkedin"
                            value={profileData.linkedin}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                linkedin: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="github">GitHub</Label>
                          <Input
                            id="github"
                            value={profileData.github}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                github: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleProfileUpdate}
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Profile
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Skills Tab */}
                  <TabsContent value="skills">
                    <div className="space-y-4">
                      <h4 className="font-medium">Add New Skill</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="skill-name">Skill Name *</Label>
                          <Input
                            id="skill-name"
                            value={newSkill.name}
                            onChange={(e) =>
                              setNewSkill({ ...newSkill, name: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skill-category">Category *</Label>
                          <select
                            id="skill-category"
                            value={newSkill.category}
                            onChange={(e) =>
                              setNewSkill({
                                ...newSkill,
                                category: Number(e.target.value),
                              })
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                          >
                            <option value={0}>Select a category</option>
                            {skillCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="skill-level">
                          Level: {newSkill.level}%
                        </Label>
                        <Input
                          id="skill-level"
                          type="range"
                          min="0"
                          max="100"
                          value={newSkill.level}
                          onChange={(e) =>
                            setNewSkill({
                              ...newSkill,
                              level: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>

                      <Button
                        onClick={handleAddSkill}
                        className="w-full"
                        disabled={
                          isLoading || !newSkill.name || !newSkill.category
                        }
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Add Skill
                      </Button>

                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Your Skills</h4>
                        <div className="space-y-2">
                          {skills.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No skills added yet.
                            </p>
                          ) : (
                            skills.map((skill) => {
                              const category = skillCategories.find(
                                (c) => c.id === skill.category
                              );
                              return (
                                <div
                                  key={skill.id}
                                  className="flex items-center justify-between p-2 border rounded"
                                >
                                  <div>
                                    <span className="font-medium">
                                      {skill.name}
                                    </span>
                                    <Badge variant="secondary" className="ml-2">
                                      {category?.name || "Uncategorized"}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground">
                                      Level: {skill.level}%
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSkill(skill.id!)}
                                    disabled={isLoading}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Certifications Tab */}
                  <TabsContent value="certs">
                    <div className="space-y-4">
                      {/* ── Edit mode ── */}
                      {editingCert ? (
                        <>
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Edit Certification</h4>
                            <Button variant="ghost" size="sm" onClick={() => setEditingCert(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-cert-name">Name *</Label>
                            <Input
                              id="edit-cert-name"
                              value={editingCert.name}
                              onChange={(e) => setEditingCert({ ...editingCert, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-cert-issuer">Issuer *</Label>
                            <Input
                              id="edit-cert-issuer"
                              value={editingCert.issuer}
                              onChange={(e) => setEditingCert({ ...editingCert, issuer: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-cert-date">Date</Label>
                            <Input
                              id="edit-cert-date"
                              type="date"
                              value={editingCert.date}
                              onChange={(e) => setEditingCert({ ...editingCert, date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-cert-type">Type</Label>
                            <select
                              id="edit-cert-type"
                              value={editingCert.type}
                              onChange={(e) => setEditingCert({ ...editingCert, type: e.target.value as Certification["type"] })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="aws">AWS</option>
                              <option value="alx">ALX</option>
                              <option value="oracle">Oracle</option>
                              <option value="badge">Network Badge</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-cert-badge">Badge Image URL</Label>
                            <Input
                              id="edit-cert-badge"
                              value={editingCert.badge ?? ""}
                              onChange={(e) => setEditingCert({ ...editingCert, badge: e.target.value })}
                              placeholder="https://images.credly.com/..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-cert-url">Credential URL</Label>
                            <Input
                              id="edit-cert-url"
                              value={editingCert.credential_url ?? ""}
                              onChange={(e) => setEditingCert({ ...editingCert, credential_url: e.target.value })}
                              placeholder="https://www.credly.com/badges/..."
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="edit-cert-in-progress"
                              checked={editingCert.in_progress}
                              onCheckedChange={(checked) => setEditingCert({ ...editingCert, in_progress: checked })}
                            />
                            <Label htmlFor="edit-cert-in-progress">In Progress</Label>
                          </div>
                          <Button onClick={handleUpdateCertification} className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                          </Button>
                        </>
                      ) : (
                        <>
                          <h4 className="font-medium">Add New Certification / Badge</h4>
                          <div className="space-y-2">
                            <Label htmlFor="cert-name">Name *</Label>
                            <Input
                              id="cert-name"
                              value={newCertification.name}
                              onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                              placeholder="AWS Cloud Practitioner"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cert-issuer">Issuer *</Label>
                            <Input
                              id="cert-issuer"
                              value={newCertification.issuer}
                              onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                              placeholder="Amazon Web Services"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cert-date">Date</Label>
                            <Input
                              id="cert-date"
                              type="date"
                              value={newCertification.date}
                              onChange={(e) => setNewCertification({ ...newCertification, date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cert-type">Type</Label>
                            <select
                              id="cert-type"
                              value={newCertification.type}
                              onChange={(e) => setNewCertification({ ...newCertification, type: e.target.value as Certification["type"] })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="aws">AWS</option>
                              <option value="alx">ALX</option>
                              <option value="oracle">Oracle</option>
                              <option value="badge">Network Badge</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cert-badge">Badge Image URL</Label>
                            <Input
                              id="cert-badge"
                              value={newCertification.badge ?? ""}
                              onChange={(e) => setNewCertification({ ...newCertification, badge: e.target.value })}
                              placeholder="https://images.credly.com/..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cert-url">Credential URL</Label>
                            <Input
                              id="cert-url"
                              value={newCertification.credential_url ?? ""}
                              onChange={(e) => setNewCertification({ ...newCertification, credential_url: e.target.value })}
                              placeholder="https://www.credly.com/badges/..."
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="cert-in-progress"
                              checked={newCertification.in_progress}
                              onCheckedChange={(checked) => setNewCertification({ ...newCertification, in_progress: checked })}
                            />
                            <Label htmlFor="cert-in-progress">In Progress</Label>
                          </div>
                          <Button
                            onClick={handleAddCertification}
                            className="w-full"
                            disabled={isLoading || !newCertification.name || !newCertification.issuer}
                          >
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                            Add Credential
                          </Button>
                        </>
                      )}

                      {/* List */}
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Your Credentials</h4>
                        <div className="space-y-2">
                          {certifications.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No credentials added yet.
                            </p>
                          ) : (
                            certifications.map((cert) => (
                              <div
                                key={cert.id}
                                className="flex items-center justify-between p-2 border rounded gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium text-sm block truncate">
                                    {cert.name}
                                  </span>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                                    <span>{cert.issuer}</span>
                                    <span>•</span>
                                    <span className="uppercase font-mono">{cert.type}</span>
                                    {cert.in_progress && (
                                      <Badge variant="outline" className="ml-1">In Progress</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingCert(cert)}
                                    disabled={isLoading}
                                  >
                                    <Save className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCertification(cert.id!)}
                                    disabled={isLoading}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Projects Tab */}
                  <TabsContent value="projects">
                    <div className="space-y-4">
                      <h4 className="font-medium">Add New Project</h4>
                      <div className="space-y-2">
                        <Label htmlFor="project-name">Project Name *</Label>
                        <Input
                          id="project-name"
                          value={newProject.name}
                          onChange={(e) =>
                            setNewProject({
                              ...newProject,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="project-desc">Description *</Label>
                        <Textarea
                          id="project-desc"
                          value={newProject.description}
                          onChange={(e) =>
                            setNewProject({
                              ...newProject,
                              description: e.target.value,
                            })
                          }
                          rows={2}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="project-tech">Technologies</Label>
                        <Input
                          id="project-tech"
                          value={newProject.technologies}
                          onChange={(e) =>
                            setNewProject({
                              ...newProject,
                              technologies: e.target.value,
                            })
                          }
                          placeholder="React, Node.js, PostgreSQL, etc."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="project-type">Type</Label>
                          <select
                            id="project-type"
                            value={newProject.type}
                            onChange={(e) =>
                              setNewProject({
                                ...newProject,
                                type: e.target.value,
                              })
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="web">Web</option>
                            <option value="mobile">Mobile</option>
                            <option value="data">Data</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-status">Status</Label>
                          <select
                            id="project-status"
                            value={newProject.status}
                            onChange={(e) =>
                              setNewProject({
                                ...newProject,
                                status: e.target.value,
                              })
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="completed">Completed</option>
                            <option value="in-progress">In Progress</option>
                            <option value="planned">Planned</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="project-link">
                          Project Link (optional)
                        </Label>
                        <Input
                          id="project-link"
                          value={newProject.link ?? ""}
                          onChange={(e) =>
                            setNewProject({
                              ...newProject,
                              link: e.target.value,
                            })
                          }
                          placeholder="https://..."
                        />
                      </div>

                      <Button
                        onClick={handleAddProject}
                        className="w-full"
                        disabled={
                          isLoading ||
                          !newProject.name ||
                          !newProject.description
                        }
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Add Project
                      </Button>

                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Your Projects</h4>
                        <div className="space-y-2">
                          {projects.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No projects added yet.
                            </p>
                          ) : (
                            projects.map((project) => (
                              <div
                                key={project.id}
                                className="flex items-center justify-between p-2 border rounded"
                              >
                                <div>
                                  <span className="font-medium">
                                    {project.name}
                                  </span>
                                  <div className="text-xs text-muted-foreground">
                                    {project.type} • {project.status}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteProject(project.id!)
                                  }
                                  disabled={isLoading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Resume Tab */}
                  <TabsContent value="resume">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Edit your resume data. Changes will be reflected on the
                        resume page.
                      </p>

                      <div className="space-y-2">
                        <Label htmlFor="resume-name">Full Name</Label>
                        <Input
                          id="resume-name"
                          value={resumeData.profile.name}
                          onChange={(e) =>
                            setResumeData({
                              ...resumeData,
                              profile: {
                                ...resumeData.profile,
                                name: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="resume-role">Professional Role</Label>
                        <Input
                          id="resume-role"
                          value={resumeData.profile.role}
                          onChange={(e) =>
                            setResumeData({
                              ...resumeData,
                              profile: {
                                ...resumeData.profile,
                                role: e.target.value,
                              },
                            })
                          }
                        />
                      </div>

                      <Button className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Resume Data
                      </Button>
                    </div>
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}
