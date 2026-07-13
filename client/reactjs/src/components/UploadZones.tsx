
import { UploadIcon, XIcon } from "lucide-react";
import type { UploadZoneProps } from "../types";

const UploadZone = ({ label, file, onClear, onChange }: UploadZoneProps) => {
  return (
    <div className="relative group">
      <div
        className={`relative h-64 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 ${
          file
            ? "border-violet-600/50 bg-violet-500/5"
            : "border-white/10 hover:border-violet-500/30 hover:bg-white/5 light:border-slate-300 light:bg-white/70 light:hover:border-violet-300 light:hover:bg-white"
        }`}
      >
        {file ? (
          <>
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-60"
            />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl backdrop-blur-sm">
              <button type="button" onClick={onClear}>
                <XIcon className="w-6 h-6 text-white" />
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="cursor-pointer flex flex-col items-center justify-center text-center">
              <UploadIcon className="mb-4 size-10 text-violet-300 light:text-violet-500" />
              <span className="text-lg font-medium text-white light:text-slate-950">{label}</span>
              <span className="text-sm text-gray-400 mt-2 light:text-slate-500">
                Click to upload
              </span>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onChange}
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadZone;
