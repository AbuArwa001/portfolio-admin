"use client";

import { useState } from "react";
import {
  IconX,
  IconBriefcase,
  IconFileDescription,
  IconCertificate,
  IconArticle,
} from "@tabler/icons-react";

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCreateModal({ isOpen, onClose }: QuickCreateModalProps) {
  const [activeForm, setActiveForm] = useState<string | null>(null);

  if (!isOpen) return null;

  const creationOptions = [
    {
      id: "project",
      title: "New Project",
      icon: IconBriefcase,
      description: "Add a new project to your portfolio",
    },
    {
      id: "blog",
      title: "Blog Post",
      icon: IconArticle,
      description: "Create a new blog article",
    },
    {
      id: "certificate",
      title: "Certificate",
      icon: IconCertificate,
      description: "Add a new certification",
    },
    {
      id: "resume",
      title: "Resume Update",
      icon: IconFileDescription,
      description: "Update your resume information",
    },
  ];

  const renderForm = () => {
    switch (activeForm) {
      case "project":
        return <ProjectForm onCancel={() => setActiveForm(null)} />;
      case "blog":
        return <BlogForm onCancel={() => setActiveForm(null)} />;
      case "certificate":
        return <CertificateForm onCancel={() => setActiveForm(null)} />;
      case "resume":
        return <ResumeForm onCancel={() => setActiveForm(null)} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {activeForm ? "Create New" : "Quick Create"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {!activeForm ? (
            <div className="p-4 grid gap-3">
              {creationOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveForm(option.id)}
                  className="flex items-start gap-3 p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <option.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{option.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4">{renderForm()}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple form components (you can expand these later)
function ProjectForm({ onCancel }: { onCancel: () => void }) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would handle the project creation
    console.log("Creating project:", title);
    // Redirect to full project editor or close modal
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="font-medium mb-4">Add New Project</h4>
      <div>
        <label className="block text-sm font-medium mb-1">Project Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter project title"
          required
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-primary text-white rounded-md"
        >
          Create
        </button>
      </div>
    </form>
  );
}

function BlogForm({ onCancel }: { onCancel: () => void }) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating blog post:", title);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="font-medium mb-4">Create Blog Post</h4>
      <div>
        <label className="block text-sm font-medium mb-1">Post Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter post title"
          required
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-primary text-white rounded-md"
        >
          Create
        </button>
      </div>
    </form>
  );
}

function CertificateForm({ onCancel }: { onCancel: () => void }) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Adding certificate:", name);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="font-medium mb-4">Add Certificate</h4>
      <div>
        <label className="block text-sm font-medium mb-1">Certificate Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter certificate name"
          required
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-primary text-white rounded-md"
        >
          Add
        </button>
      </div>
    </form>
  );
}

function ResumeForm({ onCancel }: { onCancel: () => void }) {
  const [summary, setSummary] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updating resume with:", summary);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="font-medium mb-4">Update Resume</h4>
      <div>
        <label className="block text-sm font-medium mb-1">Professional Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Brief professional summary"
          rows={3}
          required
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-primary text-white rounded-md"
        >
          Update
        </button>
      </div>
    </form>
  );
}
