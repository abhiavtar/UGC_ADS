import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import type { Project } from "../types";

import { PrimaryButton } from "../components/Buttons";
import ProjectCard from "../components/ProjectCard";
import api from "../configs/axios";
import toast from "react-hot-toast";

const Community = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const { data } = await api.get('/api/project/published')
      setProjects(Array.isArray(data.projects) ? data.projects : [])
  } catch (error: any) {
      const message = error?.response?.data?.message || error.message || "Failed to load community projects";
      setErrorMessage(message);
      toast.error(message);
      console.log(error);
  } finally {
      setLoading(false)
  }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return loading ? (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2Icon className="size-7 animate-spin text-indigo-400" />
    </div>
  ) : (
    <div className="min-h-screen text-white p-6 md:p-12 my-28 light:text-slate-950">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">
            Community
          </h1>
          <p className="text-gray-400 light:text-slate-600">
            See what others are creating with UGC.ai
          </p>
        </header>

        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              gen={project}
              setGenerations={setProjects}
              forCommunity
            />
          ))}
        </div>

        {errorMessage && (
          <div className="mt-12 rounded-2xl border border-red-400/30 bg-red-950/20 p-6 text-center text-red-100 light:bg-red-50 light:text-red-700">
            <p className="mb-4 text-lg font-medium">Could not load community projects.</p>
            <p className="mb-5 text-sm opacity-80">{errorMessage}</p>
            <PrimaryButton onClick={fetchProjects}>Try Again</PrimaryButton>
          </div>
        )}

        {!errorMessage && projects.length === 0 && (
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-300 light:border-slate-200 light:bg-white light:text-slate-600">
            <p className="text-xl font-medium">No public projects yet.</p>
            <p className="mt-2 text-sm opacity-80">Publish one of your generations and it will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
