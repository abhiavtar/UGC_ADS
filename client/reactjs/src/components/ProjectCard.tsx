import { useAuth } from "@clerk/clerk-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  CheckCircle2Icon,
  ClockIcon,
  EllipsisIcon,
  ImageIcon,
  Loader2Icon,
  Share2Icon,
  Trash2Icon,
  VideoIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GhostButton, PrimaryButton } from "./Buttons";
import type { Project } from "../types";
import api from "../configs/axios";
import toast from "react-hot-toast";

type ProjectCardProps = {
  gen: Project;
  setGenerations?: Dispatch<SetStateAction<Project[]>>;
  forCommunity?: boolean;
};

const ProjectCard = ({
  gen,
  setGenerations,
  forCommunity = false,
}: ProjectCardProps) => {

  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const uploadedImages = Array.isArray(gen.uploadedImages) ? gen.uploadedImages : [];
  const productName = gen.productName || gen.name || "Untitled project";
  const productDescription = gen.productDescription || "No description provided.";
  const aspectRatio = gen.aspectRatio || "9:16";

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this project?');
    if (!confirm) return;
    
    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/project/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    
      setGenerations?.((generations) =>
        generations.filter((gen) => gen.id !== id)
      );
      toast.success(data.message);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
    }
  };

  const handleShare = async () => {
    const url = gen.generatedVideo || gen.generatedImage;

    if (!url) return;

    if (navigator.share) {
      await navigator.share({
        url,
        title: productName,
        text: productDescription,
      });
      return;
    }

    await navigator.clipboard.writeText(url);
  };

  const handleTogglePublished = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/user/publish/${gen.id}`, {
          headers: { Authorization: `Bearer ${token}` }
      })
  
      setGenerations?.((generations) =>
          generations.map((gen) =>
              gen.id === data.project.id
                  ? { ...gen, isPublished: data.isPublished }
                  : gen
          )
      );
  
      toast.success(data.isPublished ? 'Project published' : 'Project unpublished');
  } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
  }
  };

  const handleViewDetails = () => {
    navigate(`/result/${gen.id}`);
    window.scrollTo(0, 0);
  };

  return (
    <article className="group mb-4 break-inside-avoid overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:border-white/20 light:border-slate-200 light:bg-white light:shadow-lg light:shadow-slate-200/60 light:hover:border-violet-200">
      <div
        className={`relative overflow-hidden ${
          aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video"
        }`}
      >
        {gen.generatedImage && (
          <img
            src={gen.generatedImage}
            alt={productName}
            className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${
              gen.generatedVideo
                ? "group-hover:scale-105 group-hover:opacity-0"
                : "hover:scale-105"
            }`}
          />
        )}

        {gen.generatedVideo && (
          <video
            src={gen.generatedVideo}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100"
            muted
            loop
            playsInline
            autoPlay
          />
        )}

        {gen.generatedVideo && (
          <div className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm">
            <VideoIcon className="size-4" />
          </div>
        )}

        {!gen.generatedImage && !gen.generatedVideo && (
          <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-black/20">
            <Loader2Icon className="size-7 animate-spin text-white" />
          </div>
        )}

        {/* action menu for my generations only */}
        {!forCommunity && (
          <div
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
            className="absolute right-3 top-3 z-20 flex flex-col items-end text-sm transition sm:opacity-0 group-hover:opacity-100"
          >
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-full bg-black/40 p-1 text-white backdrop-blur-sm transition hover:bg-black/60"
              aria-label="Project actions"
            >
              <EllipsisIcon className="size-5" />
            </button>

            <ul
              className={`mt-2 w-44 overflow-hidden rounded-lg border border-gray-500/50 bg-black/60 py-1 text-xs text-white shadow-md backdrop-blur light:border-slate-200 light:bg-white/95 light:text-slate-800 ${
                menuOpen ? "block" : "hidden"
              }`}
            >
              {gen.generatedImage && (
                <li>
                  <a
                    href={gen.generatedImage}
                    download
                    className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-black/20 light:hover:bg-slate-100"
                  >
                    <ImageIcon size={14} />
                    Download Image
                  </a>
                </li>
              )}

              {(gen.generatedVideo || gen.generatedImage) && (
                <li>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left hover:bg-black/20 light:hover:bg-slate-100"
                  >
                    <Share2Icon size={14} />
                    Share
                  </button>
                </li>
              )}

              <li>
                <button
                  type="button"
                  onClick={() => handleDelete(gen.id)}
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-red-950/10"
                >
                  <Trash2Icon size={14} />
                  Delete
                </button>
              </li>
            </ul>
          </div>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {gen.isGenerating ? (
            <span className="rounded-full bg-yellow-600/30 px-2 py-1 text-xs text-yellow-100 backdrop-blur-sm">
              Generating
            </span>
          ) : (
            gen.isPublished && (
              <span className="rounded-full bg-emerald-500/30 px-2 py-1 text-xs text-emerald-100 backdrop-blur-sm">
                Published
              </span>
            )
          )}
        </div>

        {uploadedImages.length > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center">
            {uploadedImages[0] && (
              <img
                src={uploadedImages[0]}
                alt="product"
                className="h-16 w-16 animate-float rounded-full border border-white/20 object-cover shadow-lg"
              />
            )}
            {uploadedImages[1] && (
              <img
                src={uploadedImages[1]}
                alt="model"
                className="-ml-8 h-16 w-16 animate-float rounded-full border border-white/20 object-cover shadow-lg"
              />
            )}
          </div>
        )}
      </div>

      <div className="bg-violet-950/40 p-4 light:bg-white">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white light:text-slate-950">
              {productName}
            </h2>
            <p className="mt-1 text-xs text-gray-400 light:text-slate-500">
              Created: {new Date(gen.createdAt).toLocaleString()}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-200 light:bg-violet-100 light:text-violet-700">
            {aspectRatio}
          </span>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs text-gray-400 light:text-slate-500">Description</p>
          <p className="line-clamp-2 rounded-md bg-white/5 px-3 py-2 text-sm text-gray-200 light:bg-slate-100 light:text-slate-700">
            {productDescription}
          </p>
        </div>

        {gen.userPrompt && (
          <div className="mt-3">
            <div className="text-xs text-gray-300 light:text-slate-600">{gen.userPrompt}</div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-400 light:text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            {gen.isGenerating ? (
              <>
                <ClockIcon className="size-4 text-amber-300" />
                Generating
              </>
            ) : (
              <>
                <CheckCircle2Icon className="size-4 text-emerald-300" />
                Ready
              </>
            )}
          </span>

        </div>

        {!forCommunity && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <GhostButton
              type="button"
              className="justify-center text-xs"
              onClick={handleViewDetails}
            >
              View Details
            </GhostButton>
            <PrimaryButton
              type="button"
              onClick={handleTogglePublished}
              className="rounded-md text-xs"
            >
              {gen.isPublished ? "Unpublish" : "Publish"}
            </PrimaryButton>
          </div>
        )}
      </div>
    </article>
  );
};

export default ProjectCard;
