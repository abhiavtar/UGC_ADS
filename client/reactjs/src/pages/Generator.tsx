import { useState } from "react";
import {
  Loader2Icon,
  RectangleHorizontalIcon,
  RectangleVerticalIcon,
  Wand2Icon,
} from "lucide-react";
import { PrimaryButton } from "../components/Buttons";
import Title from "../components/Title";
import UploadZone from "../components/UploadZones";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import api from "../configs/axios";
import toast from "react-hot-toast";

const Generator = () => {
  const {user} = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [productImage, setProductImage] = useState<File | null>(null);
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [userPrompt, setUserPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "product" | "model"
  ) => {
    if (e.target.files && e.target.files[0]) {
      if (type === "product") {
        setProductImage(e.target.files[0]);
      } else {
        setModelImage(e.target.files[0]);
      }
    }
  };

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

if (!user) return toast('Please login to generate')

if (!productImage || !modelImage || !name || !productName || !aspectRatio)
    return toast('Please fill all the required fields')

try {
  setIsGenerating(true);
  const formData = new FormData();

  formData.append('name', name)
  formData.append('productName', productName)
  formData.append('productDescription', productDescription)
  formData.append('userPrompt', userPrompt)
  formData.append('aspectRatio', aspectRatio)
  formData.append('images', productImage)
  formData.append('images', modelImage)

  const token = await getToken()

  const { data } = await api.post('/api/project/create', formData, {
    headers: { Authorization: `Bearer ${token}` }
})

toast.success(data.message)
navigate('/result/' + data.projectId)

} catch (error: any) {
  setIsGenerating(false);
toast.error(error?.response?.data?.message || error.message)
}

  };

  return (
    <div className="min-h-screen text-white px-6 py-28 md:px-12 light:text-slate-950">
      <form
        onSubmit={handleGenerate}
        className="max-w-5xl mx-auto"
      >
        <Title
          heading="Create In-Context Image"
          description="Upload your model and product images to generate stunning UGC, short-form videos and social media posts"
        />

        <div className="grid gap-10 md:grid-cols-[minmax(280px,380px)_1fr] lg:gap-16 items-start mt-10">
          {/* Left Side */}
          <div className="flex flex-col w-full gap-8">
            <UploadZone
              label="Product Image"
              file={productImage}
              onClear={() => setProductImage(null)}
              onChange={(e) => handleFileChange(e, "product")}
            />

            <UploadZone
              label="Model Image"
              file={modelImage}
              onClear={() => setModelImage(null)}
              onChange={(e) => handleFileChange(e, "model")}
            />
          </div>

          {/* Right Side */}
          <div className="w-full">
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm mb-4"
              >
                Project Name
              </label>

              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your project"
                required
                className="w-full bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none transition-all light:bg-white light:border-slate-200 light:text-slate-950 light:placeholder:text-slate-400"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="productname"
                className="block text-gray-300 light:text-slate-700"
              >
                Product Name
              </label>

              <input
                type="text"
                id="productname"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter the product name"
                required
                className="w-full bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none transition-all light:bg-white light:border-slate-200 light:text-slate-950 light:placeholder:text-slate-400"
              />
            </div>

            <div className="mb-4 text-gray-300 light:text-slate-700">
              <label
                htmlFor="productDescription"
                className="block text-sm mb-4"
              >
                Product Description{" "}
                <span className="text-xs text-violet-400">
                  (optional)
                </span>
              </label>

              <textarea
                id="productDescription"
                rows={4}
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Enter the description of the product"
                className="w-full resize-none bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none transition-all light:bg-white light:border-slate-200 light:text-slate-950 light:placeholder:text-slate-400"
              />
            </div>

            <div className="mb-4 text-gray-300 light:text-slate-700">
              <label className="block text-sm mb-4">
                Aspect Ratio
              </label>

              <div className="flex gap-3">
                <RectangleVerticalIcon
                  onClick={() => setAspectRatio("9:16")}
                  className={`p-2.5 size-13 bg-white/6 rounded transition-all ring-2 ring-transparent cursor-pointer light:bg-white light:border light:border-slate-200 ${
                    aspectRatio === "9:16"
                      ? "ring-violet-500/50 bg-white/10"
                      : ""
                  }`}
                />

                <RectangleHorizontalIcon
                  onClick={() => setAspectRatio("16:9")}
                  className={`p-2.5 size-13 bg-white/6 rounded transition-all ring-2 ring-transparent cursor-pointer light:bg-white light:border light:border-slate-200 ${
                    aspectRatio === "16:9"
                      ? "ring-violet-500/50 bg-white/10"
                      : ""
                  }`}
                />
              </div>

            </div>

            <div className="mb-4 text-gray-300 light:text-slate-700">
              <label
                htmlFor="userPrompt"
                className="block text-sm mb-4"
              >
                User Prompt{" "}
                <span className="text-xs text-violet-400">
                  (optional)
                </span>
              </label>

              <textarea
                id="userPrompt"
                rows={4}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Add extra instructions for the generated image"
                className="w-full resize-none bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none transition-all light:bg-white light:border-slate-200 light:text-slate-950 light:placeholder:text-slate-400"
              />
            </div>

            <div className="pt-2">
              <PrimaryButton
                type="submit"
                disabled={isGenerating}
                className="w-full sm:w-auto sm:min-w-72 px-10 py-3 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2Icon className="size-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2Icon className="size-5" />
                    Generate Image
                  </>
                )}
              </PrimaryButton>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};

export default Generator;
