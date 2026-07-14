import { useState, useEffect } from "react";
import { Loader2Icon } from "lucide-react";
import type { Project } from "../types";

import { PrimaryButton } from "../components/Buttons";
import ProjectCard from "../components/ProjectCard";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import api from "../configs/axios";
import toast from "react-hot-toast";


const MyGenerations = () => {
  const { user,isLoaded } = useUser();
  const {getToken} = useAuth();
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchMyGenerations = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const token = await getToken();
      const { data } = await api.get('/api/user/projects', {
          headers: { Authorization: `Bearer ${token}` }
      })
  
      setGenerations(Array.isArray(data.projects) ? data.projects : [])
  } catch (error: any) {
      const message = error?.response?.data?.message || error.message || "Failed to load generations";
      setErrorMessage(message);
      toast.error(message);
      console.log(error);
  } finally {
      setLoading(false)
  }
  };

  useEffect(() => {
    if (!isLoaded) {
        return;
    }

    if (user) {
        fetchMyGenerations()
    } else {
        navigate('/')
    }
}, [isLoaded, user, navigate])

  return loading ? (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2Icon className="size-7 animate-spin text-indigo-400" />
    </div>
  ) : (
    <div className="min-h-screen text-white p-6 md:p-12 my-28 light:text-slate-950">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">
            My Generations
          </h1>
          <p className="text-gray-400 light:text-slate-600">
            View and manage your previously generated content.
          </p>
        </header>

        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {generations.map((gen) => (
            <ProjectCard
              key={gen.id}
              gen={gen}
              setGenerations={setGenerations}
            />
          ))}
        </div>

        {errorMessage && (
          <div className="mt-12 rounded-2xl border border-red-400/30 bg-red-950/20 p-6 text-center text-red-100 light:bg-red-50 light:text-red-700">
            <p className="mb-4 text-lg font-medium">Could not load your generations.</p>
            <p className="mb-5 text-sm opacity-80">{errorMessage}</p>
            <PrimaryButton onClick={fetchMyGenerations}>Try Again</PrimaryButton>
          </div>
        )}

        {!errorMessage && generations.length === 0 && (
          <div className="mt-12 text-center text-gray-400 light:text-slate-600">
            <p className="mb-4 text-xl font-medium">
              No generations found. Start creating your first generation!
            </p>
            <PrimaryButton onClick={() => (window.location.href = "/generate")}>
              Create New Generation
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGenerations;
