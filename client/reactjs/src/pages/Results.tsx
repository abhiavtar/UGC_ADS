import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ImageIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparkleIcon,
  VideoIcon,
} from "lucide-react";

import type { Project } from "../types";
import { GhostButton, PrimaryButton } from "../components/Buttons";
import api from "../configs/axios";
import toast from "react-hot-toast";

const isUsableUrl = (url?: string | null) => {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
};

const getReadableError = (error?: string | null) => {
  if (!error) return "";

  try {
    const parsed = JSON.parse(error);
    const apiError = parsed?.error;

    if (
      apiError?.status === "RESOURCE_EXHAUSTED" ||
      apiError?.code === 429 ||
      String(apiError?.message || "").toLowerCase().includes("prepayment credits")
    ) {
      return "Google AI credits are depleted. Add billing credits in Google AI Studio, then try again.";
    }

    return apiError?.message || error;
  } catch {
    const normalizedError = error.toLowerCase();

    if (
      normalizedError.includes("resource_exhausted") ||
      normalizedError.includes("prepayment credits") ||
      normalizedError.includes("quota")
    ) {
      return "Google AI credits are depleted. Add billing credits in Google AI Studio, then try again.";
    }

    return error;
  }
};

const Result = () => {
  const { projectId } = useParams();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [project, setProjectData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const fetchProjectData = async () => {
    try {
      if (!projectId) {
        setLoading(false);
        return;
      }

      const token = await getToken();
      const { data } = await api.get(`/api/user/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProjectData(data.project);
      setIsGenerating(Boolean(data.project.isGenerating));
      setImageFailed(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!project) {
      return;
    }

    setIsGenerating(true);
    

    try {
     

      const token = await getToken();
      const { data } = await api.post(
        "/api/project/video",
        { projectId: project.id },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setProjectData({
        ...project,
        generatedVideo: data.videoUrl,
        isGenerating: false,
      });
      window.dispatchEvent(new Event("credits:changed"));
      toast.success(data.message || "Video generated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (user && !project?.id) {
      fetchProjectData();
    } else if (isLoaded && !user) {
      navigate("/");
    }
  }, [user, isLoaded, project?.id, projectId]);

  // Fetch project while the backend is still generating the image/video.
  useEffect(() => {
    const waitingForImage = project && !project.generatedImage && !project.error;

    if (user && (isGenerating || waitingForImage)) {
      const interval = setInterval(() => {
        fetchProjectData();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user, isGenerating, project?.generatedImage, project?.error]);

  // Keep the page stable while the result data is being fetched.
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2Icon className="animate-spin text-indigo-500 size-9" />
      </div>
    );
  }

  // Handles invalid or stale result URLs.
  if (!project) {
    return (
      <div className="min-h-screen px-6 py-32 text-center text-white light:text-slate-950">
        <h1 className="text-3xl font-semibold">Result not found</h1>
        <Link to="/generate" className="btn-secondary mt-6 inline-flex">
          Create New Generation
        </Link>
      </div>
    );
  }

  const hasGeneratedImage = isUsableUrl(project.generatedImage);
  const hasGeneratedVideo = isUsableUrl(project.generatedVideo);
  const stillGeneratingImage =
    project.isGenerating && !hasGeneratedImage && !project.error;
  const readableError = getReadableError(project.error);

  return (
    <div className="min-h-screen text-white p-6 md:p-12 mt-20 light:text-slate-950">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-medium">
            Generation Result
          </h1>

          <Link
            to="/generate"
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <RefreshCwIcon className="w-4 h-4" />
            <p className="max-sm:hidden">New Generation</p>
          </Link>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main generated media preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel inline-block p-2 rounded-2xl">
              <div
                className={`${
                  project?.aspectRatio === "9:16"
                    ? "aspect-[9/16]"
                    : "aspect-video"
                } sm:max-h-[600px] rounded-xl bg-gray-900 overflow-hidden relative light:bg-slate-100`}
              >
                {hasGeneratedVideo ? (
                  <video
                    src={project.generatedVideo}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : hasGeneratedImage && !imageFailed ? (
                  <img
                    src={project.generatedImage}
                    alt="Generated Result"
                    className="w-full h-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : stillGeneratingImage ? (
                  <div className="w-full h-full min-h-96 flex flex-col items-center justify-center gap-4 px-6 text-center">
                    <Loader2Icon className="size-10 animate-spin text-violet-300" />
                    <div>
                      <p className="text-lg font-semibold">Generating your image...</p>
                      <p className="mt-2 text-sm text-gray-400 light:text-slate-600">
                        This can take a little while. The page will update automatically.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full min-h-96 flex flex-col items-center justify-center gap-4 px-6 text-center">
                    <ImageIcon className="size-12 text-red-300" />
                    <div>
                      <p className="text-lg font-semibold">
                        {project.error ? "Generation failed" : "Generated image unavailable"}
                      </p>
                      <p className="mt-2 text-sm text-gray-400 light:text-slate-600">
                        {readableError ||
                          "The project does not have a valid generated image URL yet."}
                      </p>
                    </div>
                    <Link to="/generate" className="btn-secondary mt-2 inline-flex">
                      Try New Generation
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Download actions for generated assets */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-xl font-semibold mb-4">Actions</h3>

              <div className="flex flex-col gap-3">
                <a href={hasGeneratedImage ? project.generatedImage : "#"} download>
                  <GhostButton
                    disabled={!hasGeneratedImage}
                    className="w-full justify-center rounded-md py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="size-4" />
                    Download Image
                  </GhostButton>
                </a>

                <a href={hasGeneratedVideo ? project.generatedVideo : "#"} download>
                  <GhostButton
                    disabled={!hasGeneratedVideo}
                    className="w-full justify-center rounded-md py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <VideoIcon className="size-4" />
                    Download Video
                  </GhostButton>
                </a>
              </div>
            </div>

            {hasGeneratedImage && (
              <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                <h3 className="text-xl font-semibold mb-2">Video Magic</h3>

                <p className="text-gray-400 text-sm mb-6 light:text-slate-600">
                  Turn this static image into a dynamic video for social media.
                </p>

                {!project.generatedVideo ? (
                  <PrimaryButton
                    onClick={handleGenerateVideo}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>Generating Video...</>
                    ) : (
                      <>
                        <SparkleIcon className="size-4" />
                        Generate Video
                      </>
                    )}
                  </PrimaryButton>
                ) : (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-center text-sm font-medium">
                    Video Generated Successfully!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
