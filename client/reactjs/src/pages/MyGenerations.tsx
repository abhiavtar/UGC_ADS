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

  const fetchMyGenerations = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get('/api/user/projects', {
          headers: { Authorization: `Bearer ${token}` }
      })
  
      setGenerations(data.projects)
      setLoading(false)
  } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
  }
  };

  useEffect(() => {
    if (user) {
        fetchMyGenerations()
    } else if (isLoaded && !user) {
        navigate('/')
    }
}, [user])

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

        {generations.length === 0 && (
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
